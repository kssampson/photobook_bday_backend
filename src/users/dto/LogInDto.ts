import { IsString, IsEmail, IsNotEmpty, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';
import { PartialType } from '@nestjs/mapped-types';


export class LogInDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  username: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  password: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  visitorId: string;
}

export class VerifyEmailDto extends PartialType(LogInDto) {}
