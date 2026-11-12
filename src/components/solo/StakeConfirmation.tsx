'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Target, Shield, Lock, Zap, Trophy, ChevronRight, Plus, Minus } from 'lucide-react';
import React from 'react';

interface StakeConfirmationProps {
    level: number;
    stakeAmount: number;
    potentialReward: number;
    onConfirm: () => void;
    onCancel: () => void;
    onStakeChange?: (amount: number) => void;
}

export const StakeConfirmation: React.FC<StakeConfirmationProps> = ({ 
    level, 
    stakeAmount, 
    potentialReward, 
    onConfirm, 
    onCancel,
    onStakeChange
}) => {
    const isElite = level > 3;
    const maxStake = 1000;
    const minStake = 1;

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4"
        >
            {/* Animated Grid Background */}
            <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,242,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />
                <motion.div 
                    animate={{ 
                        opacity: [0.1, 0.3, 0.1],
                        scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-radial-gradient from-primary/20 via-transparent to-transparent"
                />
            </div>

            <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                className="relative w-full max-w-lg bg-[#0a0a0c] border-2 border-primary/40 p-10 shadow-[0_0_80px_rgba(0,242,255,0.2)]"
                style={{ clipPath: 'polygon(0 0, 92% 0, 100% 8%, 100% 100%, 8% 100%, 0 92%)' }}
            >
                {/* Scanner Line */}
                <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] bg-primary/40 z-10 pointer-events-none shadow-[0_0_15px_rgba(0,242,255,0.8)]"
                />

                {/* Header Container */}
                <div className="flex items-center gap-6 mb-10 pb-6 border-b border-white/10">
                    <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl relative">
                        <Lock className="w-8 h-8 text-primary" />
                        <motion.div 
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full"
                        />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none italic">
                            {isElite ? 'ELITE_ARENA_SYNC' : 'MISSION_SYNC_REQUIRED'}
                        </h2>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                            <p className="text-[10px] text-primary font-bold tracking-[0.4em] uppercase opacity-70">
                                SECTOR // {isElite ? 'FIXED_7x7' : `LVL_${level}`} // ASSET_LOCK
                            </p>
                        </div>
                    </div>
                </div>

                {/* Data Cards */}
                <div className="grid grid-cols-1 gap-4 mb-10">
                    <div className="bg-white/5 border border-white/10 p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Shield className="w-16 h-16 text-white" />
                        </div>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2 block">REQUIRED_STAKE</span>
                        <div className="flex items-center justify-between">
                                        <div className="flex items-baseline gap-3">
                                        {onStakeChange ? (
                                    <div className="flex items-baseline gap-2 group/input">
                                        <input 
                                            type="text" 
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            value={stakeAmount === 0 ? '' : stakeAmount}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                const next = val === '' ? 0 : parseInt(val);
                                                onStakeChange(Math.min(maxStake, Math.max(0, next)));
                                            }}
                                            onBlur={() => {
                                                const next = Math.min(maxStake, Math.max(minStake, stakeAmount));
                                                if (next !== stakeAmount) onStakeChange(next);
                                            }}
                                            className="bg-transparent text-5xl font-black text-white tracking-tighter w-40 focus:outline-none border-b-2 border-primary/50 transition-all hover:border-white/10"
                                        />
                                        <span className="text-xs font-black text-primary tracking-widest uppercase animate-pulse">EDIT_VAL</span>
                                    </div>
                                        ) : (
                                    <div className="flex items-baseline gap-3">
                                        <span className="text-5xl font-black text-white tracking-tighter">{stakeAmount}</span>
                                        <span className="text-xs font-black text-primary tracking-widest uppercase">BTQ</span>
                                    </div>
                                )}
                            </div>
                            
                            {onStakeChange && (
                                <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-lg">
                                    <button 
                                        onClick={() => onStakeChange(Math.max(10, stakeAmount - 10))}
                                        className="p-3 hover:bg-white/10 transition-colors text-primary rounded-md active:scale-90"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                    <div className="w-[1px] h-6 bg-white/10" />
                                    <button 
                                        onClick={() => onStakeChange(Math.min(maxStake, stakeAmount + 10))}
                                        className="p-3 hover:bg-white/10 transition-colors text-primary rounded-md active:scale-90"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-6 relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-10">
                            <Trophy className="w-16 h-16 text-primary" />
                        </div>
                        <span className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.2em] mb-2 block">POTENTIAL_YIELD</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-primary tracking-tighter">~{potentialReward}</span>
                            <span className="text-xs font-black text-primary tracking-widest uppercase">BTQ</span>
                        </div>
                    </div>
                </div>

                {/* Status Log */}
                <div className="mb-10 font-mono space-y-1">
                    <p className="text-[9px] text-white/30 uppercase tracking-widest">&gt; INITIALIZING SECURE PROTOCOL...</p>
                    <p className="text-[9px] text-primary uppercase tracking-widest animate-pulse">&gt; READY TO LOCK ASSETS FOR {isElite ? 'ELITE ARENA' : `LEVEL ${level}`}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-4 bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-[0.2em] hover:bg-white/10 transition-all"
                        style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
                    >
                        ABORT
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-5 bg-primary text-black font-black uppercase text-sm tracking-[0.3em] hover:bg-white transition-all shadow-[0_0_40px_rgba(0,242,255,0.4)] group relative overflow-hidden"
                        style={{ clipPath: 'polygon(8% 0, 100% 0, 92% 100%, 0 100%)' }}
                    >
                        <span className="relative z-10 flex items-center justify-center gap-3">
                            LOCK_YOUR_STAKE <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
};
