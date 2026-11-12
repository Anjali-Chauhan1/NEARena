"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { Users, User, Rocket, Shield, TrendingUp, Wallet, ChevronRight, LayoutGrid, Zap, Cpu, Globe } from "lucide-react";
import { getWalletUser } from "@/lib/user";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { RoomCard } from "@/components/lobby/RoomCard";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";
import WalletPanel from "@/components/wallet/WalletPanel";
import { useSyncBtqBalance } from "@/hooks/useSyncBtqBalance";
import { useState, useEffect } from "react";

export default function Lobby() {
    const router = useRouter();
    const walletUser = getWalletUser();
    const [mounted, setMounted] = useState(false);

    // Sync on-chain BTQ balance → game store score
    useSyncBtqBalance();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, scale: 0.95 },
        visible: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
    };

    return (
        <AuthGuard>
            <main className="min-h-screen bg-[#020203] relative overflow-hidden flex flex-col items-center font-mono cyber-grid">
                {/* Scanline Effect */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
                
                {/* Dynamic Background Glows */}
                <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 blur-[180px] rounded-full animate-aurora pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/5 blur-[150px] rounded-full animate-aurora pointer-events-none [animation-delay:4s]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.03)_0%,transparent_70%)] pointer-events-none" />

                {/* Decorative Orbital Grid */}
                <div className="absolute top-20 right-[-10%] w-[500px] h-[500px] border border-primary/10 rounded-full animate-[spin_60s_linear_infinite] pointer-events-none">
                    <div className="absolute top-1/2 left-0 w-2 h-2 bg-primary rounded-full -translate-x-1/2 shadow-[0_0_10px_var(--primary)]" />
                </div>
                <div className="absolute bottom-20 left-[-10%] w-[400px] h-[400px] border border-secondary/10 rounded-full animate-[spin_40s_linear_infinite_reverse] pointer-events-none">
                    <div className="absolute top-0 left-1/2 w-2 h-2 bg-secondary rounded-full -translate-y-1/2 shadow-[0_0_10px_var(--secondary)]" />
                </div>

                <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

                <div className="relative z-10 w-full max-w-7xl px-8 py-10 flex flex-col gap-12">

                    {/* Premium Navigation Header */}
                    <header className="flex justify-between items-center bg-background/80 p-6 border-2 border-primary/20 backdrop-blur-xl group transition-all duration-500 hover:border-primary/40"
                        style={{ clipPath: 'polygon(0 0, 98% 0, 100% 15%, 100% 100%, 2% 100%, 0 85%)' }}>
                        <div className="flex items-center gap-8">
                            <motion.div
                                whileHover={{ rotate: 90, scale: 1.1 }}
                                className="w-14 h-14 bg-background border-2 border-primary flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(0,242,255,0.2)]"
                                style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}
                            >
                                <LayoutGrid className="text-primary w-6 h-6" />
                            </motion.div>
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3">
                                    <h2 className="text-4xl font-black italic tracking-tighter uppercase text-white neon-text">NEAR<span className="text-primary">ENA</span></h2>
                                    <span className="px-3 py-1 bg-primary/20 border border-primary/40 text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">SYSTEM_ACTIVE</span>
                                </div>
                                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-[0.5em] mt-1 ml-1 font-mono">&gt; MAIN_TERMINAL_INPUT</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-10">
                            <div className="hidden md:flex flex-col items-end gap-1">
                                <span className="text-base font-black italic uppercase tracking-[0.2em] text-white/90 font-mono">
                                    {walletUser}
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-primary uppercase font-black tracking-widest opacity-70 font-mono">WALLET_AUTH_OK</span>
                                    <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                                </div>
                            </div>

                            <div className="h-10 w-[1px] bg-primary/20" />

                            <div className="flex items-center">
                              <ConnectWallet />
                            </div>

                            <div className="h-10 w-[1px] bg-primary/20" />

                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => router.push("/profile")}
                                className="relative w-14 h-14 bg-background border-2 border-secondary flex items-center justify-center group overflow-hidden shadow-[0_0_15px_rgba(188,19,254,0.2)]"
                                style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }}
                            >
                                <div className="absolute inset-0 bg-secondary/10 group-hover:bg-secondary/20 transition-colors" />
                                <User className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />
                            </motion.button>
                        </div>
                    </header>

                    {/* Strategic Banner */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col md:flex-row md:items-end justify-between gap-8 py-5 border-l-4 border-primary/50 pl-8 bg-gradient-to-r from-primary/5 to-transparent"
                    >
                        <div className="space-y-6 max-w-3xl relative z-10">
                            <div className="flex items-center gap-3">
                                <motion.span 
                                    animate={{ opacity: [0.4, 1, 0.4] }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="text-[11px] font-black text-primary uppercase tracking-[.4em] font-mono"
                                >
                                    SCANNING_AVAILABLE_SECTORS...
                                </motion.span>
                                <div className="h-[1px] w-24 bg-primary/30" />
                            </div>
                            <h3 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9]">
                                Engage Your Next <br />
                                <span className="neon-text-blue drop-shadow-[0_0_10px_rgba(0,242,255,0.2)]">Tactical Phase</span>
                            </h3>
                            <p className="text-gray-400 text-lg md:text-xl font-medium max-w-xl italic leading-relaxed font-sans">
                                Forge alliances, outplay your rivals, and shape every match with decisions that matter.
                                In NEARena, every move can shift the balance of power.
                            </p>
                        </div>
                        
                        {/* Wallet Panel */}
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="w-full md:w-96 shrink-0"
                        >
                            <WalletPanel />
                        </motion.div>
                    </motion.div>

                    {/* Arena Grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
                    >
                        <motion.div variants={itemVariants}>
                            <RoomCard
                                title="Solo"
                                icon={<User className="w-10 h-10" />}
                                entryFee={5}
                                avgReward={12}
                                stats="Prediction arena against the AI dealer."
                                variant="blue"
                                onClick={() => router.push("/arena?mode=solo")}
                            />
                        </motion.div>

                        <motion.div variants={itemVariants}>
                            <RoomCard
                                title="Duel"
                                icon={<Users className="w-10 h-10" />}
                                entryFee={10}
                                avgReward={20}
                                stats="2 players, same chest grid, turn-based real-time combat."
                                variant="pink"
                                onClick={() => router.push("/arena?mode=duel")}
                            />
                        </motion.div>
                    </motion.div>

                </div>

                {/* Subtle decorative grid floor */}
                <div className="fixed bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-primary/5 via-transparent to-transparent pointer-events-none opacity-40" />
            </main>
        </AuthGuard>
    );
}
