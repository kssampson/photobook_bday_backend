import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from 'src/users/dto/SignUpDto';
import { LogInDto, VerifyEmailDto } from 'src/users/dto/LogInDto';
import { VerifiedLogInDto } from 'src/users/dto/VerifiedLogInDto';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { OtpDto } from 'src/users/dto/OtpDto';
import { AuthGuard } from './guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService){}
  @Post('sign-up')
  async signUp(@Body() signUpDto: SignUpDto) {
    const result = await this.authService.signUp(signUpDto);
    return result;
  }
  // @UseGuards(AuthGuard)
  @Post('log-in')
  async logIn(@Body() logInDto: LogInDto) {
    const { username, password, visitorId } = logInDto;
    const result = await this.authService.logIn(username, password, visitorId);
    return result;
  }
  @Post('process-otp')
  async processOtp(@Body() otpDto: OtpDto) {
    const result = await this.authService.processOtp(otpDto);
    return result;
  }
  //use guards when getting profle info for the user, and any posts, etc
  @UseGuards(AuthGuard)
  @Get('get-user')
  async getUserProfile(@Request() req) {
    console.log('getUserProfile. req: ', req)
    return await this.authService.getUserProfile(req.user.email)
  }
}
