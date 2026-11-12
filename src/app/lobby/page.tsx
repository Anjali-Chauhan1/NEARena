"use client";

import { motion, type Variants } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Box, Swords, User } from "lucide-react";
import { getWalletUser } from "@/lib/user";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { RoomCard } from "@/components/lobby/RoomCard";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import WalletPanel from "@/components/wallet/WalletPanel";
import { useSyncBtqBalance } from "@/hooks/useSyncBtqBalance";

const HeroScene = dynamic(() => import("@/components/landing/HeroScene"), { ssr: false });

const display = "font-[family-name:var(--font-cinzel)]";

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number = 0) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.8, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] },
    }),
};

export default function Lobby() {
    const router = useRouter();
    const walletUser = getWalletUser();
    const [mounted, setMounted] = useState(false);

    useSyncBtqBalance();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <AuthGuard>
            <main className="relative min-h-screen bg-[#06070a] text-[#efe6d2] overflow-x-hidden">
                <section className="relative h-[68vh] min-h-[480px] w-full overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_72%_28%,#7a5226_0%,#3a2614_32%,#120c08_62%,#06070a_100%)]" />
                    <div className="absolute inset-0">
                        <HeroScene />
                    </div>
                    <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(90deg,rgba(6,7,10,0.92)_0%,rgba(6,7,10,0.6)_34%,rgba(6,7,10,0)_62%)] max-md:bg-[linear-gradient(0deg,rgba(6,7,10,0.95)_0%,rgba(6,7,10,0.65)_50%,rgba(6,7,10,0)_80%)]" />
                    <div className="absolute inset-x-0 bottom-0 h-32 pointer-events-none bg-gradient-to-t from-[#06070a] to-transparent" />

                    <header className="relative z-20 flex items-center justify-between gap-4 px-5 md:px-12 py-6">
                        <Link href="/" className={`${display} text-xl md:text-2xl font-bold tracking-[0.18em]`}>
                            NEARENA
                        </Link>
                        <div className="flex items-center gap-3 md:gap-5">
                            <span className="hidden md:block text-[11px] font-semibold uppercase tracking-[0.25em] text-[#efe6d2]/60">
                                {walletUser}
                            </span>
                            <ConnectWallet />
                            <button
                                onClick={() => router.push("/profile")}
                                aria-label="Profile"
                                className="w-11 h-11 flex items-center justify-center border border-[#efe6d2]/30 text-[#efe6d2]/85 hover:border-[#e2b04a] hover:text-[#e2b04a] transition-colors"
                            >
                                <User className="w-5 h-5" />
                            </button>
                        </div>
                    </header>

                    <div className="relative z-10 h-[calc(100%-92px)] flex items-end md:items-center px-5 md:px-12 pb-10 md:pb-0 pointer-events-none">
                        <div className="max-w-2xl">
                            <motion.p
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={0}
                                className={`${display} text-xs md:text-sm tracking-[0.45em] text-[#c9a46a] uppercase`}
                            >
                                Welcome back · {walletUser}
                            </motion.p>
                            <motion.h1
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={1}
                                className={`${display} mt-4 text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] text-[#f6efe1] drop-shadow-[0_4px_30px_rgba(0,0,0,0.6)]`}
                            >
                                Choose Your Table
                            </motion.h1>
                            <motion.p
                                variants={fadeUp}
                                initial="hidden"
                                animate="visible"
                                custom={2}
                                className="mt-5 max-w-xl text-base md:text-lg leading-relaxed text-[#efe6d2]/70"
                            >
                                Crack the Dealer&apos;s vault on your own, or stake BTQ against a real rival. Your balance settles on NEAR after
                                every round.
                            </motion.p>
                        </div>
                    </div>
                </section>

                <section className="relative px-5 md:px-12 pt-6 pb-20">
                    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
                            <RoomCard
                                index="/01"
                                label="Solo mode"
                                title="The Vault"
                                description="One chest holds the treasure, the rest are decoys and traps. Find it before your chances run out."
                                stake="From 5 BTQ"
                                reward="1.5x+"
                                icon={<Box className="w-8 h-8" strokeWidth={1.4} />}
                                onClick={() => router.push("/arena?mode=solo")}
                            />
                        </motion.div>
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
                            <RoomCard
                                index="/02"
                                label="Duel mode"
                                title="The Duel Table"
                                description="Two players, one grid of chests. Take turns, use your items, and drain your rival's lives to win the pot."
                                stake="50–200 BTQ"
                                reward="2x pot"
                                icon={<Swords className="w-8 h-8" strokeWidth={1.4} />}
                                onClick={() => router.push("/arena?mode=duel")}
                            />
                        </motion.div>
                        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={5} className="flex flex-col gap-3">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.25em]">
                                <span className="text-[#e2b04a] mr-3">/03</span>
                                <span className="text-[#efe6d2]/45">Your purse</span>
                            </p>
                            <WalletPanel />
                        </motion.div>
                    </div>
                </section>
            </main>
        </AuthGuard>
    );
}
