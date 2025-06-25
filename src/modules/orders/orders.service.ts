import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from 'src/shared/prisma/prisma.service';
import { OrderQueryDto } from './dto/order-query.dto';
import { OrderStatus } from 'src/shared/types/order-status-enum';
import { Role } from '../auth/types/roles.enum';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto & { customerId: string }) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: dto.customerId,
      },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Verify addresses belong to the customer
      const [pickupAddress, dropoffAddress] = await Promise.all([
        tx.address.findFirst({
          // ← `findFirst` + `userId` check
          where: {
            id: dto.pickupAddressId,
            userId: dto.customerId, // Ensure address belongs to customer
          },
        }),
        tx.address.findUnique({
          where: { id: dto.dropoffAddressId, userId: dto.customerId },
        }),
      ]);

      if (!pickupAddress) {
        throw new ForbiddenException('Pickup address does not belong to you');
      }
      if (!dropoffAddress) {
        await tx.address.create({
          data: {
            ...dropoffAddress,
          },
          select: {
            id: true,
          },
        });
      }

      // 2. Proceed with order creation
      return tx.order.create({ data: { ...dto, customerId: dto.customerId } });
    });
  }

  async findAll(query: OrderQueryDto) {
    const {
      page = 1,
      limit = 10,
      driverId,
      status,
      customerId,
      search,
    } = query;

    return await this.prisma.order.findMany({
      skip: (page - 1) * limit,
      take: limit,
      where: {
        ...(driverId && { driverId }),
        ...(customerId && { customerId }),
        ...(status && { status }),
        ...(search && {
          OR: search
            ? [
                { name: { contains: search, mode: 'insensitive' } },

                { description: { contains: search, mode: 'insensitive' } },
              ]
            : undefined,
        }),
      },

      select: {
        id: true,
        status: true,
        createdAt: true,
        customerId: true,
        driverId: true,
        updatedAt: true,
        archived: true,
        pickupAddressId: true,
        estimatedDistance: true,
        estimatedDuration: true,
        dropoffAddressId: true,
        receiverFullName: true,
        receiverPhoneNumber: true,
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },

        pickupAddress: {
          select: {
            id: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffAddress: {
          select: {
            id: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const existingProduct = await this.prisma.order.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        createdAt: true,
        customerId: true,
        driverId: true,
        updatedAt: true,
        archived: true,
        pickupAddressId: true,
        estimatedDistance: true,
        estimatedDuration: true,
        dropoffAddressId: true,
        receiverFullName: true,
        receiverPhoneNumber: true,

        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        driver: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        pickupAddress: {
          select: {
            id: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
        dropoffAddress: {
          select: {
            id: true,
            street: true,
            street2: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            latitude: true,
            longitude: true,
          },
        },
      },
    });

    if (!existingProduct) throw new NotFoundException('Order not found');

    return existingProduct;
  }

  async update(payload: {
    id: string;
    userId: string;
    updateOrderDto: UpdateOrderDto;
  }) {
    const {
      id,
      updateOrderDto,
      userId,
      updateOrderDto: { expectedVersion },
    } = payload;

    const existingUser = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('User does not exist');
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },

        include: {
          customer: {
            select: {
              id: true,
              role: true,
            },
          },
        },
      });
      if (!order) throw new NotFoundException('Order not found');
      if (
        order.customerId !== userId &&
        order.customer.role !== Role.admin &&
        order.driverId !== userId
      ) {
        throw new UnauthorizedException();
      }

      // Idempotency check
      if (expectedVersion !== undefined && order.version !== expectedVersion) {
        throw new ConflictException('Order was modified by another request');
      }

      if (existingUser.role === Role.driver) {
        // Get all keys being updated except 'status'
        const keys = Object.keys(updateOrderDto).filter(
          (key) => key !== 'status',
        );
        if (keys.length > 0) {
          throw new UnauthorizedException(
            'Drivers can only update the status of the order.',
          );
        }
        if (
          updateOrderDto.status === OrderStatus.ASSIGNED &&
          updateOrderDto.driverId === existingUser.id
        ) {
          throw new UnauthorizedException(
            'Drivers cant assign the order to other driverss.',
          );
        }
      }

      if (
        order.status !== OrderStatus.PENDING &&
        order.status !== OrderStatus.ASSIGNED &&
        existingUser.role !== Role.admin &&
        existingUser.role !== Role.driver
      ) {
        throw new ForbiddenException(
          'Order cannot be updated in its current status',
        );
      }
      return tx.order.update({
        where: { id },
        data: {
          ...updateOrderDto,
          version: { increment: 1 }, // 👈 Increment version
        },
        select: { id: true, version: true }, // Return new version
      });
    });
  }

  async archiveOrUnarchive(id: string, action: boolean) {
    const existingProduct = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!existingProduct) throw new NotFoundException('Order not found');

    return await this.prisma.order.update({
      where: { id },
      data: {
        archived: action,
      },
      select: {
        id: true,
      },
    });
  }
}
