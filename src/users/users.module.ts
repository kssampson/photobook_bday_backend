import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { VisitorId } from './entities/visitorId.entity';
import { OTP } from './entities/otp.entity';
import { MailService } from 'src/mail/mail.service';
import { MailModule } from 'src/mail/mail.module';
import { AuthModule } from 'src/auth/auth.module';
import { AuthService } from 'src/auth/auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, VisitorId, OTP]),
    MailModule,
  ],
  providers: [UsersService, AuthService],
  exports: [UsersService]
})
export class UsersModule {}
