import { Body, Controller, Get, Param, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from 'src/users/dto/SignUpDto';
import { LogInDto, VerifyEmailDto } from 'src/users/dto/LogInDto';
import { VerifiedLogInDto } from 'src/users/dto/VerifiedLogInDto';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { OtpDto } from 'src/users/dto/OtpDto';
import { AuthGuard } from './guards/auth.guard';
import { SaveLetterDto } from 'src/users/dto/SaveLetterDto';
import { UsersService } from 'src/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    ){}
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

  @UseGuards(AuthGuard)
  @Post('save-letter')
  async saveLetter(@Body() saveLetterDto: SaveLetterDto) {
    const { id, letterContent, deltaContent } = saveLetterDto;
    const stringifiedDeltaContent = JSON.stringify(deltaContent);
    // console.log('deltaContentStringified: ', stringifiedDeltaContent)
    // const parsedDeltaContent = JSON.parse(stringifiedDeltaContent);
    // console.log('deltaContentParsed: ', parsedDeltaContent)
    return await this.authService.saveLetter(id, letterContent, stringifiedDeltaContent);
  // if (deltaContent.ops && Array.isArray(deltaContent.ops)) {
  //   console.log('deltaContent.ops:', deltaContent.ops);
  // } else {
  //   console.log('deltaContent.ops is not an array or maybe doesn\'t exist');
  // }

  //see each operation:
  /*
  deltaContent.ops.forEach((op, index) => {
    console.log(`Operation ${index}:`, op);
  });
  */
  }

  @UseGuards(AuthGuard)
  @Get('get-letter')
  async getLetter(@Request() req) {
    return await this.userService.getLetter(req.user.id);
  }
}
