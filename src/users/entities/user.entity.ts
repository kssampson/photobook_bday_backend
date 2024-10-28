import { Entity, Column, PrimaryGeneratedColumn, OneToMany, OneToOne } from 'typeorm';
import { VisitorId } from './visitorId.entity';
import { Photo } from './photo.entity';
import { Letter } from './letter.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({default: null})
  relation: string;

  @OneToMany(() => VisitorId, (visitorId) => visitorId.user)
  visitorIds: VisitorId[];

  @OneToOne(() => Photo, (photo) => photo.user)
  photos: Photo[];

  @OneToOne(() => Letter, (letter) => letter.user)
  letter: Letter;
}
