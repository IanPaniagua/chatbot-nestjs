import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin-token.guard';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(AdminTokenGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('overview')
  overview(@Query('companyId') companyId: string) {
    return this.metrics.overview(companyId);
  }
}
