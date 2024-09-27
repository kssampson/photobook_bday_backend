import { IsString, IsNotEmpty} from 'class-validator';
import { Transform } from 'class-transformer';
import * as sanitizeHtml from 'sanitize-html';


export class OtpDto {
  @IsNotEmpty()
  @IsString()
  @Transform(({ value }) => sanitizeHtml(value))
  otp: string;

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
