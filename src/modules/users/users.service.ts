import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PrismaService } from 'src/shared/prisma/prisma.service';

import * as bcrypt from 'bcrypt';
import { UserQueryDto } from './dto/user-query.dto';
import { Role } from '../auth/types/roles.enum';
import { CreateAddressDto } from './dto/createAddressDto';
import { ROUTING_KEYS } from 'src/shared/queue/queue.constants';
import { QueueService } from 'src/shared/queue/queue.service';

type UserCreateResponse = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
  addresses?: Array<{
    id: string;
    street: string;
    street2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    latitude?: number;
    longitude?: number;
  }>;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  // Create

  async create(dto: CreateUserDto): Promise<UserCreateResponse> {
    const { email, phoneNumber, firstName, lastName, password, addresses } =
      dto;
    this.logger.log('Creating user with email', email);
    try {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [{ email }, { phoneNumber }],
        },
        select: {
          email: true,
          phoneNumber: true,
        },
      });

      if (existingUser) {
        this.logger.error(
          'User already exists',
          existingUser?.email === email
            ? 'A user with this email already exists'
            : 'A user with this phone number already exists',
        );
        throw new ConflictException(
          existingUser?.email === email
            ? 'A user with this email already exists'
            : 'A user with this phone number already exists',
        );
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await this.prisma.user.create({
        data: {
          email,
          phoneNumber,
          firstName,
          lastName,
          password: hashedPassword,
          ...(addresses && {
            addresses: {
              create: addresses,
            },
          }),
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          createdAt: true,
          addresses: true,
        },
      });

      this.logger.log('User created successfully', user);

      try {
        this.logger.log('Attempting to send welcome email to queue...', {
          email: user.email,
          name: user.firstName,
        });

        await this.queueService.emit(ROUTING_KEYS.WELCOME_EMAIL, {
          email: user.email,
          name: user.firstName,
        });

        this.logger.log('Message successfully sent to queue');
      } catch (err) {
        this.logger.error('Failed to send welcome email to queue:', err);
      }

      return user;
    } catch (err) {
      this.logger.error('Error Creating user :', err);
      throw err;
    }
  }

  async findAll(query: UserQueryDto) {
    const { page = 1, limit = 10, role, search } = query;

    console.log('Logging query in user service', query);
    this.logger.log('Logging skip in user service', page - 1 * limit);
    return await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        ...(role && { role: role as Role }),

        ...(search && {
          OR: search
            ? [
                { firstName: { contains: search, mode: 'insensitive' } },

                { lastName: { contains: search, mode: 'insensitive' } },

                { email: { contains: search, mode: 'insensitive' } },
              ]
            : undefined,
        }),
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        password: true,
        firstName: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        refreshToken: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async createAddress(userId: string, address: CreateAddressDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if this user already has this exact address
    const existingAddress = await this.prisma.address.findFirst({
      where: {
        AND: [
          { longitude: address.longitude },
          { latitude: address.latitude },
          { street: address.street },
          { city: address.city },
          { userId: userId },
        ],
      },
    });

    if (existingAddress) {
      throw new ConflictException(
        'You already have this exact address registered',
      );
    }

    const newAddress = await this.prisma.address.create({
      data: {
        ...address,
        userId,
      },
    });

    return newAddress;
  }

  // ---- UPDATE ----
  async update(id: string, dto: UpdateUserDto) {
    // Filter out any address data from the DTO
    const userData: Omit<UpdateUserDto, 'addresses'> = Object.fromEntries(
      Object.entries(dto).filter(([key]) => key !== 'addresses'),
    );

    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (userData.password) {
      userData.password = await bcrypt.hash(userData.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        updatedAt: true,
      },
    });

    return user;
  }

  // ✅ Use try/catch for critical operations (e.g., delete)
  async delete(id: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    await this.prisma.user.delete({ where: { id } });
    return {
      status: 'success',
      message: `User ${id} deleted`,
      timestamp: new Date(),
    };
  }
}
