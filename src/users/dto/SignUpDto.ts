import { IsString, IsEmail, IsNotEmpty, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';


export class SignUpDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  username: string;

  @IsNotEmpty()
  @IsEmail()
  @Transform(({ value }) => sanitizeHtml(value))
  email: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  password: string;

  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  visitorId: string;

}
