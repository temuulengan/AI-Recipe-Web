// import { Controller, Get, Query, UseGuards } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository, FindOptionsWhere } from 'typeorm';
// import { AppErrorLog } from './log.entity';
// import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
// import { Roles } from 'src/auth/decorators/roles.decorator';

// @Controller('/api/v1/admin/logs')
// @UseGuards(JwtAuthGuard)
// @Roles('ADMIN')
// export class AdminErrorLogController {
//   constructor(
//     @InjectRepository(AppErrorLog)
//     private readonly repo: Repository<AppErrorLog>,
//   ) { }

//   @Get()
//   async list(
//     @Query('source') source?: string,
//     @Query('path') path?: string,
//     @Query('limit') limit = 100,
//   ) {
//     const where: FindOptionsWhere<AppErrorLog> = {};
//     if (source) where.source = source;
//     if (path) where.path = path;

//     const logs = await this.repo.find({
//       where,
//       order: { createdAt: 'DESC' },
//       take: Math.min(Number(limit), 500),
//     });

//     return logs;
//   }
// }
// src/log/log.controller.ts
import {
  Controller,
  Get,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { AppErrorLog } from './log.entity';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('/api/v1/admin/logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminErrorLogController {
  constructor(
    @InjectRepository(AppErrorLog)
    private readonly repo: Repository<AppErrorLog>,
  ) { }

  @Get()
  async list(
    @Query('source') source?: string,
    @Query('path') path?: string,
    @Query('limit') limit?: string,   // <-- 문자열 그대로 받음
  ) {
    // ---------- 파라미터 검증 ----------
    const parsedLimit = Number(limit);
    const safeLimit = isNaN(parsedLimit) || parsedLimit < 1
      ? 100                     // 기본값
      : Math.min(parsedLimit, 500);

    if (safeLimit <= 0) {
      throw new BadRequestException('limit must be a positive integer');
    }

    // ---------- where 절 ----------
    const where: FindOptionsWhere<AppErrorLog> = {};
    if (source) where.source = source;
    if (path) where.path = path;

    // ---------- DB 조회 ----------
    const logs = await this.repo.find({
      where,
      order: { createdAt: 'DESC' },
      take: safeLimit,
    });

    return logs;
  }
}