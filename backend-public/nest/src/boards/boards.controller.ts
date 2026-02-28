import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BoardsService } from './boards.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('/api/v1/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN')
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() createPostDto: CreatePostDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.boardsService.create(createPostDto, user.userId, image);
  }

  @Get()
  findAll(@Query() query: GetPostsQueryDto) {
    return this.boardsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.boardsService.findOne(id);
  }

  @Patch(':boardId')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() updatePostDto: UpdatePostDto,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.boardsService.update(boardId, updatePostDto, user.userId, user.role);
  }

  @Delete(':boardId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  remove(
    @Param('boardId', ParseIntPipe) boardId: number,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.boardsService.remove(boardId, user.userId, user.role);
  }
}
