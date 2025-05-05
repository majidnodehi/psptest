import { Migration } from '@mikro-orm/migrations';

export class Migration20250504224312 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" uuid not null, "name" varchar(255) not null, "email" varchar(255) not null, "password" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`alter table "url" add column "user_id" uuid null;`);
    this.addSql(`alter table "url" add constraint "url_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade on delete set null;`);
    this.addSql(`alter table "url" drop constraint "url_slug_key";`);
    this.addSql(`alter table "url" add constraint "url_slug_unique" unique ("slug");`);

    this.addSql(`drop index "click_url_id_index";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "url" drop constraint "url_user_id_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`create index "click_url_id_index" on "click" ("url_id");`);

    this.addSql(`alter table "url" drop column "user_id";`);

    this.addSql(`alter table "url" drop constraint "url_slug_unique";`);
    this.addSql(`alter table "url" add constraint "url_slug_key" unique ("slug");`);
  }

}
