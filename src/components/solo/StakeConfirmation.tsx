'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import React from 'react';

interface StakeConfirmationProps {
    level: number;
    stakeAmount: number;
    potentialReward: number;
    onConfirm: () => void;
    onCancel: () => void;
    onStakeChange?: (amount: number) => void;
}

const plate =
    "px-6 py-4 text-xs font-black uppercase tracking-[0.22em] transition-all [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)]";

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
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                className="w-full max-w-lg bg-[#15120e]/95 border-2 border-[#8a6a2f]"
            >
                <div className="h-1.5 bg-[#8a6a2f]" />
                <div className="p-6 md:p-8 grid gap-5">
                    <header>
                        <p className="text-[10px] font-black tracking-[0.35em] text-[#e2b04a] uppercase">
                            {isElite ? 'Elite vault' : `Practice level ${level}`}
                        </p>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-none mt-1 text-[#e8d9b5]">
                            Place your stake
                        </h2>
                    </header>

                    <div className="bg-[#0e0c09] border border-[#5c4a26] p-5">
                        <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-black">Stake</p>
                        <div className="mt-2 flex items-center justify-between gap-3">
                            <div className="flex items-baseline gap-3">
                                {onStakeChange ? (
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
                                        className="w-40 bg-transparent text-6xl font-black italic tracking-tighter text-[#e2b04a] outline-none border-b-2 border-[#8a6a2f] focus:border-[#e2b04a]"
                                    />
                                ) : (
                                    <span className="text-6xl font-black italic tracking-tighter text-[#e2b04a]">{stakeAmount}</span>
                                )}
                                <span className="text-xs font-black uppercase tracking-widest text-white/50">BTQ</span>
                            </div>
                            {onStakeChange && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => onStakeChange(Math.max(10, stakeAmount - 10))}
                                        className={`${plate} !px-4 !py-3 bg-[#2a241b] text-[#e8d9b5] hover:bg-[#3a3225]`}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => onStakeChange(Math.min(maxStake, stakeAmount + 10))}
                                        className={`${plate} !px-4 !py-3 bg-[#2a241b] text-[#e8d9b5] hover:bg-[#3a3225]`}
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-[11px] text-white/45 mt-3">
                            {onStakeChange ? `Min ${minStake} · Max ${maxStake} BTQ` : 'Practice stakes are fixed.'}
                        </p>
                    </div>

                    <div className="flex items-center justify-between bg-[#141a12] border border-[#3fae5a]/40 p-5">
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-black">If you find the treasure</p>
                            <p className="text-4xl font-black italic tracking-tighter text-[#3fae5a] mt-1">~{potentialReward} BTQ</p>
                        </div>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black text-right max-w-[9rem]">
                            Run out of chances and you lose the stake
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={onCancel} className={`${plate} flex-1 bg-[#2a241b] text-[#e8d9b5] hover:bg-[#3a3225]`}>
                            Back
                        </button>
                        <button onClick={onConfirm} className={`${plate} flex-[2] bg-[#c9973a] text-black hover:bg-[#ddb04f] active:translate-y-px`}>
                            Lock stake
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
