import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const expected = this.config.get<string>('ADMIN_API_TOKEN');
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, '');

    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid admin token');
    }

    return true;
  }
}
