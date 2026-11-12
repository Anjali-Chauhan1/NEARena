"use client";

import React, { useEffect } from "react";
import { useAccount, useDisconnect, useWalletModal } from "@/lib/near/hooks";
import { shortenAccountId } from "@/lib/near/format";

const CONNECTED_CLASS =
  "px-5 py-2.5 border border-[#efe6d2]/30 text-[#efe6d2] text-[11px] font-semibold uppercase tracking-[0.25em] hover:border-[#e2b04a] hover:text-[#e2b04a] transition-colors";
const CONNECT_CLASS =
  "px-5 py-2.5 border border-[#c9973a] text-[#e2b04a] text-[11px] font-semibold uppercase tracking-[0.25em] hover:bg-[#c9973a] hover:text-[#120c08] transition-colors";

export function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnectModal } = useWalletModal();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isConnected && address) {
      localStorage.setItem("nearena_user", shortenAccountId(address));
      localStorage.setItem("nearena_wallet_id", address.toLowerCase());
    } else {
      localStorage.removeItem("nearena_user");
      localStorage.removeItem("nearena_wallet_id");
    }
  }, [address, isConnected]);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className={CONNECTED_CLASS}
      >
        {shortenAccountId(address)}
      </button>
    );
  }

  return (
    <button
      onClick={() => openConnectModal?.()}
      className={CONNECT_CLASS}
    >
      Connect NEAR Wallet
    </button>
  );
}

export default ConnectWallet;
