import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpException,
} from '@nestjs/common';
import { Request } from 'express';
import { ErrorLogService } from './log.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    constructor(private readonly errorLogService: ErrorLogService) { }

    async catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest<Request>();

        const isHttp = exception instanceof HttpException;
        const status = isHttp ? exception.getStatus() : 500;

        const message = isHttp
            ? (exception as HttpException).message
            : (exception as any)?.message ?? 'Unknown error';

        const stack =
            (exception as any)?.stack ??
            (isHttp ? (exception as HttpException).stack : undefined);

        // Docker 로그에도 출력 (콘솔, 스택은 DB에만 저장)
        console.error(`[${req.method}] ${req.originalUrl} - Status: ${status}`);
        console.error(`Error: ${message}`);

        // 여기서 DB에 에러 로그 저장
        await this.errorLogService.error(message, {
            method: req.method,
            path: req.originalUrl,
            // userId는 JWT에서 가져오는 로직 있으면 붙이면 됨
            context: {
                status,
                query: req.query,
                body: req.body,
            },
            stack,
        });

        // 기존처럼 클라이언트에게 응답은 계속 보내야 함
        // ValidationPipe의 상세 에러 메시지를 보존
        const response = ctx.getResponse();

        let responseBody: any;
        if (isHttp) {
            // HttpException의 response를 가져옴 (ValidationPipe의 경우 배열 형태의 메시지 포함)
            const exceptionResponse = exception.getResponse();
            responseBody = typeof exceptionResponse === 'object'
                ? exceptionResponse
                : { statusCode: status, message: exceptionResponse };
        } else {
            responseBody = {
                statusCode: status,
                message: 'Internal server error',
            };
        }

        response.status(status).json(responseBody);
    }
}
