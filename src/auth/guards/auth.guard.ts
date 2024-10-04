import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../constants';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private jswtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      console.log('secrect in auth.guard: ', jwtConstants.secret,)
      const payload = await this.jswtService.verifyAsync(token, { secret: jwtConstants.secret });
      request['user'] = payload;
    } catch (err) {
      console.log('error verifying token: ', err.message)
      throw new UnauthorizedException();
    }
    return true;
  }
  private extractTokenFromHeader(request: Request): string | undefined {
    console.log('Authorization header:', request.headers.authorization);
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    if (type === 'Bearer') {
      console.log('Extracted token:', token);
    } else {
      console.log('No Bearer token found');
    }
    return type === 'Bearer' ? token : undefined
  }
}