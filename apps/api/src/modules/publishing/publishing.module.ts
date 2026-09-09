import { Module } from '@nestjs/common';
import { AuthModule } from '../../core/auth/auth.module';
import { TenancyModule } from '../../core/tenancy/tenancy.module';
import { SocialModule } from '../social/social.module';
import { AdapterRegistry } from './adapters/adapter-registry';
import { MediaLinkService } from './media-link.service';
import { PublishSchedulerService } from './publish-scheduler.service';
import { PublisherService } from './publisher.service';
import { PublishingController } from './publishing.controller';
import { PublishingService } from './publishing.service';

@Module({
  imports: [TenancyModule, AuthModule, SocialModule],
  controllers: [PublishingController],
  providers: [
    PublishingService,
    PublisherService,
    PublishSchedulerService,
    AdapterRegistry,
    MediaLinkService,
  ],
  exports: [PublishingService, PublisherService],
})
export class PublishingModule {}
