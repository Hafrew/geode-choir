// Manual saves have always retained up to nine calls. Offline arrivals can exceed
// the active three-call clock limit, but never overwrite a pending sounding.
export const OFFLINE_HORN_CAP = 5;
export const ACTIVE_HORN_QUEUE_CAP = 3;
export const SAVED_HORN_QUEUE_CAP = 9;
export function advanceOfflineHorns(S, seconds, speed, efficiency, interval) {
  const work = seconds * speed * efficiency;
  if (!S.hornsOn || !(work > 0) || !Number.isFinite(work) || !(interval > 0) || !Number.isFinite(interval)) return 0;
  const timer = Number.isFinite(S.hornTimer) ? Math.max(0, S.hornTimer) : interval;
  if (work < timer) { S.hornTimer = timer - work; return 0; }
  const due = 1 + Math.floor((work - timer) / interval);
  const room = S.hornAuto ? OFFLINE_HORN_CAP : Math.max(0, SAVED_HORN_QUEUE_CAP - S.hornQueue - (S.hornPlan ? 1 : 0));
  const count = Math.min(due, OFFLINE_HORN_CAP, room);
  // Excess work is consumed on this return, never banked for another batch.
  // A full manual queue holds its clock as it does during active play.
  S.hornTimer = !S.hornAuto && S.hornQueue + (S.hornPlan ? 1 : 0) + count >= ACTIVE_HORN_QUEUE_CAP
    ? 0 : due > count ? interval : interval - (work - timer) % interval;
  return count;
}
