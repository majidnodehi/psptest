import { Click } from "../../entities/click.entity";

export interface IClickService {
    trackClick(url: any, ip?: string, userAgent?: string, referrer?: string): Promise<Click>;
    getClickStats(urlId: string): Promise<any>;
}