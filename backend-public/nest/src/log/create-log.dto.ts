import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateLogDto {
    @IsIn(['debug', 'info', 'warn', 'error'])
    level!: 'debug' | 'info' | 'warn' | 'error';

    @IsString()
    message!: string;

    @IsString()
    source!: string; // 'flask-api', 'worker', ...

    @IsOptional()
    @IsString()
    category?: string;

    @IsOptional()
    @IsString()
    userId?: string;

    @IsOptional()
    @IsString()
    requestId?: string;

    @IsOptional()
    @IsString()
    ip?: string;

    @IsOptional()
    @IsObject()
    context?: Record<string, any>;
}
