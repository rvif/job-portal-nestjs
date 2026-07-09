import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './users.entity';
import { CreateUserInput, UpdateUserInput } from './user.types';
import { OnboardingDto } from './dto/onboarding.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly commonService: CommonService,
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
      throw new NotFoundException("User with id doesn't exists");
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

  // currently for oauth users
  async onboarding(onboardingDto: OnboardingDto, userId: string) {
    const user = await this.findOne(userId);
    if (user.onboardingComplete) {
      throw new ConflictException('Onboarding already completed.');
    }

    const updatedUserEntry = this.userRepo.merge(user, {
      ...onboardingDto,
      onboardingComplete: true,
    });
    await this.userRepo.save(updatedUserEntry);

    // issue fresh tokens so jwt payload contains role else it will be null for oauth users
    return this.commonService.generateAuthTokens(updatedUserEntry);
  }
}
