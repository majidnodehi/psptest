import { ApiProperty } from '@nestjs/swagger';

export class ClickStatDto {
    @ApiProperty({ example: '192.168.1.1', description: 'IP address' })
    ip: string;

    @ApiProperty({ example: 'Chrome', description: 'User agent' })
    userAgent: string;

    @ApiProperty({ example: 'https://referrer.com', description: 'Referrer URL' })
    referrer: string;

    @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Click timestamp' })
    timestamp: Date;
}

export class UrlStatsResponseDto {
    @ApiProperty({ example: 'https://original.com/long/path', description: 'Original URL' })
    url: string;

    @ApiProperty({ example: 'abc123', description: 'Short URL identifier' })
    shortUrl: string;

    @ApiProperty({ example: '2023-01-01T00:00:00.000Z', description: 'Creation timestamp' })
    createdAt: Date;

    @ApiProperty({
        example: '2023-02-01T00:00:00.000Z',
        description: 'Expiration timestamp',
        required: false
    })
    expiresAt?: Date;

    @ApiProperty({ example: 42, description: 'Total number of clicks' })
    totalClicks: number;

    @ApiProperty({
        type: [ClickStatDto],
        description: 'Detailed click statistics'
    })
    detailedStats: ClickStatDto[];
}