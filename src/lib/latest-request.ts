export type RequestSlot = { current: AbortController | null };

export function startLatestRequest(slot: RequestSlot): AbortController {
  slot.current?.abort();
  const controller = new AbortController();
  slot.current = controller;
  return controller;
}

export function cancelLatestRequest(slot: RequestSlot): void {
  slot.current?.abort();
  slot.current = null;
}

export function isCurrentRequest(slot: RequestSlot, controller: AbortController): boolean {
  return slot.current === controller && !controller.signal.aborted;
}
