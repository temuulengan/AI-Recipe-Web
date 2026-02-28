import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppErrorLog } from './log.entity';

export interface ErrorLogOptions {
    source?: string;               // 기본: 'nest-api'
    method?: string;
    path?: string;
    userId?: string;
    context?: Record<string, any>; // 추가 정보 (body, params 일부 등)
    stack?: string;
}

@Injectable()
export class ErrorLogService {
    constructor(
        @InjectRepository(AppErrorLog)
        private readonly repo: Repository<AppErrorLog>,
    ) { }

    async error(message: string, options: ErrorLogOptions = {}) {
        const log = this.repo.create({
            level: 'error',
            source: options.source ?? 'nest-api',
            message,
            stack: options.stack,
            method: options.method,
            path: options.path,
            userId: options.userId,
            context: options.context,
        });

        // 에러 로깅이 실패해도 서비스 동작에 영향 안 주게
        try {
            await this.repo.save(log);
        } catch (e) {
            // DB 저장 실패 시 콘솔에 출력 (Docker 로그에서 확인 가능)
            console.error('ErrorLog save failed', e);
        }
    }
}
