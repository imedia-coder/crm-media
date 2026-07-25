import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { AutomationModule } from '../automation/automation.module';
import { InvoicesController } from './invoices/invoices.controller';
import { InvoicesService } from './invoices/invoices.service';
import { QuotesController } from './quotes/quotes.controller';
import { QuotesService } from './quotes/quotes.service';

@Module({
  imports: [TenancyModule, AutomationModule],
  controllers: [QuotesController, InvoicesController],
  providers: [QuotesService, InvoicesService],
})
export class BillingModule {}
