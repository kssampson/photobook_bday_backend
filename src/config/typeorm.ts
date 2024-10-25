import { registerAs } from "@nestjs/config";
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from "typeorm";

dotenvConfig();

const config = {
    type: 'postgres',
    host: `${process.env.DATABASE_HOST}`,
    port: parseInt(`${process.env.DATABASE_PORT}`, 10),
    username: `${process.env.DATABASE_USERNAME}`,
    password: `${process.env.DATABASE_PASSWORD}`,
    database: `${process.env.DATABASE_NAME}`,
    ssl: {
        rejectUnauthorized: true
    },
    //entities will be in dist -- any folder within dist. In those folders, files will end in .ts or .js
    entities: ["dist/*.entity{.ts,.js}"],
    //where we put the migrations when generate them, then where we look for them to run
    migrations: ["dist/migrations/*{.ts,.js}"],
    autoLoadEntities: true,
    synchronize: true, //
    logging: true,
}

export default registerAs('typeorm', () => config)
export const connectionSource = new DataSource(config as DataSourceOptions)