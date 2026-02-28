import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../types';
import * as fs from 'fs';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const privateKeyPath = config.get<string>('JWT_PRIVATE_KEY') || '/run/keys/jwt_private.pem';
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: privateKey,  // RSA 개인키로 검증 가능
      algorithms: ['RS256'],
    });
  }

  async validate(payload: JwtPayload) {
    // request.user에 들어감
    return { userId: payload.sub, username: payload.username, role: payload.role };
  }
}