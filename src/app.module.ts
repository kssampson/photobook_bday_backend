import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { Name } from './name.entity';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import typeorm from './config/typeorm';
import { User } from './users/entities/user.entity';
import { MailModule } from './mail/mail.module';
import { Letter } from './users/entities/letter.entity';
import { Photo } from './users/entities/photo.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm]
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => configService.get('typeorm')
    }),
    TypeOrmModule.forFeature([User, Photo, Letter]),
    AuthModule,
    UsersModule,
    MailModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
