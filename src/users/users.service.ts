import sanitizeHtml from 'sanitize-html';
import { EntityManager } from 'typeorm';
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { VisitorId } from './entities/visitorId.entity';
import { MailService } from 'src/mail/mail.service';
import { Letter } from './entities/letter.entity';
import * as AWS from 'aws-sdk';
import { Photo } from './entities/photo.entity';

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
    @InjectRepository(Photo)
    private photoRepository: Repository<Photo>
  ){
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.BUCKET_REGION,
    });
  }

  private s3: AWS.S3;

  async signUp(relation: string, username: string, email: string, password: string, visitorId: string) {
    const userExists = await this.checkUserExists(email, visitorId);
    if (userExists) {
      return userExists;
    }
    //Create a new user and save user to user
    const newUser = this.userRepository.create({ relation, username, email, password});
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
    // if (existingByVisitorId) {
    //   // //if they exist, count how many times this visitorId occurs in the db
    //   // console.log('existingByVisitorId: ', existingByVisitorId)
    //   // const visitorIDCount = await this.visitorIdRepository.count({
    //   //   where: {visitorId}
    //   // })
    //   // console.log('visitorIdCount: ', visitorIDCount)
    //   // //if more than two times, then more than two people have signed up on that visitorId
    //   // if (visitorIDCount && visitorIDCount >= 2) {
    //   //   return {success: false, message: 'The visitor id has been used too many times'}
    //   // }
    //   return {success: false, message: 'Hmm, something\'s not quite right. Have you already signed up?'}
    // }
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

  async saveLetter(id: number, letterContent: string, stringifiedDeltaContent: JSON) {
    const user = await this.findOneWithId(id);
    if (!user) {
      throw new NotFoundException('User not found!')
    }

      let letter = await this.letterRepository.findOne({ where: { user: { id: user.id } } });

      if (!letter) {
        letter = new Letter();
        letter.user = user;
      }

      letter.letterContent = letterContent;
      letter.deltaContent = stringifiedDeltaContent;

      await this.letterRepository.save(letter);


    return { success: true, message: "Letter saved successfully." }
  }

  async getLetter(id: number) {
    const user = await this.userRepository.findOneOrFail({
      where: { id: id },
      relations: ['letter'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found!')
    }

    const letterContent = user.letter.letterContent;
    const deltaContent = JSON.parse(user.letter.deltaContent);

    return { success: true, message: "Letter retrieved", letterContent, deltaContent }
  }

  async savePhoto(id: number, files: Array<Express.Multer.File>) {

    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.BUCKET_REGION,
    });

    const photo = new Photo();
    photo.user = user;

    const file1 = files[0];
    const file1Key = `user-${id}/file1-${file1.originalname}`;
    const file1Params = {
      Bucket: process.env.BUCKET_NAME,
      Key: file1Key,
      Body: file1.buffer,
      ContentType: file1.mimetype,
    };

    try {
      const file1Upload = await s3.upload(file1Params).promise();
      photo.url1 = file1Upload.Location;
    } catch (error) {
      throw new Error('File 1 failed to upload');
    }

    try {
      await this.photoRepository.save(photo);
      return { success: true, message: 'Photos uploaded and saved successfully!', url1: photo.url1 };
    } catch (error) {
      console.error('Error saving photo entity:', error);
      throw new Error('Error saving photo information to database');
    }
  }

  async deletePhoto(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const photo = await this.photoRepository.find({
      where: {user: user}
    })

    if (!photo[0]) {
      throw new NotFoundException('Photo not found');
    }

    //Photo[] was desgined an array of objects to save more photos if desired in future implementation. Use photo[0] for the single photo currently allowed
    const key = photo[0].url1.split('/').pop();
    const deleteParams = {
      Bucket: process.env.BUCKET_NAME,
      Key: `user-${user.id}/${key}`
    }

    //delete from bucket
    try {
      await this.s3.deleteObject(deleteParams).promise();
    } catch (error) {
      console.error('Error deleting file from S3:', error);
        throw new Error('Failed to delete photo from S3');
    }

    //delete the photo record in the database
    try {
      await this.photoRepository.delete(photo[0])
    } catch (error) {
      console.error('Error deleting photo from database:', error);
      throw new Error('Failed to delete photo from database');
    }
    return { success: true, message: 'photo deleted from database' }
  }

  private signUrl(key: string): string {
    const params = {
      Bucket: process.env.BUCKET_NAME,
      Key: key,
      Expires: 60 * 60,
    };
    return this.s3.getSignedUrl('getObject', params);
  }

  async getPhotos(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['photos'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const photos = await this.photoRepository.find({
      where: { user: user },
    });

    // Check if photos exist and sign their URLs
    if (photos) {
      return photos;
    }
    return null;
  }

}


