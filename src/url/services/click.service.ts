import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { Click } from '../../entities/click.entity';
import { IClickService } from './click.service.interface';
import { Url } from 'src/entities/url.entity';

@Injectable()
export class ClickService implements IClickService {
  constructor(
    @InjectRepository(Click)
    private readonly clickRepository: EntityRepository<Click>,
    private readonly em: EntityManager
  ) { }

  async trackClick(url: Url, ip?: string, userAgent?: string, referrer?: string): Promise<Click> {
    const click = new Click(url, ip, userAgent, referrer);
    await this.em.persistAndFlush(click);
    return click;
  }

  async getClickStats(urlId: string): Promise<any> {
    return this.clickRepository.find({ url: urlId }, {
      populate: ['url'],
      orderBy: { clickedAt: 'DESC' }
    });
  }
}