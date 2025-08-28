import {
  BadRequestException,
  Body,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { PrismaService } from 'src/core/database/prisma.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { OtpService } from './otp.service';
import { LoginAuthDto } from './dto/loginAuthDto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { v4 as uuid } from 'uuid';
import { RedisService } from 'src/core/database/redis.service';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly mailer: MailService,
    private readonly redis: RedisService,
    private readonly otpService: OtpService,
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}
  async sendOtp(body: SendOtpDto) {
    const { phone_number } = body;
    const data = await this.otpService.sendSms(phone_number);
    return data;
  }

  async verifyOtp(phone_number: string, code: string) {
    await this.otpService.isBlockedUser(phone_number);
    await this.otpService.verifyOtpCode(phone_number, code);
    return {
      message: 'success',
    };
  }

  async checkUser(body) {
    const user = await this.db.prisma.user.findFirst({
      where: {
        OR: [{ email: body.email }, { phone_number: body.phone_number }],
      },
    });

    return !user;
  }

  async register(dto: CreateAuthDto) {
    try {
      const result = await this.db.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: dto.email,
            full_name: dto.full_name,
            phone_number: dto.phone_number,
            password: await bcrypt.hash(dto.password, 10),
          },
        });

        const uniqueAnswersMap = new Map<string, any>();
        for (const ans of dto.answers) {
          if (!uniqueAnswersMap.has(ans.question_id)) {
            uniqueAnswersMap.set(ans.question_id, ans);
          }
        }
        const filteredAnswers = Array.from(uniqueAnswersMap.values());

        for (const answer of filteredAnswers) {
          const options = answer.option_ids?.length
            ? await tx.questionOptions.findMany({
                where: { id: { in: answer.option_ids } },
              })
            : [];

          const answerText = options.length
            ? options.map((opt) => opt.option_text).join(', ')
            : (answer.answer_text ?? '');

          const savedAnswer = await tx.userProfileQuestionAnswers.upsert({
            where: {
              user_id_question_id: {
                user_id: user.id,
                question_id: answer.question_id,
              },
            },
            create: {
              user_id: user.id,
              question_id: answer.question_id,
              answer_text: answerText,
            },
            update: {
              answer_text: answerText,
            },
          });

          if (answer.option_ids?.length) {
            await tx.selectedAnswerOptions.deleteMany({
              where: { answer_id: savedAnswer.id },
            });
            await tx.selectedAnswerOptions.createMany({
              data: answer.option_ids.map((option_id) => ({
                answer_id: savedAnswer.id,
                option_id,
              })),
            });
          }
        }

        return user;
      });

      const payload = { sub: result.id, email: result.email };
      const access_token = await this.jwt.signAsync(payload);

      return { access_token, data: { id: result.id, email: result.email } };
    } catch (error: any) {
      console.error('Register error:', error);
      throw new HttpException(
        error.message || 'Registration failed',
        error.statusCode || 500,
      );
    }
  }

  async login(loginAuthDto: LoginAuthDto) {
    const findEmail = await this.db.prisma.user.findUnique({
      where: {
        email: loginAuthDto.email,
      },
    });

    if (!findEmail) throw new NotFoundException('Email or password incorrect');

    const comparePassword = await bcrypt.compare(
      loginAuthDto.password,
      findEmail.password,
    );

    if (!comparePassword)
      throw new NotFoundException('Email or password incorrect');

    const access_token = await this.jwt.signAsync({ sub: findEmail.id });

    const { password, ...data } = { ...findEmail };

    return { access_token, data };
  }

  async forgotPassword(email: string) {
    const user = await this.db.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const token = uuid();
    const redisKey = `reset-password:${token}`;
    const expireSeconds = 60 * 60;

    await this.redis.addKey(redisKey, user.id, expireSeconds);

    const resetUrl = `http//:localhost:5173/reset-password?token=${token}`;
    await this.mailer.sendResetPasswordEmail(email, resetUrl);

    return { message: 'Reset email sent' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, password, confirmPassword } = dto;

    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const redisKey = `reset-password:${token}`;
    const userId = await this.redis.getKeyValue(redisKey);

    if (!userId) {
      throw new BadRequestException('Invalid or expired token');
    }

    const hashed = await bcrypt.hash(password, 10);

    await this.db.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    await this.redis.delKey(redisKey);

    return { message: 'Password reset successful' };
  }
}
