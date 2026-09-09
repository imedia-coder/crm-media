import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PublisherService } from './publisher.service';

/**
 * Tick in-process qui pousse le moteur de publication. Suffisant pour le
 * volume actuel ; l'extraction en processus `worker-publish` dédié (et/ou le
 * passage à BullMQ) se fait plus tard sans changer PublisherService.
 *
 * Désactivable par `PUBLISH_SCHEDULER_ENABLED=false` (tests, environnements
 * où un seul nœud doit porter le cron).
 */
@Injectable()
export class PublishSchedulerService {
  private readonly logger = new Logger(PublishSchedulerService.name);
  private readonly enabled: boolean;
  private running = false;

  constructor(
    private readonly publisher: PublisherService,
    config: ConfigService,
  ) {
    this.enabled =
      config.get<string>('PUBLISH_SCHEDULER_ENABLED', 'true') !== 'false';
  }

  @Cron(CronExpression.EVERY_30_SECONDS)
  async tick(): Promise<void> {
    if (!this.enabled || this.running) return;
    this.running = true;
    try {
      const processed = await this.publisher.processDueTargets();
      if (processed > 0) {
        this.logger.log(`${processed} cible(s) de publication traitée(s)`);
      }
    } catch (err) {
      this.logger.error(
        `Tick du scheduler en erreur: ${(err as Error).message}`,
      );
    } finally {
      this.running = false;
    }
  }
}
