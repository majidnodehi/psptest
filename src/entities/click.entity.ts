import { Entity, PrimaryKey, Property, ManyToOne, DateTimeType } from '@mikro-orm/core';
import { v4 as uuidv4 } from 'uuid';
import { Url } from './url.entity';

@Entity()
export class Click {
  @PrimaryKey({ type: 'uuid' })
  id: string = uuidv4();

  @Property({ type: DateTimeType, defaultRaw: 'current_timestamp' })
  clickedAt: Date = new Date();

  @Property({ type: 'varchar', length: 45, nullable: true })
  ipAddress?: string;

  @Property({ type: 'text', nullable: true })
  userAgent?: string;

  @Property({ type: 'text', nullable: true })
  referrer?: string;

  @ManyToOne(() => Url)
  url: Url;

  constructor(url: Url, ipAddress?: string, userAgent?: string, referrer?: string) {
    this.url = url;
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.referrer = referrer;
  }
}