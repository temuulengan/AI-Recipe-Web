import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoardsController } from './boards.controller';
import { BoardsService } from './boards.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { Post } from './entities/post.entity';
import { PostComment } from './entities/post-comment.entity';
import { PostRating } from './entities/post-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Post, PostComment, PostRating])],
  controllers: [BoardsController, CommentsController, RatingController],
  providers: [BoardsService, CommentsService, RatingService]
})
export class BoardsModule { }
