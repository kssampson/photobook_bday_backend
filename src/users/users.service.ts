import sanitizeHtml from 'sanitize-html';
// import Quill from 'quill';
import { EntityManager } from 'typeorm';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { VisitorId } from './entities/visitorId.entity';
import { MailService } from 'src/mail/mail.service';
import { Letter } from './entities/letter.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VisitorId)
    private visitorIdRepository: Repository<VisitorId>,
    @InjectRepository(Letter)
    private letterRepository: Repository<Letter>,
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

  async findOneWithId(id: number) {
    try {
      const user = await this.userRepository.findOneOrFail( { where: {id: id} })
      return user;
    } catch (error) {
      return null;
    }
  }

  // async sanitizeDelta(deltaContent: any) {
  //   const quill = new Quill(document.createElement('div'));
  //   quill.setContents(deltaContent);

  //   const deltaAsHtml = quill.root.innerHTML;

  //   const sanitizedHtml = sanitizeHtml(deltaAsHtml, {
  //     //****def check an make sure you're getting everything you need to keep from the delta. This logic could screw everything up, becareful!!!***
  //     allowedTags: ['b', 'i', 'u', 'strong', 'p', 'br'],
  //   });

  //   quill.root.innerHTML = sanitizedHtml;
  //   return quill.getContents();
  // }

  async saveLetter(id: number, letterContent: string, stringifiedDeltaContent: JSON) {
    // const sanitizedDelta = await this.sanitizeDelta(deltaContent);
    //find the user by their id
    const user = await this.findOneWithId(id);
    if (!user) {
      throw new NotFoundException('User not found!')
    }
    this.userRepository.manager.transaction(async (entityManager: EntityManager) => {
      let letter = await entityManager.findOne(Letter, { where: { user: { id: user.id } } });

      if (!letter) {
        letter = new Letter();
        letter.user = user;
      }

      letter.letterContent = letterContent;
      letter.deltaContent = stringifiedDeltaContent;

      await entityManager.save(Letter, letter);
    })


    //save the letterContent, deltaContent at the correct user, will have to match the entity naming conventions, etc.
    return { success: true, message: "Letter saved successfully." }
  }

  async getLetter(id: number) {
    const user = await this.userRepository.findOne({
      where: { id: id },
      relations: ['letter'],
    });
    if (!user) {
      console.log('no user!')
      throw new UnauthorizedException('User not found!')
    }

    console.log('user: ', JSON.parse(user.letter.deltaContent))

    const letterContent = user.letter.letterContent;
    const deltaContent = JSON.parse(user.letter.deltaContent);

    // console.log('deltaContent in getLetter user.service: ', deltaContent)
    return { success: true, message: "Letter retrieved", letterContent, deltaContent }
  }
}

