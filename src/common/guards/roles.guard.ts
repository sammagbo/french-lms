import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
      constructor(private reflector: Reflector) { }

      canActivate(context: ExecutionContext): boolean {
            const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
                  context.getHandler(),
                  context.getClass(),
            ]);

            if (!requiredRoles) {
                  return true;
            }

            const { user } = context.switchToHttp().getRequest();

            // Se não tiver usuário (não autenticado), deve barrar? 
            // Geralmente sim, mas o AuthGuard já deve ter feito isso antes.
            if (!user) {
                  return false; // ou throw new UnauthorizedException();
            }

            // ADMIN sempre tem acesso total
            if (user.role === Role.ADMIN) {
                  return true;
            }

            const hasRole = requiredRoles.some((role) => user.role === role);
            if (!hasRole) {
                  throw new ForbiddenException('Forbidden resource');
            }

            return true;
      }
}
