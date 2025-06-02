import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JwtPayload } from '../types/jwt-payload';

declare module 'express' {
  interface Request {
    user?: JwtPayload;
    cookies: {
      access_token?: string;
      refresh_token?: string;
    };
  }
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    this.logger.debug('Cookies:', request.cookies);
    this.logger.debug('Authorization header:', request.headers.authorization);
    this.logger.debug('Extracted token:', token);
    this.logger.debug('JWT Secret:', process.env.JWT_ACCESS_SECRET);

    if (!token) {
      this.logger.error('No token found in request');
      throw new UnauthorizedException('No token provided');
    }

    try {
      this.logger.debug('About to Verify the token:');
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_ACCESS_SECRET,
      });
      this.logger.debug('Token payload:', payload);
      request.user = payload;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Token verification failed:', errorMessage);
      throw new UnauthorizedException('Invalid token');
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const token: string =
      request.cookies?.access_token ||
      request.headers.authorization?.split(' ')[1];
    return token ?? undefined;
  }
}
