import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('community')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('community')
export class CommunityController {
      constructor(private readonly communityService: CommunityService) { }

      @Post('posts')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Create a new post' })
      @ApiResponse({ status: 201, description: 'Post created.' })
      createPost(@CurrentUser() user: any, @Body() dto: CreatePostDto) {
            return this.communityService.createPost(user.id, dto);
      }

      @Get('posts')
      @ApiOperation({ summary: 'Get all posts' })
      @ApiResponse({ status: 200, description: 'List of posts.' })
      findAllPosts() {
            return this.communityService.findAllPosts();
      }

      @Get('posts/:id')
      @ApiOperation({ summary: 'Get a single post details' })
      @ApiResponse({ status: 200, description: 'Post details.' })
      findOnePost(@Param('id') id: string) {
            return this.communityService.findOnePost(id);
      }

      @Delete('posts/:id')
      @ApiOperation({ summary: 'Delete a post' })
      @ApiResponse({ status: 200, description: 'Post deleted.' })
      deletePost(@CurrentUser() user: any, @Param('id') id: string) {
            return this.communityService.deletePost(user.id, id);
      }

      @Post('comments')
      @ApiOperation({ summary: 'Add a comment to a post' })
      @ApiResponse({ status: 201, description: 'Comment created.' })
      addComment(@CurrentUser() user: any, @Body() dto: CreateCommentDto) {
            return this.communityService.addComment(user.id, dto);
      }

      @Delete('comments/:id')
      @ApiOperation({ summary: 'Delete a comment' })
      @ApiResponse({ status: 200, description: 'Comment deleted.' })
      deleteComment(@CurrentUser() user: any, @Param('id') id: string) {
            return this.communityService.deleteComment(user.id, id);
      }
}
