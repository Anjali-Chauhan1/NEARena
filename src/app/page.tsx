"use client";

import { motion, type Variants } from "framer-motion";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { Box, Coins, Skull, Swords, ArrowRight } from "lucide-react";
import { useAccount, useWalletModal } from "@/lib/near/hooks";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

const display = "font-[family-name:var(--font-cinzel)]";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] },
  }),
};

interface Row {
  id: string;
  index: string;
  label: string;
  title: string;
  text: string;
  icon: ReactNode;
}

const ROWS: Row[] = [
  {
    id: "solo",
    index: "/01",
    label: "Solo mode",
    title: "The Vault",
    text: "One chest holds the treasure. The rest are decoys and traps. Find it before your chances run out.",
    icon: <Box className="w-10 h-10" strokeWidth={1.4} />,
  },
  {
    id: "duel",
    index: "/02",
    label: "Duel mode",
    title: "The Duel Table",
    text: "Sit across from a real rival. Take turns opening chests: guns, bombs, shields and scans decide who walks away.",
    icon: <Swords className="w-10 h-10" strokeWidth={1.4} />,
  },
  {
    id: "token",
    index: "/03",
    label: "On-chain",
    title: "BTQ on NEAR",
    text: "Buy BTQ with NEAR, stake it on every round, and cash out your winnings. Every result settles on NEAR testnet.",
    icon: <Coins className="w-10 h-10" strokeWidth={1.4} />,
  },
  {
    id: "dealer",
    index: "/04",
    label: "The house",
    title: "The Dealer",
    text: "He never blinks and never leaves the table. Clear the practice vaults to earn a seat in his elite arena.",
    icon: <Skull className="w-10 h-10" strokeWidth={1.4} />,
  },
];

