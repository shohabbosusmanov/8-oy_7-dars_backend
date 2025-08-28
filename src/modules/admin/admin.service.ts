import { HttpException, Injectable } from '@nestjs/common';
import { CreateQuestionDto } from './dto/create-question.dto';
import { PrismaService } from 'src/core/database/prisma.service';
import { QuestionAnswer } from './dto/question-answer.dto';

@Injectable()
export class AdminService {
  constructor(private db: PrismaService) {}
  async createQuestion(createQuestionDto: CreateQuestionDto) {
    try {
      const result = await this.db.prisma.$transaction(async (tx) => {
        const question = await tx.userProfileQuestions.create({
          data: {
            question_text: createQuestionDto.question_text,
            question_type: createQuestionDto.question_type,
            is_required: createQuestionDto.is_required ? true : false,
            step_number: createQuestionDto.step_number,
          },
        });

        if (
          Array.isArray(createQuestionDto.options) &&
          createQuestionDto.options.length > 0
        ) {
          const optionsPromises = createQuestionDto.options.map(
            ({ option_text, option_value }) =>
              tx.questionOptions.create({
                data: {
                  question_id: question.id,
                  option_text,
                  option_value,
                },
              }),
          );

          await Promise.all(optionsPromises);
        }

        return {
          message: 'success',
          question_id: question.id,
        };
      });

      return result;
    } catch (error) {
      throw new HttpException(
        error.message || 'Internal server error',
        error.statusCode || 500,
      );
    }
  }

  async getQuestions(step_number: number) {
    const questions = await this.db.prisma.userProfileQuestions.findMany({
      where: {
        step_number,
      },
      include: {
        options: true,
      },
    });
    return questions;
  }

  async addAnswerQuestion(questionAnswer: QuestionAnswer) {
    await this.db.prisma.userProfileQuestionAnswers.create({
      data: {
        user_id: questionAnswer.user_id,
        answer_text: questionAnswer.answer_text,
        question_id: questionAnswer.question_id,
      },
    });
    if (questionAnswer?.answer_options) {
      const answerOptions = questionAnswer.answer_options.map(
        ({ answer_id, option_id }) => {
          return this.db.prisma.selectedAnswerOptions.create({
            data: {
              option_id,
              answer_id,
            },
          });
        },
      );
      await Promise.all([...answerOptions]);
      return {
        message: 'Answers added',
      };
    }
  }
}
