import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin-token.guard';
import { CompaniesService } from './companies.service';

@Controller('companies')
@UseGuards(AdminTokenGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list() {
    return this.companies.list();
  }
}
