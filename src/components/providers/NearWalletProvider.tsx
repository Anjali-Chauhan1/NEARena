"use client";

import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { setupWalletSelector, type WalletSelector, type AccountState } from "@near-wallet-selector/core";
import { setupModal, type WalletSelectorModal } from "@near-wallet-selector/modal-ui";
import { setupMeteorWallet } from "@near-wallet-selector/meteor-wallet";
import { setupHereWallet } from "@near-wallet-selector/here-wallet";
import "@near-wallet-selector/modal-ui/styles.css";
import { CONTRACT_NAME, NEAR_NETWORK } from "@/lib/near/config";

interface NearWalletContextValue {
  selector: WalletSelector | null;
  modal: WalletSelectorModal | null;
  accounts: AccountState[];
  accountId: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const NearWalletContext = createContext<NearWalletContextValue>({
  selector: null,
  modal: null,
  accounts: [],
  accountId: null,
  loading: true,
  signOut: async () => {},
});

export function useNearWalletContext() {
  return useContext(NearWalletContext);
}

export function NearWalletProvider({ children }: { children: React.ReactNode }) {
  const [selector, setSelector] = useState<WalletSelector | null>(null);
  const [modal, setModal] = useState<WalletSelectorModal | null>(null);
  const [accounts, setAccounts] = useState<AccountState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | undefined;

    (async () => {
      const nextSelector = await setupWalletSelector({
        network: NEAR_NETWORK,
        modules: [setupMeteorWallet(), setupHereWallet()],
      });
      if (!isMounted) return;

      const nextModal = setupModal(nextSelector, { contractId: CONTRACT_NAME });

      setSelector(nextSelector);
      setModal(nextModal);
      setAccounts(nextSelector.store.getState().accounts);
      setLoading(false);

      const sub = nextSelector.store.observable.subscribe((state) => {
        setAccounts(state.accounts);
      });
      unsubscribe = () => sub.unsubscribe();
    })();

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  const signOut = useCallback(async () => {
    if (!selector) return;
    const wallet = await selector.wallet();
    await wallet.signOut();
  }, [selector]);

  const accountId = accounts.find((account) => account.active)?.accountId ?? null;

  const value = useMemo<NearWalletContextValue>(
    () => ({ selector, modal, accounts, accountId, loading, signOut }),
    [selector, modal, accounts, accountId, loading, signOut]
  );

  return <NearWalletContext.Provider value={value}>{children}</NearWalletContext.Provider>;
}

export default NearWalletProvider;
