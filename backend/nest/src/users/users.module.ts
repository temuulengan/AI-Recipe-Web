import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminUsersController } from './users.controller';
import { MeController } from './me.controller';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminUsersController, MeController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
