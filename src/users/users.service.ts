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
  async findOneWithEmail(email: string) {
    try {
      const user = await this.userRepository.findOneOrFail( { where: {email: email} })
      return user;
    } catch (error) {
      return null;
    }
  }
}

