"use client";

import { useEffect } from "react";
import { useFtBalance } from "@/lib/near/hooks";
import { useGameStore } from "@/store/useGameStore";

/**
 * Keeps the game store's solo.score in sync with the user's on-chain BTQ balance.
 * Call this hook from any page/component where game score matters.
 */
export function useSyncBtqBalance() {
  const { balance } = useFtBalance();
  const syncScore = useGameStore((s) => s.syncScore);

  useEffect(() => {
    syncScore(Math.floor(balance));
  }, [balance, syncScore]);
}
