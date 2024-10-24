import { Body, Controller, Delete, Get, Param, Post, Query, Req, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from 'src/users/dto/SignUpDto';
import { LogInDto, VerifyEmailDto } from 'src/users/dto/LogInDto';
import { VerifiedLogInDto } from 'src/users/dto/VerifiedLogInDto';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { OtpDto } from 'src/users/dto/OtpDto';
import { AuthGuard } from './guards/auth.guard';
import { SaveLetterDto } from 'src/users/dto/SaveLetterDto';
import { UsersService } from 'src/users/users.service';
import { FilesInterceptor } from '@nestjs/platform-express';

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
    return await this.authService.getUserProfile(req.user.email)
  }

  @UseGuards(AuthGuard)
  @Post('save-letter')
  async saveLetter(@Body() saveLetterDto: SaveLetterDto) {
    const { id, letterContent, deltaContent } = saveLetterDto;
    const stringifiedDeltaContent = JSON.stringify(deltaContent);
    return await this.authService.saveLetter(id, letterContent, stringifiedDeltaContent);
  }
  @UseGuards(AuthGuard)
  @Post('save-photo')
  @UseInterceptors(FilesInterceptor('files'))
  async uploadFile(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body('id') id: string
    ) {
      //id comes in as str from formData
      let userId = Number(id);
      return await this.userService.savePhoto(userId, files)
  }

  @UseGuards(AuthGuard)
  @Get('get-photos')
  async getPhotos(@Request() req) {
    return await this.userService.getPhotos(req.user.id)
  }
  @UseGuards(AuthGuard)
  @Delete('delete-photo')
  async deletePhoto(@Req() req) {

  }

  @UseGuards(AuthGuard)
  @Get('get-letter')
  async getLetter(@Request() req) {
    return await this.userService.getLetter(req.user.id);
  }
}
