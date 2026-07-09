import { Body, Controller, Patch, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { OnboardingDto } from './dto/onboarding.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('/me/onboarding')
  async onboarding(@Body() onboardingDto: OnboardingDto, @Req() req) {
    return this.usersService.onboarding(onboardingDto, req.user.id);
  }
}
