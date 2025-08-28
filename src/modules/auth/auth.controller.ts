import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifySmsCodeDto } from './dto/verify.sms.code.dto';
import { LoginAuthDto } from './dto/loginAuthDto';
import { CreateAuthDto } from './dto/create-auth.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MailService } from './mail.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private mailservice: MailService,
  ) {}
  @Post('send-otp')
  @HttpCode(200)
  async sendOtp(@Body() body: SendOtpDto) {
    try {
      return await this.authService.sendOtp(body);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
  @Post('verify-otp')
  @HttpCode(200)
  async verifyOtp(@Body() body: VerifySmsCodeDto) {
    const { phone_number, code } = body;
    try {
      return await this.authService.verifyOtp(phone_number, code);
    } catch (error) {
      throw new HttpException(error.message, error.status);
    }
  }
  @Get('check')
  async checkAuth(@Req() req: Request) {
    const token = req.cookies['access_token'];
    if (!token) return false;
    return true;
  }

  @Post('register')
  async register(
    @Body() createAuthDto: CreateAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, data } =
      await this.authService.register(createAuthDto);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 60 * 60 * 1000,
    });

    return { message: 'success', data };
  }

  @Post('login')
  @HttpCode(200)
  async login(
    @Body() loginAuthDto: LoginAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { access_token, data } = await this.authService.login(loginAuthDto);

    res.cookie('access_token', access_token, {
      httpOnly: true,
      path: '/',
      maxAge: loginAuthDto.rememberMe
        ? 7 * 24 * 60 * 60 * 1000
        : 60 * 60 * 1000,
      secure: false,
      sameSite: 'lax',
    });

    return { access_token, data };
  }

  @Post('check-user')
  async checkUser(@Body() body: { email: string; phone_number: string }) {
    const isUnique = await this.authService.checkUser(body);
    return { isUnique };
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logged out successfully' };
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
