"use client";

import React, { useState } from "react";
import { Wallet, LogOut, Send, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAccount, useDisconnect, useFtBalance, useNearBalance, useWriteContract } from "@/lib/near/hooks";
import { nearToYocto, shortenAccountId } from "@/lib/near/format";

const NEAR_PER_BTQ = Number(process.env.NEXT_PUBLIC_BTQ_RATE_NEAR_PER_BTQ || 0.001);

export function WalletPanel() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const [buyAmount, setBuyAmount] = useState<number>(1);
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [buyStatus, setBuyStatus] = useState<string | null>(null);
  const [withdrawStatus, setWithdrawStatus] = useState<string | null>(null);
  const minWithdrawBtq = 150;

  const { balance: nearBalance } = useNearBalance();
  const { balanceRaw: btqBalanceRaw, balance: btqBalance, refetch: refetchBtq } = useFtBalance();
  const { writeContractAsync, isPending } = useWriteContract();

  const gasReserve = 0.05; // leave a buffer for NEAR gas/storage
  const maxBuyable = Math.max(0, Math.floor((nearBalance - gasReserve) / NEAR_PER_BTQ));

  const requiredNear = (buyAmount || 0) * NEAR_PER_BTQ;
  const hasEnoughFunds = nearBalance >= requiredNear + gasReserve;

  const [operation, setOperation] = useState<"buy" | "withdraw" | null>(null);

  const handleBuy = async () => {
    if (!buyAmount || buyAmount <= 0) {
      setBuyStatus("Please enter a valid amount.");
      return;
    }
    if (!hasEnoughFunds) {
      setBuyStatus(`Insufficient funds. You have ${nearBalance.toFixed(4)} NEAR but need ~${(requiredNear + gasReserve).toFixed(4)} (${requiredNear.toFixed(4)} + buffer). Max you can buy: ${maxBuyable} BTQ.`);
      return;
    }

    try {
      setBuyStatus("Sending transaction...");
      setOperation("buy");
      await writeContractAsync({
        functionName: "buy",
        deposit: nearToYocto(requiredNear),
        gas: "30000000000000",
      });
      setBuyStatus("✓ Purchase successful!");
      await refetchBtq();
      setTimeout(() => {
        setShowBuyModal(false);
        setBuyStatus(null);
      }, 1500);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setBuyStatus(`Error: ${msg}`);
    } finally {
      setOperation(null);
    }
  };

  const handleWithdraw = async () => {
    if (btqBalance < minWithdrawBtq || !btqBalanceRaw) {
      setWithdrawStatus(`Minimum withdraw is ${minWithdrawBtq} BTQ.`);
      return;
    }

    try {
      setWithdrawStatus("Selling BTQ for NEAR...");
      setOperation("withdraw");
      await writeContractAsync({
        functionName: "sell",
        args: { amount: btqBalanceRaw },
        gas: "30000000000000",
      });
      setWithdrawStatus("✓ Withdraw successful!");
      await refetchBtq();
      setTimeout(() => {
        setShowWithdrawModal(false);
        setWithdrawStatus(null);
      }, 1500);
    } catch (err: any) {
      const msg = err?.message || String(err);
      setWithdrawStatus(`Error: ${msg}`);
    } finally {
      setOperation(null);
    }
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 p-6 bg-[linear-gradient(160deg,#2a1d10_0%,#14100b_55%,#0c0a08_100%)] border border-[#8a6a2f]/60 text-[#efe6d2]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-[#e2b04a]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#efe6d2]/50">BTQ Balance</span>
            <span className="font-[family-name:var(--font-cinzel)] text-3xl font-bold text-[#f6efe1]">{btqBalance.toFixed(2)}</span>
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="flex items-center gap-2 px-3 py-2 border border-[#a93226]/60 text-[#e74c3c] text-[10px] font-semibold uppercase tracking-[0.2em] hover:bg-[#a93226]/20 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      <div className="flex items-center justify-between bg-black/30 px-3 py-2 border border-[#efe6d2]/10">
        <span className="text-[11px] text-[#efe6d2]/55">{address ? shortenAccountId(address) : ""}</span>
        <span className="text-[11px] font-semibold text-[#e2b04a]">{nearBalance.toFixed(4)} NEAR</span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowBuyModal(!showBuyModal)}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-[#c9973a] text-[#120c08] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#e2b04a] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Buy BTQ
        </button>
        <button
          onClick={() => setShowWithdrawModal(!showWithdrawModal)}
          disabled={btqBalance < minWithdrawBtq}
          className="flex items-center justify-center gap-2 px-4 py-3 border border-[#efe6d2]/30 text-[#efe6d2]/85 text-[11px] font-bold uppercase tracking-[0.2em] hover:border-[#e2b04a] hover:text-[#e2b04a] transition-colors disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:border-[#efe6d2]/30 disabled:hover:text-[#efe6d2]/85"
        >
          <Send className="w-4 h-4" />
          Sell BTQ
        </button>
      </div>

      <p className="text-[10px] uppercase tracking-[0.25em] text-[#efe6d2]/40">Minimum withdraw: {minWithdrawBtq} BTQ</p>

      <AnimatePresence>
        {showBuyModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/35 border border-[#8a6a2f]/50 p-4 space-y-3 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-[family-name:var(--font-cinzel)] text-sm font-bold tracking-[0.15em] text-[#e2b04a]">Buy BTQ</h4>
              <p className="text-[10px] text-[#efe6d2]/50">1 BTQ = {NEAR_PER_BTQ} NEAR</p>
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                max={maxBuyable}
                value={buyAmount}
                onChange={(e) => setBuyAmount(Math.max(0, Number(e.target.value)))}
                className="min-w-0 flex-1 bg-black/50 border border-[#efe6d2]/15 px-3 py-2 text-sm text-[#f6efe1] outline-none focus:border-[#e2b04a]"
                placeholder="Amount"
              />
              <button
                onClick={() => setBuyAmount(maxBuyable)}
                className="px-3 py-2 border border-[#efe6d2]/20 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#efe6d2]/75 hover:border-[#e2b04a] hover:text-[#e2b04a] transition-colors"
              >
                Max
              </button>
              <button
                onClick={handleBuy}
                disabled={isPending || operation === "buy" || !hasEnoughFunds || buyAmount <= 0}
                className="px-4 py-2 bg-[#c9973a] text-[#120c08] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#e2b04a] transition-colors disabled:opacity-40"
              >
                {isPending && operation === "buy" ? "..." : "Buy"}
              </button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[10px] text-[#efe6d2]/55">Cost: ~{requiredNear.toFixed(4)} NEAR</p>
              <p className={`text-[10px] font-semibold ${hasEnoughFunds ? "text-[#3fae5a]" : "text-[#e74c3c]"}`}>
                {hasEnoughFunds ? `Affordable (max ${maxBuyable})` : `Need more NEAR (max ${maxBuyable})`}
              </p>
            </div>
            {isPending && operation === "buy" && <p className="text-[10px] text-[#efe6d2]/75">Waiting for confirmation...</p>}
            {buyStatus && (
              <p className={`text-[10px] break-words ${buyStatus.startsWith("✓") ? "text-[#3fae5a]" : "text-[#e74c3c]"}`}>{buyStatus}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWithdrawModal && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/35 border border-[#8a6a2f]/50 p-4 space-y-3 overflow-hidden"
          >
            <h4 className="font-[family-name:var(--font-cinzel)] text-sm font-bold tracking-[0.15em] text-[#e2b04a]">Sell BTQ</h4>
            <p className="text-[11px] text-[#efe6d2]/60">Withdraw {btqBalance.toFixed(2)} BTQ back to NEAR.</p>
            <button
              onClick={handleWithdraw}
              disabled={isPending || operation === "withdraw" || btqBalance < minWithdrawBtq}
              className="w-full px-4 py-2.5 bg-[#c9973a] text-[#120c08] text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-[#e2b04a] transition-colors disabled:opacity-40"
            >
              {isPending && operation === "withdraw" ? "Processing..." : "Withdraw all"}
            </button>
            {isPending && operation === "withdraw" && <p className="text-[10px] text-[#efe6d2]/75">Waiting for confirmation...</p>}
            {withdrawStatus && (
              <p className={`text-[10px] break-words ${withdrawStatus.startsWith("✓") ? "text-[#3fae5a]" : "text-[#e74c3c]"}`}>{withdrawStatus}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WalletPanel;
