import { ConsoleLogger, Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { VisitorId } from './entities/visitorId.entity';
import { MailService } from 'src/mail/mail.service';
import { OTP } from './entities/otp.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VisitorId)
    private visitorIdRepository: Repository<VisitorId>,
    private readonly mailService: MailService,
    @InjectRepository(OTP)
    private otpRepository: Repository<OTP>,
    @Inject(forwardRef(() => AuthService))
    private authService: AuthService,
  ){}

  async signUp(username: string, email: string, password: string, visitorId: string) {
    const userExists = await this.checkUserExists(email, visitorId);
    if (userExists) {
      return userExists;
    }
    //Create a new user and save user to user
    const newUser = this.userRepository.create({ username, email, password});
    const savedUser = await this.userRepository.save(newUser);
    //Create and save the visitorId record
    const newVisitorId = this.visitorIdRepository.create({ visitorId, user: savedUser })
    await this.visitorIdRepository.save(newVisitorId);
    return {success: true, message: 'Sign-up Successful'}
  }

  async logIn(username: string, password: string, visitorId: string) {
    try {
      // Fetch the user along with their associated visitorIds and OTP records
      const user = await this.userRepository.findOne({
        where: { username },
        relations: ['visitorIds', 'visitorIds.otp']
      });

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
      // const payload = { username: user.username, sub: user.id };
      // const token = this.jwtService.signAsync(payload);
      const createTokenWithUser = await this.authService.createAccessToken(user);
      const { token, id } = createTokenWithUser;
      return { success: true, message: 'You are successfully logged in. Welcome!', token, id}

    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async processOtp(otp: string, username: string, password: string, visitorId: string) {
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

  async checkUserExists(email: string, visitorId: string) {
    const existingByEmail = await this.userRepository.findOne({
      where: [{ email }]
    });
    if (existingByEmail) {
      return {success: false, message: 'Email Already Exists. Have you already signed up?'}
    }
    const existingByVisitorId = await this.visitorIdRepository.findOne({
      where: { visitorId },
    });
    if (existingByVisitorId) {
      return {success: false, message: 'Hmm, something\'s not quite right. Have you already signed up?'}
    }
    return null;
  }
}

