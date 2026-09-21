import assert from "node:assert/strict";
import test from "node:test";

import {
  cancelLatestRequest,
  isCurrentRequest,
  startLatestRequest,
} from "../src/lib/latest-request.ts";

test("starting a newer detail request aborts and invalidates the stale request", () => {
  const state = { current: null };
  const first = startLatestRequest(state);
  const second = startLatestRequest(state);

  assert.equal(first.signal.aborted, true);
  assert.equal(isCurrentRequest(state, first), false);
  assert.equal(second.signal.aborted, false);
  assert.equal(isCurrentRequest(state, second), true);
});

test("changing the roster context aborts and invalidates an open detail request", () => {
  const state = { current: null };
  const detail = startLatestRequest(state);

  cancelLatestRequest(state);

  assert.equal(detail.signal.aborted, true);
  assert.equal(isCurrentRequest(state, detail), false);
  assert.equal(state.current, null);
});
