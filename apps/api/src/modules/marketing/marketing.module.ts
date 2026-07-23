import { Module } from '@nestjs/common';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { CampaignsController } from './campaigns/campaigns.controller';
import { CampaignsService } from './campaigns/campaigns.service';
import { ContentController } from './content/content.controller';
import { ContentService } from './content/content.service';
import { MediaController } from './media/media.controller';
import { MediaService } from './media/media.service';

@Module({
  imports: [TenancyModule],
  controllers: [CampaignsController, ContentController, MediaController],
  providers: [CampaignsService, ContentService, MediaService],
})
export class MarketingModule {}
