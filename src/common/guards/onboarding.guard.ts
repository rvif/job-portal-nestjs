import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/users.entity';
import { Repository } from 'typeorm';

@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const userEntry = await this.userRepo.findOne({
      where: {
        id: req.user.id,
      },
    });

    if (!userEntry) {
      throw new NotFoundException("User with id doesn't exists");
    }

    if (!userEntry.onboardingComplete) {
      throw new ForbiddenException('Complete onboarding first.');
    }

    return true;
  }
}
