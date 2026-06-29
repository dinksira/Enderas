import { env } from '../config/env.config.js';
import { auctionService } from '../services/auction.service.js';

let intervalHandle = null;
let running = false;

async function runAutoClose() {
  if (running) {
    return;
  }

  running = true;
  try {
    const summary = await auctionService.closeExpiredPublishedAuctions();

    if (summary.closed > 0) {
      console.log(`[auction-auto-close] closed ${summary.closed} expired auction(s)`);
    }

    for (const result of summary.results) {
      if (!result.success) {
        console.warn(
          `[auction-auto-close] failed to close ${result.auctionId}: ${result.error}`,
        );
        continue;
      }

      const selection = result.winnerSelection;
      if (selection?.winner) {
        console.log(`[auction-auto-close] winner selected for auction ${result.auctionId}`);
      } else if (selection?.noBids) {
        console.log(`[auction-auto-close] no bids for auction ${result.auctionId}`);
      } else if (selection?.noReserveMet) {
        console.log(`[auction-auto-close] reserve not met for auction ${result.auctionId}`);
      }
    }
  } catch (error) {
    console.error('[auction-auto-close] job failed:', error.message);
  } finally {
    running = false;
  }
}

export function startAuctionAutoCloseJob() {
  if (!env.auctionAutoClose.enabled) {
    console.log('[auction-auto-close] disabled');
    return;
  }

  const { intervalMs } = env.auctionAutoClose;
  console.log(`[auction-auto-close] enabled (interval ${intervalMs}ms)`);

  runAutoClose();
  intervalHandle = setInterval(runAutoClose, intervalMs);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }
}

export function stopAuctionAutoCloseJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
