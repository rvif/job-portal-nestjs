import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { CreateUserInput, UpdateUserInput } from './user.types';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(data: CreateUserInput) {
    const user = this.userRepo.create({
      ...data,
    });
    return this.userRepo.save(user);
  }

  async findAll(role?: UserRole) {
    if (!role) {
      return this.userRepo.find();
    }

    return this.userRepo.find({
      where: {
        role,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.userRepo.findOne({
      where: {
        id,
      },
    });

    if (!user) {
      return undefined;
    }

    return user;
  }

  async findOneByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        hashedPassword: true,
        role: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return undefined;
    }
    return user;
  }

  async save(user: User) {
    await this.userRepo.save(user);
  }
  async update(id: string, updateUserInput: UpdateUserInput) {
    const user = await this.userRepo.preload({
      id,
      ...updateUserInput,
    });

    if (!user) {
      throw new NotFoundException(`User with userID ${id} not found`);
    }

    return this.userRepo.save(user);
  }

  async delete(id: string) {
    const result = await this.userRepo.delete({
      id,
    });

    // .delete return metadata about the execution, not the actual record that was deleted

    if (result.affected === 0) {
      throw new NotFoundException(`User with userID ${id} not found`);
    }

    return {
      message: 'User deleted successfully',
    };
  }
}
