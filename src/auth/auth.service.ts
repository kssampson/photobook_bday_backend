import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/users/dto/SignUpDto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { LogInDto, VerifyEmailDto } from 'src/users/dto/LogInDto';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { VerifiedLogInDto } from 'src/users/dto/VerifiedLogInDto';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { OtpDto } from 'src/users/dto/OtpDto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UsersService,
    private mailService: MailService,
    private jwtService: JwtService,
    ){}
  async signUp(signUpDto: SignUpDto) {
    signUpDto.password = await bcrypt.hash(signUpDto.password, 10);
    const { username, email, password, visitorId } = signUpDto;
    const result = await this.userService.signUp(username, email, password, visitorId);
    return result;
  }
  async logIn(logInDto: LogInDto) {
    const { username, password, visitorId } = logInDto;
    const result = await this.userService.logIn(username, password, visitorId);
    return result;
  }
  async processOtp(otpDto: OtpDto) {
    const { otp, username, password, visitorId } = otpDto;
    const result = await this.userService.processOtp(otp, username, password, visitorId)
    return result;
  }
  async createAccessToken(user, secret?: string) {
    const payload = { username: user.username, sub: user.id };
    if (secret) {
      return this.jwtService.signAsync(payload, { secret, expiresIn: "10m" });
    } else {
      return {
        ...user,
        token: await this.jwtService.signAsync(payload)
      }
    }
  }
}