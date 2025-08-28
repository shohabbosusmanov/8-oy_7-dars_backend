import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
@Injectable()
export class SeederService implements OnModuleInit {
  email: string;
  password: string;
  public logger: Logger = new Logger(SeederService.name);
  constructor(
    private db: PrismaService,
    private configService: ConfigService,
  ) {
    this.email = this.configService.get('SUPER_ADMIN_EMAIL') as string;
    this.password = this.configService.get('SUPER_ADMIN_PASSWORD') as string;
  }
  onModuleInit() {
    this.initSeeder();
  }
  async initSeeder() {
    try {
      await this.checkExistingAdmin();
      await this.createAdmin();
      this.logger.log('admin created');
    } catch (error) {
      this.logger.warn(error.message);
    }
  }
  async checkExistingAdmin() {
    const findAdmin = await this.db.prisma.user.findUnique({
      where: {
        email: this.email,
      },
    });
    if (!findAdmin) return true;
    throw new Error('admin existed!!');
  }
  async createAdmin() {
    const hashedPassword = await bcrypt.hash(this.password, 12);
    await this.db.prisma.user.create({
      data: {
        email: this.email,
        full_name: 'super admin',
        password: hashedPassword,
        phone_number: '+998990000000',
      },
    });
  }
}
