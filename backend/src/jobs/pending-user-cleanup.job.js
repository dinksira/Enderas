import { env } from '../config/env.config.js';
import { purgeExpiredPendingRegistrations } from '../modules/auth/auth.service.js';

let intervalHandle = null;
let running = false;

async function runPendingUserCleanup() {
  if (running) {
    return;
  }

  running = true;
  try {
    const { deleted } = await purgeExpiredPendingRegistrations(
      env.pendingUserCleanup.ttlHours,
    );

    if (deleted > 0) {
      console.log(
        `[pending-user-cleanup] hard-deleted ${deleted} expired pending registration(s)`,
      );
    }
  } catch (error) {
    console.error('[pending-user-cleanup] job failed:', error.message);
  } finally {
    running = false;
  }
}

export function startPendingUserCleanupJob() {
  if (!env.pendingUserCleanup.enabled) {
    console.log('[pending-user-cleanup] disabled');
    return;
  }

  const { intervalMs, ttlHours } = env.pendingUserCleanup;
  console.log(
    `[pending-user-cleanup] enabled (interval ${intervalMs}ms, ttl ${ttlHours}h)`,
  );

  runPendingUserCleanup();
  intervalHandle = setInterval(runPendingUserCleanup, intervalMs);
  if (typeof intervalHandle.unref === 'function') {
    intervalHandle.unref();
  }
}

export function stopPendingUserCleanupJob() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
