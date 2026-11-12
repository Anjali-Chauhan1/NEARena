"use client";

import { useCallback, useEffect, useState } from "react";
import { useNearWalletContext } from "@/components/providers/NearWalletProvider";
import { callMethod, ensureStorageDeposit, ftBalanceOf, getAccountBalance } from "./contract";
import { yoctoToBtq, yoctoToNear } from "./format";

export function useAccount() {
  const { accountId, loading } = useNearWalletContext();
  return { address: accountId ?? undefined, isConnected: !!accountId, isLoading: loading };
}

export function useDisconnect() {
  const { signOut } = useNearWalletContext();
  return { disconnect: signOut };
}

export function useWalletModal() {
  const { modal, accountId } = useNearWalletContext();
  const openConnectModal = useCallback(() => modal?.show(), [modal]);
  return { openConnectModal, accountId };
}

export interface WriteContractArgs {
  functionName: string;
  args?: Record<string, unknown>;
  deposit?: string;
  gas?: string;
}

export function useWriteContract() {
  const { selector, accountId } = useNearWalletContext();
  const [isPending, setIsPending] = useState(false);

  const writeContractAsync = useCallback(
    async ({ functionName, args = {}, deposit, gas }: WriteContractArgs) => {
      if (!selector || !accountId) throw new Error("Wallet not connected");
      setIsPending(true);
      try {
        if (functionName !== "storage_deposit") {
          await ensureStorageDeposit(selector, accountId);
        }
        return await callMethod(selector, { methodName: functionName, args, deposit, gas });
      } finally {
        setIsPending(false);
      }
    },
    [selector, accountId]
  );

  return { writeContractAsync, isPending };
}

export function useFtBalance(pollMs = 4000) {
  const { accountId } = useNearWalletContext();
  const [balanceRaw, setBalanceRaw] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!accountId) return;
    try {
      const balance = await ftBalanceOf(accountId);
      setBalanceRaw(balance);
    } catch {
      setBalanceRaw((prev) => prev ?? "0");
    }
  }, [accountId]);

  useEffect(() => {
    if (!accountId) {
      setBalanceRaw(null);
      return;
    }
    refetch();
    const interval = setInterval(refetch, pollMs);
    return () => clearInterval(interval);
  }, [accountId, pollMs, refetch]);

  return { balanceRaw, balance: yoctoToBtq(balanceRaw), refetch };
}

export function useNearBalance(pollMs = 10000) {
  const { accountId } = useNearWalletContext();
  const [balanceRaw, setBalanceRaw] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setBalanceRaw(null);
      return;
    }
    let cancelled = false;
    const fetchBalance = async () => {
      const balance = await getAccountBalance(accountId);
      if (!cancelled) setBalanceRaw(balance);
    };
    fetchBalance();
    const interval = setInterval(fetchBalance, pollMs);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [accountId, pollMs]);

  return { balanceRaw, balance: yoctoToNear(balanceRaw) };
}
