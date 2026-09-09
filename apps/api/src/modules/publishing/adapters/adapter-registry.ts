import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SocialNetwork } from '@prisma/client';
import { FakeNetworkAdapter } from './fake-network.adapter';
import { MetaAdapter } from './meta.adapter';
import { NetworkAdapter } from './network-adapter';
import { TikTokAdapter } from './tiktok.adapter';

/**
 * Choisit l'adaptateur par réseau :
 *  - INSTAGRAM / FACEBOOK → MetaAdapter si META_APP_ID + META_APP_SECRET ;
 *  - TIKTOK → TikTokAdapter si TIKTOK_CLIENT_KEY + TIKTOK_CLIENT_SECRET ;
 *  - sinon FakeNetworkAdapter.
 * Le PublisherService ne connaît que l'interface NetworkAdapter.
 */
@Injectable()
export class AdapterRegistry {
  private readonly logger = new Logger(AdapterRegistry.name);
  private readonly adapters = new Map<SocialNetwork, NetworkAdapter>();

  constructor(config: ConfigService) {
    const metaReady = Boolean(
      config.get('META_APP_ID') && config.get('META_APP_SECRET'),
    );
    const graphVersion = config.get<string>('META_GRAPH_VERSION') ?? 'v21.0';
    const tiktokReady = Boolean(
      config.get('TIKTOK_CLIENT_KEY') && config.get('TIKTOK_CLIENT_SECRET'),
    );

    for (const network of Object.values(SocialNetwork)) {
      this.adapters.set(
        network,
        this.pick(network, { metaReady, graphVersion, tiktokReady }),
      );
    }
    this.logger.log(
      `Adaptateurs: ${[...this.adapters.entries()]
        .map(([n, a]) => `${n}=${a.constructor.name}`)
        .join(', ')}`,
    );
  }

  private pick(
    network: SocialNetwork,
    opts: { metaReady: boolean; graphVersion: string; tiktokReady: boolean },
  ): NetworkAdapter {
    if (
      opts.metaReady &&
      (network === SocialNetwork.INSTAGRAM ||
        network === SocialNetwork.FACEBOOK)
    ) {
      return new MetaAdapter(network, opts.graphVersion);
    }
    if (opts.tiktokReady && network === SocialNetwork.TIKTOK) {
      return new TikTokAdapter();
    }
    return new FakeNetworkAdapter(network);
  }

  for(network: SocialNetwork): NetworkAdapter {
    const adapter = this.adapters.get(network);
    if (!adapter)
      throw new Error(`Aucun adaptateur enregistré pour ${network}`);
    return adapter;
  }
}
