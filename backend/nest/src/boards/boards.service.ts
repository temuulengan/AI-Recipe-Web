import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetPostsQueryDto } from './dto/get-posts-query.dto';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';

@Injectable()
export class BoardsService {
  private readonly uploadPath = join(process.cwd(), 'uploads', 'images');

  constructor(
    @InjectRepository(Post)
    private readonly postsRepository: Repository<Post>,
  ) {
    this.ensureUploadDirectory();
  }

  private async ensureUploadDirectory() {
    try {
      await fs.access(this.uploadPath);
    } catch {
      await fs.mkdir(this.uploadPath, { recursive: true });
    }
  }

  async create(createPostDto: CreatePostDto, authorId: string, imageFile?: Express.Multer.File) {
    let img_url: string | undefined;

    // 이미지 파일이 있으면 저장
    if (imageFile) {
      img_url = await this.saveImageFile(imageFile);
    }

    const post = this.postsRepository.create({
      ...createPostDto,
      authorId: authorId,
      img_url,
    });

    return this.postsRepository.save(post);
  }

  private async saveImageFile(file: Express.Multer.File): Promise<string> {
    // 허용된 이미지 타입 검증
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('지원하지 않는 이미지 형식입니다. (JPEG, PNG, GIF, WebP만 지원)');
    }

    // 파일 크기 제한 (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('이미지 파일 크기는 5MB를 초과할 수 없습니다.');
    }

    // 고유한 파일명 생성
    const fileExtension = extname(file.originalname);
    const fileName = `${randomUUID()}${fileExtension}`;
    const filePath = join(this.uploadPath, fileName);

    // 파일 저장
    await fs.writeFile(filePath, file.buffer);

    // 웹에서 접근 가능한 URL 반환
    return `/uploads/images/${fileName}`;
  }

  async findAll(query: GetPostsQueryDto) {
    const {
      page = 1,
      limit = 20,
      search,
      prefix,
      sortBy = 'recent',
    } = query;

    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.prefix',
        'post.isPinned',
        'post.views',
        'post.commentCount',
        'post.averageRating',
        'post.ratingCount',
        'post.img_url',
        'post.createdAt',
        'post.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'author.role',
      ]);

    // 검색 필터
    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // 말머리 필터
    if (prefix) {
      queryBuilder.andWhere('post.prefix = :prefix', { prefix });
    }

    // 정렬
    // 고정 게시글은 항상 최상단
    queryBuilder.addOrderBy('post.isPinned', 'DESC');

    switch (sortBy) {
      case 'views':
        queryBuilder.addOrderBy('post.views', 'DESC');
        break;
      case 'rating':
        queryBuilder.addOrderBy('post.averageRating', 'DESC');
        queryBuilder.addOrderBy('post.ratingCount', 'DESC');
        break;
      case 'comments':
        queryBuilder.addOrderBy('post.commentCount', 'DESC');
        break;
      case 'recent':
      default:
        queryBuilder.addOrderBy('post.createdAt', 'DESC');
        break;
    }

    // 페이지네이션
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const post = await this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.prefix',
        'post.isPinned',
        'post.views',
        'post.commentCount',
        'post.averageRating',
        'post.ratingCount',
        'post.img_url',
        'post.createdAt',
        'post.updatedAt',
        'author.id',
        'author.username',
        'author.nickname',
        'author.role',
      ])
      .where('post.id = :id', { id })
      .getOne();

    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시글을 찾을 수 없습니다.`);
    }

    // 조회수 증가
    await this.postsRepository.increment({ id }, 'views', 1);
    post.views += 1;

    return post;
  }

  async update(id: number, updatePostDto: UpdatePostDto, currentUserId: string, currentUserRole: string) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시글을 찾을 수 없습니다.`);
    }

    // 권한 확인: 본인 또는 ADMIN만 수정 가능
    if (post.authorId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('본인 또는 관리자만 수정할 수 있습니다.');
    }

    // isPinned는 ADMIN만 수정 가능
    if (updatePostDto.isPinned !== undefined && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('게시글 고정은 관리자만 변경할 수 있습니다.');
    }

    Object.assign(post, updatePostDto);
    return this.postsRepository.save(post);
  }

  async remove(id: number, currentUserId: string, currentUserRole: string) {
    const post = await this.postsRepository.findOne({ where: { id } });
    if (!post) {
      throw new NotFoundException(`ID가 ${id}인 게시글을 찾을 수 없습니다.`);
    }

    // 권한 확인: 본인 또는 ADMIN만 삭제 가능
    if (post.authorId !== currentUserId && currentUserRole !== 'ADMIN') {
      throw new ForbiddenException('본인 또는 관리자만 삭제할 수 있습니다.');
    }

    await this.postsRepository.delete(id);
  }
}
