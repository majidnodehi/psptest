// src/dto/short-url-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ShortUrlResponseDto {
    @ApiProperty({
        example: 'https://example.com/abc123',
        description: 'The shortened URL'
    })
    shortUrl: string;

    @ApiProperty({
        example: 'https://original.com/long/path',
        description: 'The original URL'
    })
    originalUrl: string;

    @ApiProperty({
        example: '2023-01-01T00:00:00.000Z',
        description: 'Creation timestamp'
    })
    createdAt: Date;

    @ApiProperty({
        example: '2023-02-01T00:00:00.000Z',
        description: 'Expiration timestamp',
        required: false
    })
    expiresAt?: Date;
}