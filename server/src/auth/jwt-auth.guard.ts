import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { UsersService } from '../users/users.service';
import { AUTH_COOKIE, JwtPayload } from './auth.constants';

type AuthedRequest = Request & { userId?: string };

/**
 * Requires a valid JWT in the httpOnly `access_token` cookie for a user that
 * still exists; sets `req.userId`. Without the existence check a deleted
 * account's token kept writing favorites and reviews until it expired.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const token = (req.cookies as Record<string, string> | undefined)?.[
      AUTH_COOKIE
    ];
    if (!token) throw new UnauthorizedException();

    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (!(await this.usersService.exists(payload.sub))) {
      throw new UnauthorizedException();
    }
    req.userId = payload.sub;
    return true;
  }
}

/** The id of the logged-in user. Only use behind JwtAuthGuard. */
export const CurrentUserId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string =>
    context.switchToHttp().getRequest<AuthedRequest>().userId!,
);
