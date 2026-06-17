import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './users.entity';

import { Public } from 'src/auth/decorators/public.decorator';
import { CreateUserInput } from './user.types';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() data: CreateUserInput) {
    return this.usersService.create(data);
  }

  @Public()
  @Get()
  findAll(
    @Query('role', new ParseEnumPipe(UserRole, { optional: true }))
    role?: UserRole,
  ) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  // @Patch(':id')
  // update(
  //   @Param('id', ParseUUIDPipe) id: string,
  //   @Body() updateUserDto: UpdateUserDto,
  // ) {
  //   return this.usersService.update(id, updateUserDto);
  // }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
