import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  url1: string;

  @Column({ nullable: true })
  url2: string;

  @OneToOne(() => User, (user) => user.photos)
  @JoinColumn()
  user: User;
}