import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Res,
  NotFoundException,
  HttpStatus,
  Inject,
  Req,
  UseGuards
} from '@nestjs/common';
import { Request, Response } from 'express';
import { CreateUrlDto } from '../dto/create-url.dto';
import { IClickService } from '../services/click.service.interface';
import { IUrlService } from '../services/url.service.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';
import { UrlStatsResponseDto } from '../dto/url-stats-response.dto';
import { ShortUrlResponseDto } from '../dto/short-url-response.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { User } from '../../../src/entities/user.entity';

@ApiTags('URL Shortener')
@Controller()
export class UrlController {
  constructor(
    @Inject('IUrlService') private readonly urlService: IUrlService,
    @Inject('IClickService') private readonly clickService: IClickService
  ) { }

  /**
   * Create a short URL from a long URL
   * POST /links
   */

  @Post('links')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a short URL',
    description: 'Creates a shortened version of a long URL. Optionally accepts a custom slug and expiration date.',
  })
  @ApiBody({
    type: CreateUrlDto,
    examples: {
      basic: {
        summary: 'Basic request',
        value: {
          originalUrl: 'https://google.com/'
        }
      },
      withOptions: {
        summary: 'Request with all options',
        value: {
          originalUrl: 'https://google.com/',
          customSlug: 'my-custom-link',
          expiresAt: '2025-12-31T23:59:59Z'
        }
      }
    }
  })
  @ApiCreatedResponse({
    type: ShortUrlResponseDto,
    description: 'Short URL created successfully',
  })
  @ApiBadRequestResponse({
    description: 'Invalid URL provided or slug already in use'
  })
  async createShortUrl(
    @Body() createUrlDto: CreateUrlDto,
    @Req() req: Request
  ) {
    const user = req['user'] as User;
    return this.urlService.createShortUrl(createUrlDto, user);
  }

  /**
   * Redirect to original URL and track click stats
   * GET /r/:slug
   */
  @Get('r/:slug')
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiParam({ name: 'slug', description: 'Short URL identifier', example: 'abc123' })
  @ApiResponse({
    status: HttpStatus.MOVED_PERMANENTLY,
    description: 'Redirects to the original URL'
  })
  @ApiNotFoundResponse({ description: 'URL not found or has expired' })
  async redirect(
    @Param('slug') slug: string,
    @Res() res: Response,
    @Req() req: Request
  ) {
    const url = await this.urlService.findBySlug(slug);

    if (!url || url.isExpired()) {
      throw new NotFoundException('URL not found or has expired');
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const userAgent = req.headers['user-agent'];

    const referrer = req.headers['referer'] || req.headers['referrer'];

    await this.clickService.trackClick(
      url,
      ip?.toString(),
      userAgent?.toString(),
      referrer?.toString()
    );
    await this.urlService.incrementClickCount(url.id);

    return res.redirect(HttpStatus.MOVED_PERMANENTLY, url.originalUrl);
  }

  /**
   * Get stats for a specific short URL
   * GET /links/:slug/stats
   */
  @Get('links/:slug/stats')
  @ApiOperation({ summary: 'Get statistics for a short URL' })
  @ApiParam({ name: 'slug', description: 'Short URL identifier', example: 'abc123' })
  @ApiOkResponse({
    type: UrlStatsResponseDto,
    description: 'Returns URL statistics'
  })
  @ApiNotFoundResponse({ description: 'URL not found' })
  async getStats(@Param('slug') slug: string) {
    const url = await this.urlService.findBySlug(slug);

    if (!url) {
      throw new NotFoundException('URL not found');
    }

    return {
      url: url.originalUrl,
      shortUrl: slug,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      totalClicks: url.clickCount,
      detailedStats: await this.clickService.getClickStats(url.id)
    };
  }

  /**
   * Delete a short URL
   * DELETE /links/:slug
   */
  @Delete('links/:slug')
  @ApiOperation({ summary: 'Delete a short URL' })
  @ApiParam({ name: 'slug', description: 'Short URL identifier', example: 'abc123' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOkResponse({
    description: 'URL deleted successfully',
    schema: {
      example: {
        message: 'URL deleted successfully',
        deleted: true
      }
    }
  })
  @ApiNotFoundResponse({ description: 'URL not found' })
  async deleteUrl(
    @Param('slug') slug: string,
    @Req() req: Request
  ) {
    const user = req['user'] as User;
    const deleted = await this.urlService.deleteBySlug(slug, user);

    if (!deleted) {
      throw new NotFoundException('URL not found');
    }

    return {
      message: 'URL deleted successfully',
      deleted
    };
  }
}