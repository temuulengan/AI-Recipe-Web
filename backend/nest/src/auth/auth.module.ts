import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, RefreshToken]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => {
        const keyPath = config.get<string>('JWT_PRIVATE_KEY') || '/run/keys/jwt_private.pem';
        const privateKey = fs.readFileSync(keyPath, 'utf8');
        return {
          privateKey,
          publicKey: privateKey,
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '15m',
            audience: config.get<string>('JWT_AUDIENCE'),
            issuer: config.get<string>('JWT_ISSUER'),
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard],
  exports: [AuthService, RolesGuard],
})
export class AuthModule { }
