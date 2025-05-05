import { Migration } from '@mikro-orm/migrations';

export class Migration20250503224045 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`
      create table "url" (
        "id" uuid not null primary key,
        "slug" varchar(255) not null unique,
        "original_url" text not null,
        "created_at" timestamp not null default current_timestamp,
        "expires_at" timestamp null,
        "click_count" int not null default 0
      );
    `);

    this.addSql(`
      create table "click" (
        "id" uuid not null primary key,
        "clicked_at" timestamp not null default current_timestamp,
        "ip_address" varchar(45) null,
        "user_agent" text null,
        "referrer" text null,
        "url_id" uuid not null,
        constraint "click_url_id_foreign" foreign key ("url_id") references "url" ("id") on update cascade
      );
    `);

    this.addSql(`
      create index "click_url_id_index" on "click" ("url_id");
    `);
  }

  override async down(): Promise<void> {
    this.addSql(`
      drop table if exists "click";
    `);

    this.addSql(`
      drop table if exists "url";
    `);
  }

}