import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,

    private usersService: UsersService,

    private prisma: PrismaService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(pass, user.password))) {
      return {
        id: user.id,
        email: user.email,
        role: user.role,

        // ... other fields
      };
    }

    return null;
  }

  async refreshToken(refreshToken: string) {
    const payload: JwtPayload = await this.jwtService.verifyAsync(
      refreshToken,
      {
        secret: process.env.JWT_REFRESH_SECRET,
      },
    );

    const user = await this.usersService.getById(payload.sub);
    if (
      !user.refreshToken ||
      !(await bcrypt.compare(refreshToken, user.refreshToken))
    ) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newAccessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '1m' },
    );

    return { accessToken: newAccessToken };
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '1m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: process.env.JWT_REFRESH_SECRET,
      }),
    ]);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.prisma.user.update({
      where: { email: user.email },
      data: { refreshToken: hashedRefreshToken },
      select: { id: true },
    });

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async changePassword(email: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { email },
      data: { password: hashed },
    });
  }
}
