import { Injectable } from '@nestjs/common';
import { sendMail } from './mail';
import { emailVerificationTemplate } from './emailVerificationTemplate';
import { JwtService } from '@nestjs/jwt';
import { otpGen } from 'otp-gen-agent';
import { InjectRepository } from '@nestjs/typeorm';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { OTP } from 'src/users/entities/otp.entity';
import * as bcrypt from 'bcrypt';
require('dotenv').config();

@Injectable()
export class MailService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(VisitorId)
    private visitorIdRepository: Repository<VisitorId>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
    ) {}

  async initiateTwoFA(username: string, email: string, visitorId: string) { //consider passing the whole record instead of doing another database read for the visitorRecord
    // create one time password
    const otpCode = await otpGen();
    const createdAt = new Date();
    //set expiration for 1 hour
    const expiresAt = new Date(createdAt.getTime() + 60 * 60 * 1000);
    //Find user and visitorRecord
    const user = await this.userRepository.findOne({ where: [{ username }] });
    const visitorRecord = await this.visitorIdRepository.findOne({
      where: { visitorId, user: { id: user.id } },
      relations: ['user','otp']
    })

    const newOtp = this.otpRepository.create({
      otp: otpCode,
      createdAt: createdAt,
      expiresAt: expiresAt,
      visitorId: visitorRecord //typeORM should map to this as the entity, not a copy this current visitorRecord in time as it appears. Postgres does this for us and typeORM just hooks into that.
    })

    try {
      // Save the OTP record
      await this.otpRepository.save(newOtp);

      // Send email with OTP
      const mailOptions = {
          from: process.env.GMAIL_USER,
          to: email,
          subject: 'Your OTP Code',
          html: emailVerificationTemplate(otpCode, expiresAt)
      };
      try {
        await sendMail(mailOptions);
        // return { success: true, message: 'OTP sent to your email.' };
        return { success: false, needs2Fa: true, message: 'Please check your email and proceed with two factor authentication' }
      } catch (error) {
        return { success: false, message: 'Failed to send email. Please try again.' };
      }
    } catch (error) {
        console.error('Error saving OTP:', error);
        return { success: false, message: 'Failed to save OTP. Please try again.' };
    }
  }
}


