import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from '../decorators/role.decorator';
import { UserRole } from 'src/users/users.entity';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      // no role metadata, since this guard is global, allow access
      return true;
    }

    const req = context.switchToHttp().getRequest();
    if (requiredRoles.includes(req.user.role)) {
      return true;
    }

    return false;
  }
}
