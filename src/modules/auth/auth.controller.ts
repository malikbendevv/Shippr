import {
  Body,
  Post,
  Controller,
  HttpCode,
  HttpStatus,
  UseGuards,
  Res,
  Req,
  Get,
  HttpException,
} from '@nestjs/common';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';

import { ApiTags, ApiResponse, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request, Response } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid Credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      // secure: true,
      sameSite: 'strict',
      maxAge: 1 * 60 * 1000, // 15 minutes
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      // secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    // Invalidate refresh token in DB (existing logic)
    await this.authService.logout(req.user.sub);
    return { message: 'Logged out' };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refresh successful' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      throw new HttpException(
        'Refresh token not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const { accessToken } = await this.authService.refreshToken(refreshToken);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      // secure: true,
      sameSite: 'strict',
      maxAge: 1 * 60 * 1000, // 1 minute
    });

    return { message: 'Token refreshed successfully' };
  }

  @Get('test-guard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Test JWT guard' })
  @ApiResponse({ status: 200, description: 'Guard test successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async testGuard() {
    console.log('Guard test successful - User is authenticated');
    return { message: 'Guard test successful' };
  }
}
