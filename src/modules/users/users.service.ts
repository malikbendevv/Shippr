import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

import { PrismaService } from 'src/shared/prisma/prisma.service';
import { Prisma } from '@prisma/client';

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
    street?: string | null;
    street2?: string | null;
    city?: string | null;
    state?: string | null;
    zipCode?: string | null;
    country?: string | null;
    latitude?: number | null;
    longitude?: number | null;
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
    const {
      email,
      phoneNumber,
      firstName,
      lastName,
      password,
      role,
      addresses,
    } = dto;
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
          role,
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
    const { page = 1, limit = 10, role, sort = 'createdAt', order = 'desc', search } = query;

    this.logger.log('=== Starting findAll operation ===');
    this.logger.log('Query parameters:', { page, limit, role, search });
    this.logger.log('Calculated skip value:', (page - 1) * limit);

    // Build the where clause
    const whereClause = {
      ...(role && { role: role as Role }),
      ...(search && {
        OR: [
          {
            firstName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          {
            lastName: { contains: search, mode: Prisma.QueryMode.insensitive },
          },
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }),
    };

    this.logger.log(
      'Where clause for filtering:',
      JSON.stringify(whereClause, null, 2),
    );

    // Get total count for pagination
    this.logger.log('Fetching total count of users...');
    const totalCount = await this.prisma.user.count({
      where: whereClause,
    });
    this.logger.log('Total count of users:', totalCount);

    // Get users with pagination
    this.logger.log(
      `Fetching users with pagination: skip=${(page - 1) * limit}, take=${limit}`,
    );
    const users = await this.prisma.user.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: whereClause,
      select: {
        id: true,
        email: true,
        phoneNumber: true,
        firstName: true,
        lastName: true,
        addresses: true,
        role: true,
        createdAt: true,
      },
      orderBy: { [sort]: order ?? 'asc' },
    });
    this.logger.log(`Fetched ${users.length} users`);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);
    const currentPage = page;
    const usersFetched = users.length;

    const paginationData = {
      totalUsers: totalCount,
      totalPages,
      currentPage,
      usersFetched,
      limit,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };

    this.logger.log(
      'Fetched users:',
      users.map((user) => user.email),
    );
    this.logger.log('Pagination metadata:', paginationData);
    this.logger.log('=== findAll operation completed ===');

    return {
      users,
      pagination: paginationData,
    };
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
