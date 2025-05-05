import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Module } from '@nestjs/common';
import { ClickService } from './services/click.service';
import { Click } from '../entities/click.entity';
import { UrlController } from './controllers/url.controller';
import { UrlService } from './services/url.service';
import { Url } from 'src/entities/url.entity';


@Module({
  imports: [MikroOrmModule.forFeature([Url, Click])],
  controllers: [UrlController],
  providers: [
    {
      provide: 'IUrlService',
      useClass: UrlService,
    },
    {
      provide: 'IClickService',
      useClass: ClickService,
    }
  ]
})
export class UrlModule { }
