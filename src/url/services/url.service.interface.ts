import { User } from "src/entities/user.entity";
import { CreateUrlDto } from "../dto/create-url.dto";

export interface IUrlService {
  createShortUrl(createUrlDto: CreateUrlDto, user: User): Promise<any>;
  findBySlug(slug: string): Promise<any>;
  incrementClickCount(id: string): Promise<void>;
  deleteBySlug(slug: string, user: User): Promise<any>;
}
