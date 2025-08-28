import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/core/database/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';

@Injectable()
export class EmployeeService {
  constructor(private readonly db: PrismaService) {}
  async findAll() {
    return this.db.prisma.employee.findMany({
      where: {
        workloadSection: true,
      },
    });
  }

  async create(data: CreateEmployeeDto) {
    return this.db.prisma.employee.create({ data });
  }
}
