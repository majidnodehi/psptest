import { Entity, PrimaryKey, Property, Index, OneToMany, Collection, ManyToOne } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Click } from './click.entity';
import { User } from './user.entity';

@Entity()
export class Url {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property({ type: 'varchar', length: 255, unique: true })
  slug: string;

  @Property({ type: 'text' })
  originalUrl: string;

  @Property({ type: 'timestamp', defaultRaw: 'current_timestamp' })
  createdAt: Date = new Date();

  @Property({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @Property({ type: 'integer', default: 0 })
  clickCount: number = 0;

  @OneToMany(() => Click, click => click.url)
  clicks = new Collection<Click>(this);

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  constructor(slug: string, originalUrl: string, expiresAt?: Date) {
    this.slug = slug;
    this.originalUrl = originalUrl;
    this.expiresAt = expiresAt;
  }

  incrementClickCount() {
    this.clickCount += 1;
  }

  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return this.expiresAt < new Date();
  }
}