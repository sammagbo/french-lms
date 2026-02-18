import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
      constructor(private readonly prisma: PrismaService) { }

      async create(data: CreateUserDto) {
            const hashedPassword = await bcrypt.hash(data.password, 10);

            return this.prisma.user.create({
                  data: {
                        email: data.email,
                        passwordHash: hashedPassword,
                  },
            });
      }

      async findAll() {
            return this.prisma.user.findMany();
      }

      async findByEmail(email: string) {
            return this.prisma.user.findUnique({
                  where: { email },
            });
      }

      async findOne(id: string) {
            return this.prisma.user.findUnique({
                  where: { id },
            });
      }
}
