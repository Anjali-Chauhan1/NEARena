"use client";

import { motion, AnimatePresence, Variants } from "framer-motion";
import { useRouter } from "next/navigation";
import { 
  Shield, Target, Zap, Swords, ChevronRight, Globe, TrendingUp, 
  Terminal, Activity, Cpu, Fingerprint, Lock, Radio
} from "lucide-react";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { useState, useEffect } from "react";
import { useAccount, useWalletModal } from "@/lib/near/hooks";
import { ConnectWallet } from "@/components/wallet/ConnectWallet";

export default function Onboarding() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const { isConnected } = useAccount();
  const { openConnectModal } = useWalletModal();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleJoin = () => {
    if (!isConnected) {
      openConnectModal?.();
      return;
    }
    router.push("/lobby");
  };

  if (!mounted) return null;

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#020203] text-white font-mono cyber-grid py-12">
      {/* Background Atmosphere */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
      
      {/* Dynamic Aurora Glows (No Text Glow) */}
      <div className="absolute top-[-5%] left-[-5%] w-[1200px] h-[1200px] bg-primary/20 blur-[250px] rounded-full animate-aurora pointer-events-none opacity-60" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[1000px] h-[1000px] bg-secondary/10 blur-[200px] rounded-full animate-aurora pointer-events-none [animation-delay:6s] opacity-40" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,242,255,0.05)_0%,transparent_70%)] pointer-events-none" />
      
      {/* Decorative Rings */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] border border-primary/5 rounded-full animate-[spin_180s_linear_infinite] pointer-events-none" />
      <div className="absolute bottom-[-15%] left-[-10%] w-[500px] h-[500px] border border-secondary/5 rounded-full animate-[spin_150s_linear_infinite_reverse] pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-7xl mx-auto px-6 flex flex-col items-center gap-8"
      >
        {/* Top Status Bar */}
        <motion.div variants={itemVariants} className="w-full flex justify-between items-center glass-panel px-6 py-2 border-white/5 bg-white/[0.01]">
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-primary">System_Online</span>
                </div>
                <div className="h-3 w-[1px] bg-white/10" />
                <div className="flex items-center gap-2">
                    <Radio className="w-2.5 h-2.5 text-gray-600" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Node: SECTOR_Q-CORE</span>
                </div>
            </div>
            <div className="flex items-center gap-4 text-[9px] font-black text-gray-600 uppercase tracking-widest">
                <span>Latency: 22ms</span>
                <span>Uplinks: 1,402</span>
            </div>
        </motion.div>

        {/* Hero Section (Compact) */}
        <div className="flex flex-col items-center gap-6 text-center relative">
            {/* Logo Emblem */}
            <motion.div
                variants={itemVariants}
                className="relative"
            >
                <div className="absolute inset-[-15px] border border-primary/10 rounded-full animate-[spin_25s_linear_infinite]" style={{ borderStyle: 'dashed' }} />
                <div className="w-24 h-24 bg-background border-2 border-primary flex items-center justify-center p-6 relative z-10"
                     style={{ clipPath: 'polygon(20% 0, 100% 0, 100% 100%, 0 100%, 0 20%)' }}>
                    <Swords className="w-full h-full text-primary" />
                </div>
            </motion.div>

            <div className="space-y-1">
                <motion.h1 
                    variants={itemVariants}
                    className="text-7xl md:text-[9rem] font-black tracking-tighter uppercase italic leading-none text-white drop-shadow-[0_0_15px_rgba(0,242,255,0.4)]"
                >
                    NEAR<span className="text-primary">ENA</span>
                </motion.h1>
                <motion.div variants={itemVariants} className="flex items-center justify-center gap-4 opacity-20">
                    <div className="h-[1px] w-10 bg-white" />
                    <span className="text-[8px] font-black tracking-[0.8em] uppercase">Tactical Arena Network</span>
                    <div className="h-[1px] w-10 bg-white" />
                </motion.div>
            </div>

            <motion.p 
                variants={itemVariants}
                className="text-base md:text-lg text-gray-500 max-w-xl font-medium tracking-tight leading-relaxed font-mono"
            >
                &gt; INITIALIZING_OPERATIVE_LINK...<br/>
                <span className="text-white bg-white/5 px-3 py-0.5 border-l-2 border-primary inline-block mt-1 uppercase text-xs tracking-widest">
                    Strategize. Stake. Survive.
                </span>
            </motion.p>
        </div>

        {/* Action Center (Pulled Higher) */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-8 w-full">
            {!isConnected && (
              <div className="flex flex-col items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Connect Wallet To Initialize</span>
                <ConnectWallet />
              </div>
            )}
            <div className="relative group">
                <div className="absolute -inset-4 border border-primary/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleJoin}
                  aria-disabled={!isConnected}
                  className="relative px-12 py-5 bg-primary text-black font-black italic uppercase text-2xl tracking-[0.3em] transition-all overflow-hidden"
                    style={{ clipPath: 'polygon(5% 0, 100% 0, 95% 100%, 0 100%)' }}
                >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out" />
                    <span className="relative z-10 flex items-center gap-3">
                       INITIATE <ChevronRight className="w-8 h-8 group-hover:translate-x-1 transition-transform" />
                    </span>
                </motion.button>
            </div>
            
            {/* System Specs */}
            <div className="grid grid-cols-4 gap-12 opacity-30">
                <div className="flex flex-col items-center gap-0.5">
                    <Fingerprint className="w-4 h-4 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">Biometric</span>
                    <span className="text-[7px] font-bold">SECURED</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <Shield className="w-4 h-4 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-secondary">Trust-B</span>
                    <span className="text-[7px] font-bold">ACTIVE</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <Lock className="w-4 h-4 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-accent">Vault</span>
                    <span className="text-[7px] font-bold">LOCKED</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                    <Activity className="w-4 h-4 mb-0.5" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-primary">Pulse</span>
                    <span className="text-[7px] font-bold">STABLE</span>
                </div>
            </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div 
            variants={itemVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl"
        >
          <FeatureCard 
            icon={<Target className="w-7 h-7 text-primary" />}
            title="Sovereign Engine"
            desc="Master the predictive behavior patterns of Solo Sectors. Clear high-density grids to harvest initial BTQ reserves."
          />
          <FeatureCard 
            icon={<Swords className="w-7 h-7 text-secondary" />}
            title="Tactical Duels"
            desc="Challenge rival operatives in real-time 1v1 combat. Your shared-grid maneuvers dictate the final system outcome."
          />
          <FeatureCard 
            icon={<Shield className="w-7 h-7 text-accent" />}
            title="Honor Protocol"
            desc="Your Operative Tier determines your global standing. Advance to Elite rank to unlock maximum system clearance."
          />
        </motion.div>

        {/* Bottom Technical Readout */}
        <motion.div variants={itemVariants} className="mt-2 flex flex-col items-center gap-2 opacity-20">
            <div className="flex items-center gap-6">
              <span className="text-[8px] font-black uppercase tracking-[0.5em]">Auth: WALLET_ONLY</span>
                <span className="text-[8px] font-black uppercase tracking-[0.5em]">Ver: 2.5.0_ALPHA</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-16 h-[1px] bg-gradient-to-r from-transparent to-white/20" />
                <Terminal className="w-2.5 h-2.5" />
                <div className="w-16 h-[1px] bg-gradient-to-l from-transparent to-white/20" />
            </div>
        </motion.div>
      </motion.div>

      {/* Atmospheric Overlays */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      <div className="scanline" />
    </main>
  );
}
