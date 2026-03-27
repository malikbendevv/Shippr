import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  private readonly jwtAccessSecret: string;

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.jwtAccessSecret =
      this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      this.logger.error('No token found in request');
      throw new UnauthorizedException('No token provided');
    }

    try {
      const payload: JwtPayload = await this.jwtService.verifyAsync(token, {
        secret: this.jwtAccessSecret,
      });
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
    return (
      request.cookies?.access_token ??
      request.headers.authorization?.split(' ')[1]
    );
  }
}
