import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  HttpStatus,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserDto } from './dto/user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateAddressDto } from './dto/createAddressDto';
import { Request } from 'express';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  protected logger = new Logger(UsersController.name);

  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User created successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email or phone number already exists',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @ApiOperation({ summary: 'List all users with pagination/filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Array of users',
    type: [UserDto],
  })
  @UseGuards(JwtAuthGuard)
  @Get()
  async getUsers(@Query() query: UserQueryDto) {
    console.log('query', query);
    const users = await this.usersService.findAll(query);
    console.log({ users });
    return users;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get current user information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Current user information retrieved successfully',
    type: UserDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async getCurrentUser(@Req() req: Request) {
    return this.usersService.getById(req.user!.sub);
  }

  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User found',
    type: UserDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.getById(id);
  }

  @ApiOperation({ summary: 'Update user details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User updated',
    type: UserDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @ApiOperation({ summary: 'Create new address for user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Address created successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Address already exists for this user',
  })
  @Post('address')
  @UseGuards(JwtAuthGuard)
  createAddress(
    @Req() req: Request,
    @Body() createAddressDto: CreateAddressDto,
  ) {
    return this.usersService.createAddress(req.user!.sub, createAddressDto);
  }
}
