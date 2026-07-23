import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { CompaniesController } from './companies/companies.controller';
import { CompaniesService } from './companies/companies.service';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { DealsController } from './deals/deals.controller';
import { DealsService } from './deals/deals.service';
import { PipelineStagesController } from './pipeline-stages/pipeline-stages.controller';
import { PipelineStagesService } from './pipeline-stages/pipeline-stages.service';

@Module({
  imports: [TenancyModule],
  controllers: [CompaniesController, ContactsController, PipelineStagesController, DealsController],
  providers: [CompaniesService, ContactsService, PipelineStagesService, DealsService],
})
export class CrmModule {}
