import { Module } from '@nestjs/common';
import { BudgetOptimizerService } from './budget-optimizer.service';
import { BudgetOptimizerController } from './budget-optimizer.controller';

@Module({
  providers: [BudgetOptimizerService],
  controllers: [BudgetOptimizerController]
})
export class BudgetOptimizerModule {}
