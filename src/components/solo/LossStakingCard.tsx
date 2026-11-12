'use client';

import { motion } from 'framer-motion';
import { Activity, AlertTriangle, ChevronRight } from 'lucide-react';
import React from 'react';

interface LossStakingCardProps {
    level: number;
    amountLost: number;
    onRetry: () => void;
    onExit: () => void;
}

export const LossStakingCard: React.FC<LossStakingCardProps> = ({ 
    level, 
    amountLost, 
    onRetry, 
    onExit 
}) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[600] flex items-center justify-center p-4 overflow-hidden"
        >
            {/* Disturbing Backdrop: Red Glitchy Overlay */}
            <div className="absolute inset-0 bg-red-950/20 backdrop-blur-[2px] pointer-events-none" />
            
            {/* Screen static/noise effect */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://media.giphy.com/media/oEI9uWUeez9ZK/giphy.gif')] bg-repeat" />

            {/* Heavy Red Vignetee */}
            <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(220,38,38,0.5)] pointer-events-none" />

            <motion.div
                initial={{ scale: 0.8, y: 100, opacity: 0 }}
                animate={{ 
                    scale: 1, 
                    y: 0, 
                    opacity: 1,
                    x: [0, -1, 1, -1, -0.5], 
                }}
                transition={{ 
                    duration: 0.4,
                    x: { repeat: Infinity, duration: 0.1 }
                }}
                className="relative w-full max-w-lg bg-black border-2 border-red-600 p-10 shadow-[0_0_100px_rgba(220,38,38,0.4)]"
                style={{ clipPath: 'polygon(0 8%, 8% 0, 100% 0, 100% 92%, 92% 100%, 0 100%)' }}
            >
                {/* Visual Disturbance: Scanning Glitch Line */}
                <motion.div 
                    animate={{ top: ['-10%', '110%'] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-4 bg-red-600/20 z-10 pointer-events-none blur-sm"
                />

                {/* Header Container */}
                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-red-900/40">
                    <div className="p-4 bg-red-600/10 border border-red-600/30 rounded-2xl relative">
                        <Activity className="w-8 h-8 text-red-500" />
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full animate-ping" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-red-500 tracking-tighter uppercase leading-none italic glitch" data-text="STAKE_FORFEITED">
                            STAKE_FORFEITED
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 bg-red-600 rounded-full" />
                            <p className="text-[10px] text-red-400 font-bold tracking-[0.4em] uppercase">
                                SECTOR // LVL_{level} // LIQUIDATED
                            </p>
                        </div>
                    </div>
                </div>

                {/* Amount Lost Card */}
                <div className="bg-red-950/20 border border-red-600/30 p-8 relative group overflow-hidden mb-10">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle className="w-24 h-24 text-red-600" />
                    </div>
                    <span className="text-[10px] text-red-500 font-bold uppercase tracking-[0.3em] mb-3 block opacity-70">BTQ_TRANSFERRED_OUT</span>
                    <div className="flex items-baseline gap-4">
                        <motion.span 
                            animate={{ opacity: [1, 0.7, 1] }}
                            transition={{ duration: 0.1, repeat: Infinity }}
                            className="text-7xl font-black text-white tracking-tighter"
                        >
                            -{amountLost}
                        </motion.span>
                        <span className="text-xs font-black text-red-500 tracking-[0.4em] uppercase">BTQ</span>
                    </div>
                </div>

                {/* Terminal Log Output */}
                <div className="mb-10 font-mono space-y-2 bg-red-950/10 p-4 border-l-2 border-red-600">
                    <p className="text-[9px] text-red-500/80">&gt; UNAUTHORIZED DISCONNECT DETECTED...</p>
                    <p className="text-[9px] text-red-500/80">&gt; COLLATERAL ASSETS FORFEITED TO CORE...</p>
                    <p className="text-[9px] text-white/40 italic">&gt; [!] RE-STAKE TO REGAIN SECTOR ACCESS</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onExit}
                        className="px-6 py-4 bg-white/5 border border-white/10 text-white/50 font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-all"
                        style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
                    >
                        FIX_PAYMENT
                    </button>
                    <button
                        onClick={onRetry}
                        className="flex-1 py-5 bg-red-600 text-white font-black uppercase text-sm tracking-[0.3em] hover:bg-red-500 transition-all shadow-[0_0_50px_rgba(220,38,38,0.5)] group relative"
                        style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            INITIALIZE_RE-ENTRY <ChevronRight className="w-5 h-5 group-hover:translate-x-1" />
                        </span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
