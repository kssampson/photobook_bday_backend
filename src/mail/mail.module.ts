import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { User } from 'src/users/entities/user.entity';
import { OTP } from 'src/users/entities/otp.entity';

@Module({
  providers: [MailService],
  imports: [
    TypeOrmModule.forFeature([VisitorId, User, OTP]),
    MailModule
  ],
  exports: [MailService]
})
export class MailModule {}
