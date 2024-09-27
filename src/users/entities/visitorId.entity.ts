import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { OTP } from './otp.entity';

@Entity()
export class VisitorId {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  visitorId: string;

  @Column({ default: false })
  twoFA: boolean;

  @ManyToOne(() => User, (user) => user.visitorIds)
  user: User;

  @OneToOne(() => OTP, otp => otp.visitorId)
  @JoinColumn()
  otp: OTP;
}