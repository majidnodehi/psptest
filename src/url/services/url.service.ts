import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityManager } from '@mikro-orm/core';
import { IUrlService } from './url.service.interface';
import { CreateUrlDto } from '../dto/create-url.dto';
import { Url } from 'src/entities/url.entity';
import { User } from '../../../src/entities/user.entity';

@Injectable()
export class UrlService implements IUrlService {
  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: EntityRepository<Url>,
    private readonly em: EntityManager
  ) { }

  async createShortUrl(createUrlDto: CreateUrlDto, user?: User): Promise<Url> {
    let slug = createUrlDto.customSlug;

    if (slug) {
      slug = await this.ensureUniqueSlug(slug);
    } else {
      slug = await this.generateUniqueRandomSlug();
    }

    const url = new Url(slug, createUrlDto.originalUrl, createUrlDto.expiresAt);
    if (user) {
      url.user = user;
    }
    await this.em.persistAndFlush(url);
    return url;
  }

  private async ensureUniqueSlug(originalSlug: string, attempt = 1): Promise<string> {
    if (attempt === 1) {
      const exists = await this.slugExists(originalSlug);
      if (!exists) return originalSlug;
    }

    const newSlug = `${originalSlug}-${attempt}`;
    const exists = await this.slugExists(newSlug);

    if (!exists) return newSlug;

    return this.ensureUniqueSlug(originalSlug, attempt + 1);
  }

  private async slugExists(slug: string): Promise<boolean> {
    const existingUrl = await this.urlRepository.findOne({ slug });
    return !!existingUrl;
  }

  async findBySlug(slug: string): Promise<Url | null> {
    return this.urlRepository.findOne({ slug });
  }

  async incrementClickCount(urlId: string): Promise<void> {
    const url = await this.urlRepository.findOne(urlId);
    if (url) {
      url.incrementClickCount();
      await this.em.flush();
    }
  }

  async deleteBySlug(slug: string, user?: User): Promise<boolean> {
    const url = await this.findBySlug(slug);
    if (!url) {
      return false;
    }

    if (user && url.user && url.user.id !== user.id) {
      throw new UnauthorizedException('You are not authorized to delete this URL');
    }

    await this.em.removeAndFlush(url);
    return true;
  }

  private async generateUniqueRandomSlug(length = 8): Promise<string> {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result: string;
    let exists: boolean;

    do {
      result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      exists = await this.slugExists(result);
    } while (exists);

    return result;
  }
}