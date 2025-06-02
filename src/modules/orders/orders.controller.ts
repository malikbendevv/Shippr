import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Req,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderQueryDto } from './dto/order-query.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from 'src/shared/decorators/roles.decorator';
import { Role } from 'src/modules/auth/types/roles.enum';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create Order' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Create Order',
  })
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createOrderDto: CreateOrderDto, @Req() req: Request) {
    return this.ordersService.create({
      ...createOrderDto,
      customerId: req.user.sub,
    });
  }

  @ApiOperation({ summary: 'Find Orders' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Orders were found successfully',
  })
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() query: OrderQueryDto) {
    return this.ordersService.findAll(query);
  }

  @ApiOperation({ summary: 'Find Order' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Order Founded',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Order not found',
  })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @ApiOperation({ summary: 'update order details' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Version mismatch (order was modified by another request)',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User does not own this order',
  })
  @ApiBody({
    description: 'Requires `expectedVersion` for idempotent updates',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.admin)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateOrderDto: UpdateOrderDto,
    @Req()
    req: Request,
  ) {
    return this.ordersService.update({
      id,
      updateOrderDto,
      customerId: req.user.sub,
    });
  }
}
