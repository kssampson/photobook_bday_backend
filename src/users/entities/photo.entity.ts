import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from "./user.entity";

@Entity()
export class Photo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  url1: string;

  @Column({ nullable: true })
  url2: string;

  @ManyToOne(() => User, (user) => user.photos)
  user: User;
}