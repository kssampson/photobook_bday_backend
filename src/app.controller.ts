import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getUserDetails(){
    return this.appService.getUserDetails();
  }

  @Post('/userDetails')
  async addUserDetails(@Body() body: { name: string; email: string }) {
    const { name, email } = body;
    return await this.appService.addUserDetails(name, email);
  }
}
