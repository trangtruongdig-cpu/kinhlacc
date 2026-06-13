import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'fallback_secret_key', // Ensure JWT_SECRET is added to .env
    });
  }

  async validate(payload: any) {
    // Giữ id/username cho code cũ; bổ sung role/kind/quanTri cho phân quyền.
    // Token bệnh nhân có role:'patient', không có kind/quanTri -> các field này undefined.
    return {
      id: payload.sub,
      username: payload.username,
      phone: payload.phone,
      role: payload.role,
      kind: payload.kind,
      quanTri: payload.quanTri,
    };
  }
}
