import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CommunityService {
      constructor(private prisma: PrismaService) { }

      async createPost(authorId: string, dto: CreatePostDto) {
            return this.prisma.post.create({
                  data: {
                        title: dto.title,
                        content: dto.content,
                        published: dto.published ?? true,
                        authorId: authorId,
                  },
            });
      }

      async findAllPosts() {
            return this.prisma.post.findMany({
                  where: { published: true },
                  include: {
                        author: {
                              select: {
                                    id: true,
                                    email: true,
                                    // fullName: true, // Not in schema yet
                                    profile: {
                                          select: {
                                                avatarUrl: true,
                                                // fullName might be in profile? Check schema. 
                                                // Schema has bio, avatarUrl, frenchLevel. No fullName in profile.
                                          }
                                    }
                              }
                        },
                        _count: {
                              select: { comments: true }
                        }
                  },
                  orderBy: {
                        createdAt: 'desc',
                  },
            });
      }

      async findOnePost(id: string) {
            const post = await this.prisma.post.findUnique({
                  where: { id },
                  include: {
                        author: {
                              select: {
                                    id: true,
                                    email: true,
                                    profile: { select: { avatarUrl: true } }
                              }
                        },
                        comments: {
                              include: {
                                    author: {
                                          select: {
                                                id: true,
                                                email: true,
                                                profile: { select: { avatarUrl: true } }
                                          }
                                    }
                              },
                              orderBy: { createdAt: 'asc' }
                        }
                  }
            });

            if (!post) {
                  throw new NotFoundException('Post not found');
            }
            return post;
      }

      async deletePost(userId: string, postId: string) {
            const post = await this.prisma.post.findUnique({
                  where: { id: postId },
                  include: { author: true }
            });

            if (!post) {
                  throw new NotFoundException('Post not found');
            }

            // Check ownership or ADMIN role
            // We need to fetch the request user's role if not passed, but usually we pass user object or fetch it.
            // Here we passed userId. To check role we need to fetch user or access it if passed.
            // For efficiency, usually we pass the whole user object to service or fetch user here.
            const user = await this.prisma.user.findUnique({ where: { id: userId } });

            if (post.authorId !== userId && user.role !== Role.ADMIN) {
                  throw new ForbiddenException('You can only delete your own posts');
            }

            return this.prisma.post.delete({
                  where: { id: postId },
            });
      }

      async addComment(userId: string, dto: CreateCommentDto) {
            // Verify post exists
            const post = await this.prisma.post.findUnique({
                  where: { id: dto.postId },
            });

            if (!post) {
                  throw new NotFoundException('Post not found');
            }

            return this.prisma.comment.create({
                  data: {
                        content: dto.content,
                        postId: dto.postId,
                        authorId: userId,
                  },
            });
      }

      async deleteComment(userId: string, commentId: string) {
            const comment = await this.prisma.comment.findUnique({
                  where: { id: commentId },
                  include: {
                        author: true,
                        post: {
                              include: { author: true }
                        }
                  }
            });

            if (!comment) {
                  throw new NotFoundException('Comment not found');
            }

            const user = await this.prisma.user.findUnique({ where: { id: userId } });

            // Permission Logic:
            // 1. User is the author of the comment
            const isCommentAuthor = comment.authorId === userId;
            // 2. User is the author of the parent post
            const isPostAuthor = comment.post.authorId === userId;
            // 3. User is ADMIN
            const isAdmin = user.role === Role.ADMIN;

            if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
                  throw new ForbiddenException('You are not allowed to delete this comment');
            }

            return this.prisma.comment.delete({
                  where: { id: commentId },
            });
      }
}
