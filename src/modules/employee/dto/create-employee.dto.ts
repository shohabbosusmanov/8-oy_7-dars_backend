import { IsString, IsOptional, IsBoolean, IsUrl } from 'class-validator';

export class CreateEmployeeDto {
  @IsString()
  fullName: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsUrl()
  photoUrl?: string;

  @IsOptional()
  @IsBoolean()
  workloadSection?: boolean;
}
