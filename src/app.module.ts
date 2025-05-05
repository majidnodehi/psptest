import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UrlModule } from './url/url.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    DatabaseModule,
    UrlModule,
    AuthModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