export default function Landing() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const { openConnectModal } = useWalletModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleEnter = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    router.push("/lobby");
  };

  if (!mounted) return null;

  return (
    <main className="relative bg-[#06070a] text-[#efe6d2] overflow-x-hidden">
      <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_28%,#7a5226_0%,#3a2614_32%,#120c08_62%,#06070a_100%)]" />
        <div className="absolute inset-0">
          <HeroScene />
        </div>
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(6,7,10,0.92)_0%,rgba(6,7,10,0.65)_32%,rgba(6,7,10,0)_62%)] max-md:bg-[linear-gradient(0deg,rgba(6,7,10,0.95)_0%,rgba(6,7,10,0.7)_45%,rgba(6,7,10,0)_75%)]" />
        <div className="absolute inset-x-0 bottom-0 h-40 pointer-events-none bg-gradient-to-t from-[#06070a] to-transparent" />

        <header className="relative z-20 flex items-center justify-between gap-4 px-5 md:px-12 py-6">
          <a href="#" className={`${display} text-xl md:text-2xl font-bold tracking-[0.18em]`}>
            NEARENA
          </a>
          <nav className="hidden md:flex items-center gap-10 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#efe6d2]/75">
            <a href="#solo" className="hover:text-[#e2b04a] transition-colors">Vault</a>
            <a href="#duel" className="hover:text-[#e2b04a] transition-colors">Duel</a>
            <a href="#token" className="hover:text-[#e2b04a] transition-colors">Token</a>
          </nav>
          <ConnectWallet />
        </header>

        <div className="relative z-10 h-[calc(100%-88px)] flex items-end md:items-center px-5 md:px-12 pb-16 md:pb-0 pointer-events-none">
          <div className="max-w-3xl pointer-events-auto">
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={0}
              className={`${display} text-sm md:text-base tracking-[0.45em] text-[#c9a46a]`}
            >
              NEARENA · BUILT ON NEAR
            </motion.p>
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={1}
              className={`${display} mt-4 text-4xl sm:text-5xl lg:text-[4.4rem] font-bold leading-[1.02] tracking-[0.02em] text-[#f6efe1] drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]`}
            >
              Open the Vault.
              <br />
              Beat the Dealer.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={2}
              className="mt-6 max-w-xl text-base md:text-lg leading-relaxed text-[#efe6d2]/70"
            >
              A high-stakes treasure game on NEAR. Stake BTQ, open the right chest before your chances run out, or face a real
              rival across the table. Every win settles on-chain.
            </motion.p>
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={3}
              className="mt-9 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={handleEnter}
                className={`${display} group flex items-center gap-3 px-8 py-4 bg-[#c9973a] text-[#120c08] text-sm font-bold tracking-[0.25em] uppercase hover:bg-[#e2b04a] transition-colors`}
              >
                {isConnected ? "Enter the Arena" : "Connect to Play"}
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
              <a
                href="#solo"
                className={`${display} px-8 py-4 border border-[#efe6d2]/30 text-sm font-semibold tracking-[0.25em] uppercase text-[#efe6d2]/85 hover:border-[#e2b04a] hover:text-[#e2b04a] transition-colors`}
              >
                How it works
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="relative px-5 md:px-12 pt-10 pb-24">
        <p className={`${display} text-center text-xs md:text-sm tracking-[0.5em] text-[#c9a46a] mb-10`}>WHAT AWAITS AT THE TABLE</p>
        <div className="max-w-6xl mx-auto">
          {ROWS.map((row) => (
            <motion.article
              id={row.id}
              key={row.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="group grid grid-cols-[1fr_auto] md:grid-cols-[180px_1fr_120px] items-center gap-6 md:gap-10 py-12 md:py-16 border-t border-[#efe6d2]/10 last:border-b scroll-mt-10"
            >
              <div className="hidden md:flex items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.25em]">
                <span className="text-[#e2b04a]">{row.index}</span>
                <span className="text-[#efe6d2]/45">{row.label}</span>
              </div>
              <div className="md:text-center">
                <p className="md:hidden text-[10px] font-semibold uppercase tracking-[0.25em] mb-2">
                  <span className="text-[#e2b04a] mr-3">{row.index}</span>
                  <span className="text-[#efe6d2]/45">{row.label}</span>
                </p>
                <h2
                  className={`${display} text-4xl sm:text-5xl lg:text-7xl font-bold tracking-[0.02em] text-[#f6efe1] group-hover:text-[#e2b04a] transition-colors duration-500`}
                >
                  {row.title}
                </h2>
                <p className="mt-4 md:mx-auto max-w-xl text-sm md:text-base text-[#efe6d2]/55 leading-relaxed">{row.text}</p>
              </div>
              <div className="justify-self-end w-20 h-24 md:w-24 md:h-28 flex items-center justify-center text-[#f3d28a] bg-[linear-gradient(160deg,#5a3d17_0%,#2a1b0c_55%,#140d06_100%)] border border-[#8a6a2f] shadow-[inset_0_0_24px_rgba(226,176,74,0.25)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-[-2deg]">
                {row.icon}
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      <section className="relative px-5 md:px-12 pb-24">
        <div className="max-w-6xl mx-auto border border-[#8a6a2f]/60 bg-[radial-gradient(ellipse_at_50%_0%,#3a2614_0%,#0c0907_70%)] px-6 py-16 md:py-20 text-center">
          <p className={`${display} text-xs tracking-[0.5em] text-[#c9a46a]`}>YOUR SEAT IS WAITING</p>
          <h2 className={`${display} mt-4 text-4xl md:text-6xl font-bold text-[#f6efe1]`}>Take Your Seat</h2>
          <p className="mt-5 mx-auto max-w-lg text-[#efe6d2]/60">
            Connect a NEAR wallet, grab some BTQ, and play your first practice vault for just 5 BTQ.
          </p>
          <button
            onClick={handleEnter}
            className={`${display} mt-9 inline-flex items-center gap-3 px-9 py-4 bg-[#c9973a] text-[#120c08] text-sm font-bold tracking-[0.25em] uppercase hover:bg-[#e2b04a] transition-colors`}
          >
            {isConnected ? "Enter the Arena" : "Connect to Play"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <footer className="px-5 md:px-12 py-8 border-t border-[#efe6d2]/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[11px] uppercase tracking-[0.25em] text-[#efe6d2]/40">
        <span className={`${display} text-sm tracking-[0.2em] text-[#efe6d2]/70`}>NEARENA</span>
        <span>NEAR Testnet · BTQ token: btq-token.testnet</span>
      </footer>
    </main>
  );
}
