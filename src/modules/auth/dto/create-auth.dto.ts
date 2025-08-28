import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class AnswerDto {
  @IsString()
  question_id: string;

  @IsString()
  @IsOptional()
  answer_text?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  option_ids?: string[];
}

export class CreateAuthDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  full_name: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
