import { Controller, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiCreatedResponse } from '@nestjs/swagger';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { TokenResponseDto } from '../dto/token-response.dto';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @ApiOperation({
        summary: 'User login',
        description: 'Authenticates a user and returns JWT token for authorization'
    })
    @ApiBody({
        type: LoginDto,
        examples: {
            standard: {
                summary: 'Standard login',
                value: {
                    email: 'john.doe@example.com',
                    password: 'securePassword123'
                } as LoginDto
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.OK,
        type: TokenResponseDto,
        description: 'Successfully authenticated',
        headers: {
            'Set-Cookie': {
                description: 'Refresh token in HTTP-only cookie (if using cookies)',
                required: false
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: 'Invalid credentials'
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Validation error (invalid email format, password too short)'
    })
    async login(@Body() loginDto: LoginDto): Promise<TokenResponseDto> {
        return this.authService.login(loginDto);
    }

    @Post('register')
    @ApiOperation({
        summary: 'User registration',
        description: 'Creates a new user account and returns JWT token'
    })
    @ApiBody({
        type: RegisterDto,
        examples: {
            standard: {
                summary: 'Standard registration',
                value: {
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    password: 'securePassword123'
                } as RegisterDto
            },
        }
    })
    @ApiCreatedResponse({
        type: TokenResponseDto,
        description: 'User successfully registered',
        content: {
            'application/json': {
                example: {
                    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                }
            }
        }
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: 'Validation error or email already exists'
    })
    @ApiResponse({
        status: HttpStatus.CONFLICT,
        description: 'Email already registered'
    })
    async register(@Body() registerDto: RegisterDto): Promise<TokenResponseDto> {
        return this.authService.register(registerDto);
    }
}