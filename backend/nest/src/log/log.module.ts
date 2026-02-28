import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppErrorLog } from './log.entity';
import { ErrorLogService } from './log.service';
import { AdminErrorLogController } from './log.controller';

@Module({
    imports: [TypeOrmModule.forFeature([AppErrorLog])],
    providers: [ErrorLogService],
    controllers: [AdminErrorLogController],
    exports: [ErrorLogService],
})
export class LogModule { }
