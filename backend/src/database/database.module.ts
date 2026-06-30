import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { envs } from 'src/config/envs';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: envs.database.host,
      port: envs.database.port,
      username: envs.database.user,
      password: envs.database.password,
      database: envs.database.name,
      autoLoadEntities: true,
      synchronize: false,
      migrations: [__dirname + '/migrations/*{.ts,.js}'],
      migrationsRun: envs.nodeEnv !== 'development',
    }),
  ],
  providers: []
})
export class DatabaseModule { }
