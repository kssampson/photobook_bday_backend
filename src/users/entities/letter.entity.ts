import { Entity, PrimaryGeneratedColumn, OneToOne, Column, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Letter {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  letterContent: string;

  @Column('jsonb')
  deltaContent: any

  @OneToOne(() => User, (user) => user.letter)
  @JoinColumn()
  user: User;
}