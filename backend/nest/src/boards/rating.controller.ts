import {
  Controller,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Get,
  UseGuards,
  Delete,
  HttpCode,
} from '@nestjs/common';
import { RatingService } from './rating.service';
import { RatePostDto } from './dto/rate-post.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('/api/v1/boards/:boardId')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('rating')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('USER', 'ADMIN')
  ratePost(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() ratePostDto: RatePostDto,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.ratingService.ratePost(boardId, ratePostDto, user.userId);
  }

  @Get('rating')
  getAverageRating(@Param('boardId', ParseIntPipe) boardId: number) {
    return this.ratingService.getAverageRating(boardId);
  }

  @Delete('rating')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  deleteRating(
    @Param('boardId', ParseIntPipe) boardId: number,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    // 본인 것만 삭제
    return this.ratingService.deleteRating(boardId, user.userId);
  }

  @Get('rating/all')
  getAllRatings(@Param('boardId', ParseIntPipe) boardId: number) {
    return this.ratingService.getAllRatings(boardId);
  }

  @Get('rating/my')
  @UseGuards(JwtAuthGuard)
  getMyRating(
    @Param('boardId', ParseIntPipe) boardId: number,
    @CurrentUser() user: { userId: string; username: string; role: string },
  ) {
    return this.ratingService.getMyRating(boardId, user.userId);
  }
}
