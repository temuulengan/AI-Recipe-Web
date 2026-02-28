import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  Query,
  Patch,
  Delete,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetCommentsQueryDto } from './dto/get-comments-query.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('/api/v1/boards/:boardId')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('comments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN')
  create(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() createCommentDto: CreateCommentDto,
    @CurrentUser() user: { userId: string; username: string },
  ) {
    return this.commentsService.create(
      boardId,
      createCommentDto,
      user.userId,
        );
    }

  @Get('comments')
  findAll(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Query() query: GetCommentsQueryDto,
  ) {
    return this.commentsService.findAll(boardId, query);
  }

  @Patch('/comments/:id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCommentDto: UpdateCommentDto,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.commentsService.update(id, updateCommentDto, user.userId, user.role);
  }

  @Delete('/comments/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.commentsService.remove(id, user.userId, user.role);
  }
}
