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

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderDto & { customerId: string }) {
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
        tx.address.findUnique({ where: { id: dto.dropoffAddressId } }),
      ]);

      if (!pickupAddress) {
        throw new ForbiddenException('Pickup address does not belong to you');
      }
      if (!dropoffAddress) {
        throw new NotFoundException('Dropoff address not found');
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
      },
    });

    if (!existingProduct) throw new NotFoundException('Order not found');

    return existingProduct;
  }

  async update(payload: {
    id: string;
    customerId: string;
    updateOrderDto: UpdateOrderDto;
  }) {
    const {
      id,
      updateOrderDto,
      customerId,
      updateOrderDto: { expectedVersion },
    } = payload;

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) throw new NotFoundException('Order not found');
      if (order.customerId !== customerId) throw new UnauthorizedException();

      // Idempotency check
      if (expectedVersion !== undefined && order.version !== expectedVersion) {
        throw new ConflictException('Order was modified by another request');
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
