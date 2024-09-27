import { Entity, PrimaryGeneratedColumn, OneToOne, Column, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Letter {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  content: string;

  @OneToOne(() => User, (user) => user.letter)
  @JoinColumn()
  user: User;
}