import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DeveloperGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const devKey = request.headers['developer-key'];
    const masterKey = this.configService.getOrThrow<string>(
      'DEVELOPER_MASTER_KEY',
    );

    if (!masterKey || masterKey !== devKey) {
      throw new ForbiddenException('Developer access only.');
    }

    return true;
  }
}
