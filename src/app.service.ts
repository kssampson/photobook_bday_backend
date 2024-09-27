import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/entities/user.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}
  async addUserDetails(name: string, email: string) {
    const result = await this.usersRepository.save({name, email})
    return await this.getUserDetails();
  }
  async getUserDetails() {
    return await this.usersRepository.find();
  }
}
