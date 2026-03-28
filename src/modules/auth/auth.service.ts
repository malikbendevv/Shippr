import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './types/jwt-payload';

@Injectable()
export class AuthService {
  private readonly jwtRefreshSecret: string;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private prisma: PrismaService,
    private mailService: MailService,
    private configService: ConfigService,
  ) {
    this.jwtRefreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async validateUser(email: string, pass: string) {
    console.log('validateUser called with:', { email, pass });
    try {
      const user = await this.usersService.findByEmail(email);
      console.log('User found by email:', user);

      if (user) {
        const passwordMatch = await bcrypt.compare(pass, user.password);
        console.log('Password match result:', passwordMatch);
        if (passwordMatch) {
          const result = {
            id: user.id,
            email: user.email,
            role: user.role,
            // ... other fields
          };
          console.log('Returning validated user:', result);
          return result;
        }
      }

      console.log('User validation failed, returning null');
      return null;
    } catch (error) {
      console.error('Error in validateUser:', error);
      throw error; // rethrow so NestJS can handle it as well
    }
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.jwtRefreshSecret,
      });
      console.log('Decoded payload from refreshToken:', payload);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'name' in error) {
        if (error.name === 'TokenExpiredError') {
          console.error('Refresh token has expired');
          throw new UnauthorizedException('Refresh token has expired');
        }
        if (error.name === 'JsonWebTokenError') {
          console.error('Invalid refresh token', error);
          throw new UnauthorizedException('Invalid refresh token');
        }
      }
      console.error('Invalid refresh token (unknown error)', error);
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.getById(payload.sub);
    console.log('User from DB:', user);
    console.log('DB hashed refreshToken:', user.refreshToken);
    const compareResult =
      user.refreshToken &&
      (await bcrypt.compare(refreshToken, user.refreshToken));
    console.log(
      'Result of bcrypt.compare(refreshToken, user.refreshToken):',
      compareResult,
    );
    if (!user.refreshToken || !compareResult) {
      console.error('Refresh token in DB is missing or does not match');
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Invalidate the old refresh token
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: null },
    });
    console.log('Old refresh token invalidated in DB');

    const newAccessToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '1m' },
    );
    const newRefreshToken = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { expiresIn: '7d', secret: this.jwtRefreshSecret },
    );

    const hashedNewRefreshToken = await bcrypt.hash(newRefreshToken, 10);
    console.log('New hashed refreshToken:', hashedNewRefreshToken);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: hashedNewRefreshToken },
    });
    console.log('New hashed refresh token saved to DB');

    return { accessToken: newAccessToken, newRefreshToken };
  }

  async login(dto: LoginDto) {
    console.log('Login attempt with DTO:', dto);
    const user = await this.validateUser(dto.email, dto.password);
    console.log('User after validation:', user);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    console.log('JWT payload:', payload);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        expiresIn: '1m',
      }),
      this.jwtService.signAsync(payload, {
        expiresIn: '7d',
        secret: this.jwtRefreshSecret,
      }),
    ]);
    console.log('Generated accessToken:', accessToken);
    console.log('Generated refreshToken:', refreshToken);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    console.log('Hashed refreshToken:', hashedRefreshToken);

    const updateResult = await this.prisma.user.update({
      where: { email: user.email },
      data: { refreshToken: hashedRefreshToken },
      select: { id: true },
    });
    console.log('Database update result:', updateResult);

    return { accessToken, refreshToken };
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    return { message: 'Logged out successfully' };
  }

  async forgotPassword(email: string): Promise<void> {
    // Always return without revealing whether the email exists
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { id: true, firstName: true, lastName: true, email: true },
    });

    if (!user) return;

    // Invalidate any existing unused tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    // Generate a plain token to send by email and store only the hash
    const plainToken = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(plainToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    });

    await this.mailService.sendPasswordResetEmail({
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      resetToken: plainToken,
    });
  }

  async resetPassword(plainToken: string, newPassword: string): Promise<void> {
    const tokenHash = createHash('sha256').update(plainToken).digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true } } },
    });

    if (!record || record.usedAt !== null || record.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Consume the token and update the password atomically
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.user.id },
        data: { password: hashed, refreshToken: null },
      }),
    ]);
  }
}
