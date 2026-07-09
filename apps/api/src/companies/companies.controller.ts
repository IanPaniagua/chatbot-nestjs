import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin-token.guard';
import { CompaniesService } from './companies.service';
import { CreateCompanyOnboardingDto, UpdateCompanySettingsDto } from './dto';

@Controller('companies')
@UseGuards(AdminTokenGuard)
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get()
  list() {
    return this.companies.list();
  }

  @Post('onboarding')
  createFromOnboarding(@Body() body: CreateCompanyOnboardingDto) {
    return this.companies.createFromOnboarding(body);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.companies.getById(id);
  }

  @Patch(':id/settings')
  updateSettings(@Param('id') id: string, @Body() body: UpdateCompanySettingsDto) {
    return this.companies.updateSettings(id, body);
  }
}
