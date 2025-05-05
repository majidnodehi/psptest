import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from '../../../src/url/controllers/url.controller';
import { IUrlService } from '../../../src/url/services/url.service.interface';
import { IClickService } from '../../../src/url/services/click.service.interface';
import { CreateUrlDto } from '../../../src/url/dto/create-url.dto';
import { User } from '../../../src/entities/user.entity';
import { Url } from '../../../src/entities/url.entity';
import { Request } from 'express';

describe('UrlController', () => {
  let controller: UrlController;
  let urlService: jest.Mocked<IUrlService>;
  let clickService: jest.Mocked<IClickService>;

  beforeEach(async () => {
    const mockUrlService = {
      createShortUrl: jest.fn(),
      findBySlug: jest.fn(),
      incrementClickCount: jest.fn(),
      deleteBySlug: jest.fn(),
    };

    const mockClickService = {
      trackClick: jest.fn(),
      getClickStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [
        {
          provide: 'IUrlService',
          useValue: mockUrlService,
        },
        {
          provide: 'IClickService',
          useValue: mockClickService,
        },
      ],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    urlService = module.get('IUrlService');
    clickService = module.get('IClickService');
  });

  describe('createShortUrl', () => {
    it('should create short URL', async () => {
      const dto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };
      const user = new User('test@example.com', 'Test User', 'password');
      const mockUrl = new Url('abc123', dto.originalUrl);
  
      urlService.createShortUrl.mockResolvedValue(mockUrl);
  
      const req = {
        user,
        headers: {},
        method: 'POST',
        
      } as unknown as Request; 
  
      const result = await controller.createShortUrl(dto, req);
  
      expect(result).toEqual({
        slug: 'abc123',
        shortUrl: expect.any(String),
      });
      expect(urlService.createShortUrl).toHaveBeenCalledWith(dto, user);
    });
  });

  describe('redirect', () => {
    it('should redirect to original URL', async () => {
      const mockUrl = new Url('abc123', 'https://example.com');
      urlService.findBySlug.mockResolvedValue(mockUrl);
  
      const res = {
        redirect: jest.fn().mockImplementation((status, url) => ({ status, url })),
      } as any;
  
      // Properly typed mock request
      const req = {
        headers: {
          'x-forwarded-for': '127.0.0.1',
          'user-agent': 'Test Agent',
          referer: 'https://test.com',
        },
        socket: { remoteAddress: '127.0.0.1' },
        method: 'GET',
        url: '/r/abc123',
      } as unknown as Request;
  
      await controller.redirect('abc123', res, req);
  
      expect(urlService.findBySlug).toHaveBeenCalledWith('abc123');
      expect(clickService.trackClick).toHaveBeenCalledWith(
        mockUrl,
        '127.0.0.1',
        'Test Agent',
        'https://test.com'
      );
      expect(urlService.incrementClickCount).toHaveBeenCalledWith(mockUrl.id);
      expect(res.redirect).toHaveBeenCalledWith(301, 'https://example.com');
    });
  });

  describe('getStats', () => {
    it('should return URL stats', async () => {
      const mockUrl = new Url('abc123', 'https://example.com');
      mockUrl.createdAt = new Date();
      urlService.findBySlug.mockResolvedValue(mockUrl);
      clickService.getClickStats.mockResolvedValue([]);

      const result = await controller.getStats('abc123');

      expect(result).toEqual({
        url: 'https://example.com',
        shortUrl: 'abc123',
        createdAt: expect.any(Date),
        expiresAt: null,
        totalClicks: 0,
        detailedStats: [],
      });
    });
  });

  describe('deleteUrl', () => {
    it('should delete URL', async () => {
      const user = new User('test@example.com', 'Test User', 'password');
      urlService.deleteBySlug.mockResolvedValue(true);

      const req = {
        user,
        headers: {},
        method: 'POST',
        
      } as unknown as Request; 

      const result = await controller.deleteUrl('abc123', req);

      expect(result).toEqual({
        message: 'URL deleted successfully',
        deleted: true,
      });
      expect(urlService.deleteBySlug).toHaveBeenCalledWith('abc123', user);
    });
  });
});