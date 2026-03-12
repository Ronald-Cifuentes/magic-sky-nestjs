import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { TokenPayload } from '../auth.service';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.refreshToken || req?.body?.refreshToken,
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_REFRESH_SECRET', 'refresh-secret'),
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: TokenPayload) {
    return payload;
  }
}
