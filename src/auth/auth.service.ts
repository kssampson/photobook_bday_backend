import { Injectable } from '@nestjs/common';
import { SignUpDto } from 'src/users/dto/SignUpDto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { LogInDto} from 'src/users/dto/LogInDto';
import { MailService } from 'src/mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { OtpDto } from 'src/users/dto/OtpDto';
import { jwtConstants } from './constants';
import { User } from 'src/users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { VisitorId } from 'src/users/entities/visitorId.entity';
import { Repository } from 'typeorm';
import { OTP } from 'src/users/entities/otp.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private userService: UsersService,
    private mailService: MailService,
    private jwtService: JwtService,
    @InjectRepository(VisitorId)
    private visitorIdRepository: Repository<VisitorId>,
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
    ){}

  async signUp(signUpDto: SignUpDto) {
    signUpDto.password = await bcrypt.hash(signUpDto.password, 10);
    const { username, email, password, visitorId } = signUpDto;
    const result = await this.userService.signUp(username, email, password, visitorId);
    return result;
  }

  async logIn(username: string, password: string, visitorId: string) {
    try {
      // Fetch the user along with their associated visitorIds and OTP records
      const user = await this.userRepository.findOne({
        where: { username },
        relations: ['visitorIds', 'visitorIds.otp']
      });
      //they might not be a user at all, but we don't want to return extra info to potential bad actors
      if (!user) {
        return { success: false, invalidUsername: true, message: 'Invalid username!' };
      }

      // Validate the password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, invalidPassword: true, message: 'Invalid password!' };
      }

      // Check if the visitor record associated with the input visitorId exists
      let visitorRecord = user.visitorIds.find(v => v.visitorId === visitorId);

      if (!visitorRecord) {
        // VisitorId does not exist, create a new record and initiate 2FA
        visitorRecord = this.visitorIdRepository.create({
          visitorId,
          user,
        });
        await this.visitorIdRepository.save(visitorRecord);

        // Initiate 2FA
        return await this.mailService.initiateTwoFA(user.username, user.email, visitorId);
      }

      // Check if the visitor record has completed 2FA
      if (!visitorRecord.twoFA) {
        // Initiate 2FA
        return await this.mailService.initiateTwoFA(user.username, user.email, visitorId);
      }

      // If 2FA is complete
      const createTokenWithUser = await this.createAccessToken(user);
      console.log()
      const { token} = createTokenWithUser;
      return { success: true, message: 'You are successfully logged in. Welcome!', token}

    } catch (error) {
      console.log('Error in user.servcie login catch block')
      return { success: false, message: error.message };
    }

  }
  async processOtp(otpDto: OtpDto) {
    const { otp, username, password, visitorId } = otpDto;
    //find user
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      return { success: false, message: 'Incorrect username or user not found.' };
    }
    //verify current visitorId is found with the user credentials
    const visitorRecord = await this.visitorIdRepository.findOne({
      where: { visitorId, user: { id: user.id } },
      relations: ['user', 'otp'],
    });
    //validate the input otp matches the one in the database
    const otpRecord = await this.otpRepository.findOne({
      where: { otp: otp, visitorId: visitorRecord },
    });
    if (!otpRecord) {
      return { success: false, otpInvalid: true, message: 'Invalid OTP.' };
    }
    //check if OTP is expired
    const now = new Date();
    if (now > otpRecord.expiresAt) {
      // Remove the expired OTP record. Brutal hack, just set up things to null until cascade is set up
      otpRecord.otp = null;
      otpRecord.createdAt = null;
      otpRecord.expiresAt = null;
      await this.otpRepository.save(otpRecord);
      return { success: false, otpExpired: true, message: 'OTP has expired.' };
    }
    //update 2fa status to true
    visitorRecord.twoFA = true;
    await this.visitorIdRepository.save(visitorRecord);
    //cleanup the otp table. Again, brutal hack, but just set to null until cascade is set up
    otpRecord.otp = null;
    otpRecord.createdAt = null;
    otpRecord.expiresAt = null;
    await this.otpRepository.save(otpRecord);

    await this.logIn(visitorRecord.user.username, visitorRecord.user.password, visitorRecord.visitorId)
    return { success: true, message: 'OTP verified successfully. Two-factor authentication is now complete.' };
  }
  async createAccessToken(user: User) {
    const payload = { username: user.username, sub: user.id };
    const token = await this.jwtService.signAsync(payload, { secret: jwtConstants.secret });
    console.log('created token. token: ', token)
    return { ...user, token}
  }
  async getUserProfile(email: string) {
    const user = await this.userService.findOneWithEmail(email);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
    }
  }
}