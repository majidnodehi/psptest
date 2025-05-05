import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    console.log('Guard Info:', { err, user, info }); 
    
    if (info) {
      console.log('JWT Validation Error:', info.message);
      throw new UnauthorizedException(info.message || 'Invalid token');
    }
    
    if (err || !user) {
      throw err || new UnauthorizedException('Authentication failed');
    }
    
    return user;
  }
}