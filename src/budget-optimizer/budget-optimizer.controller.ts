import { Controller, Post, Body } from '@nestjs/common';
import { BudgetOptimizerService } from './budget-optimizer.service';
import { CreateBudgetDto } from './dto/create-budget.dto';

@Controller('budget-optimizer')
export class BudgetOptimizerController {
  constructor(private readonly service: BudgetOptimizerService) {}

  @Post()
  async create(@Body() dto: CreateBudgetDto) {
    return this.service.optimizeBudget(
      dto.totalBudget,
      dto.travelDays,
      dto.destinationType,
      dto.currency || 'USD',
    );
  }
}
