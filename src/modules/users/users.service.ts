import { Injectable, NotFoundException, Req } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly db: PrismaService) {}
  async me(userId: string) {
    const user = await this.db.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateAvatar(userId: string, avatarPath: string) {
    return this.db.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        image_url: avatarPath,
      },
    });
  }
}
