"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

// One server-owned value the user edits optimistically.
//
// `value` is what the UI renders: the local draft while a write is pending (and
// until the refreshed server prop catches up), otherwise `serverValue`.
//
// `commit` performs the write and resolves true on success. It owns its own
// error toast — the same contract as postChild/patchChild — so this hook only
// has to revert.
//
// Writes are serialized *per instance*: while one is in flight the newest
// requested value is queued and the intermediate ones are dropped. Clicking five
// spell-slot boxes in a row therefore issues two requests (the first click and
// the final value), can never apply an out-of-order response, and never loses a
// click.
//
// Deliberately not React 19's `useOptimistic`: an optimistic value snaps back
// when its transition settles, and `router.refresh()` gives no promise that
// resolves after the refreshed server tree commits — so the transition would
// always end before the fresh prop arrived, flashing the stale value on every
// click.
export function useOptimisticField<T>(
  serverValue: T,
  commit: (value: T) => Promise<boolean>,
): { value: T; pending: boolean; set: (next: T) => void } {
  const router = useRouter();
  // One-slot box; null means "no draft, render the server value".
  const [draft, setDraft] = useState<{ value: T } | null>(null);
  const [pending, setPending] = useState(false);

  const inFlight = useRef(false);
  const queued = useRef<{ value: T } | null>(null);
  const lastServer = useRef(serverValue);
  // Kept in a ref so `set` stays referentially stable even when the caller
  // passes a fresh closure each render. Synced in an effect rather than during
  // render; the effect runs before any click handler can fire.
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  }, [commit]);

  const drain = useCallback(async () => {
    if (inFlight.current) {
      // An active drain will pick the queue up.
      return;
    }
    inFlight.current = true;
    setPending(true);

    let ok = true;
    while (queued.current) {
      const next = queued.current;
      queued.current = null;
      ok = await commitRef.current(next.value);
      if (!ok) {
        break;
      }
    }

    inFlight.current = false;
    setPending(false);
    if (!ok) {
      queued.current = null;
      // commit() already toasted; just drop the optimistic value.
      setDraft(null);
    }
    // Always resync: on success this pulls down the new value and anything
    // derived from it; on failure it re-reads whatever did land.
    router.refresh();
  }, [router]);

  const set = useCallback(
    (next: T) => {
      setDraft({ value: next });
      queued.current = { value: next };
      void drain();
    },
    [drain],
  );

  // Reconcile: once fresh server data actually arrives and nothing is pending,
  // trust the server. This also covers a server-side clamp and another user's
  // edit, so a draft can never get permanently stuck.
  useEffect(() => {
    if (Object.is(lastServer.current, serverValue)) {
      return;
    }
    lastServer.current = serverValue;
    if (inFlight.current || queued.current) {
      return;
    }
    setDraft(null);
  }, [serverValue]);

  return { value: draft ? draft.value : serverValue, pending, set };
}
