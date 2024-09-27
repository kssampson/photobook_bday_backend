import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { VisitorId } from './visitorId.entity';

@Entity()
export class OTP {

  @PrimaryGeneratedColumn()
  id: number;

  @Column( { nullable: true })
  otp: string;

  @Column({ type: 'timestamp', nullable: true })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @OneToOne(() => VisitorId, visitorId => visitorId.otp)
  visitorId: VisitorId;
}