"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Target, X, Zap, Activity, Radio, Cpu, Swords, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { Tile } from './Tile';
import { StatItem } from '@/components/ui/StatItem';
import { LossStakingCard } from './LossStakingCard';
import { useWriteContract } from '@/lib/near/hooks';
import { btqToYocto } from '@/lib/near/format';

export const GameScreen = () => {
    const { solo, clickTile, setSoloStatus, startLevel, nextLevel } = useGameStore();
    const router = useRouter();
    const { writeContractAsync } = useWriteContract();

    const [isPending, setIsPending] = useState(false);
    const [penaltyError, setPenaltyError] = useState<string | null>(null);

    const tryStart = (lvl: number) => {
        const practiceStakes = [5, 10, 15];
        const required = lvl > 3 ? solo.stake : (practiceStakes[lvl - 1] || lvl * 5);
        if ((solo.score || 0) < required) {
            alert(`Insufficient BTQ. You need ${required} BTQ to start this mission. Please buy BTQ.`);
            return;
        }
        startLevel(lvl);
    };
    
    const isElite = solo.level > 3;
    const practiceStakes = [5, 10, 15];
    const currentStake = isElite ? solo.stake : (practiceStakes[solo.level - 1] || solo.level * 5);

    const handleClaimReward = async () => {
        try {
            setIsPending(true);
            const multiplier = isElite ? (1.5 + (solo.revealedTiles.size * 0.1)) : (1.5 + (solo.level * 0.2));
            const winAmount = Math.floor(currentStake * multiplier);

            await writeContractAsync({
                functionName: 'record_game_win',
                args: { reward_amount: btqToYocto(winAmount) },
            });
            nextLevel();
        } catch (error) {
            console.error(error);
            const msg = (error as any)?.shortMessage || (error as any)?.message || String(error);
            alert(`Failed to claim reward. ${msg}`);
        } finally {
            setIsPending(false);
        }
    };

    const handlePayPenalty = async () => {
        try {
            setPenaltyError(null);
            setIsPending(true);
            await writeContractAsync({
                functionName: 'burn',
                args: { amount: btqToYocto(currentStake) },
            });
            tryStart(solo.level);
        } catch (error) {
            console.error(error);
            const msg = (error as any)?.message || String(error);
            setPenaltyError(msg);
        } finally {
            setIsPending(false);
        }
    };

    const handleFixPenaltyIssue = () => {
        setPenaltyError(null);
        router.push('/lobby');
    };

    // Win Overlay Component
    const WinOverlay = () => {
        const multiplier = isElite ? (1.5 + (solo.revealedTiles.size * 0.1)) : (1.5 + (solo.level * 0.2));
        const winAmount = Math.floor(currentStake * multiplier);

        return (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[500] bg-primary/20 backdrop-blur-3xl flex items-center justify-center p-4"
            >
                <motion.div 
                    initial={{ scale: 0.8, y: 50, opacity: 0 }} 
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    className="bg-background border-4 border-primary p-12 text-center shadow-[0_0_120px_rgba(0,242,255,0.6)] relative overflow-hidden"
                    style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
                >
                    <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(0,242,255,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(0,242,255,0.5)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    
                    <h2 className="text-7xl font-black text-primary mb-2 tracking-tighter leading-none neon-text">SYSTEM_BREACHED</h2>
                    <div className="h-2 w-full bg-primary/20 mb-6" />
                    <p className="text-xl text-white mb-2 tracking-[0.3em] font-black uppercase">{isElite ? 'ELITE_ARENA_SECURED' : `TREASURE_SECURED // LVL_${solo.level}_CLEAR`}</p>
                    <div className="flex flex-col mb-10">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-[0.4em]">STAKE: {currentStake} BTQ</span>
                        <p className="text-4xl text-primary font-black tracking-widest">+ {winAmount} BTQ ON-CHAIN</p>
                        {isElite && (
                            <span className="text-[11px] text-primary/60 font-black uppercase mt-2">
                                REWARD SCALED BY {Math.max(1, solo.revealedTiles.size)}X TILE MULTIPLIER
                            </span>
                        )}
                    </div>
                    
                    <div className="flex gap-6 justify-center relative z-10">
                        <button
                            onClick={() => setSoloStatus('selecting')}
                            className="px-8 py-3 bg-white/5 border-2 border-white/20 text-white font-black uppercase text-xs tracking-widest transition-all hover:bg-white/10"
                        >
                            RETURN_TO_HUB
                        </button>
                        <button
                            onClick={handleClaimReward}
                            disabled={isPending}
                            className="px-12 py-4 bg-primary text-black font-black uppercase text-sm tracking-[0.4em] hover:bg-white transition-all shadow-xl flex items-center gap-2 disabled:opacity-50"
                            style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
                        >
                            {isPending ? <Loader2 className="animate-spin w-5 h-5"/> : (isElite ? 'CLAIM & RE-SCAN' : 'CLAIM & NEXT_PHASE ->')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        );
    };

    // Loss Overlay Component
    const LossOverlay = () => (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-red-950/40 backdrop-blur-3xl flex items-center justify-center p-4 text-white"
        >
            <motion.div 
                initial={{ scale: 0.8, x: -50, opacity: 0 }} 
                animate={{ scale: 1, x: 0, opacity: 1 }}
                className="bg-black border-4 border-red-600 p-12 text-center shadow-[0_0_100px_rgba(255,0,0,0.5)] relative"
                style={{ clipPath: 'polygon(0 0, 90% 0, 100% 10%, 100% 100%, 10% 100%, 0 90%)' }}
            >
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    <Activity className="w-12 h-12 text-red-600 animate-pulse" />
                </div>
                
                <h2 className="text-6xl font-black text-red-600 mb-4 tracking-tighter uppercase glitch">MISSION_FAILED</h2>
                <p className="text-xl text-white/50 mb-10 tracking-widest font-black italic">OUT_OF_ENERGY // SCAN_ABORTED</p>
                <p className="text-red-400 font-bold mb-4">PENALTY: -{currentStake} BTQ</p>
                {penaltyError && (
                    <div className="mb-6 border border-red-600/40 bg-red-950/30 p-4 text-left">
                        <p className="text-[10px] uppercase tracking-[0.35em] text-red-300 font-black mb-2">PAYMENT_ERROR</p>
                        <p className="text-xs text-red-100/80 leading-relaxed">{penaltyError}</p>
                        <p className="text-[11px] text-white/50 mt-2">Open the lobby to switch network, add BTQ, or refresh your wallet balance, then retry the payment.</p>
                    </div>
                )}
                
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={handleFixPenaltyIssue}
                        className="px-8 py-3 bg-white/5 border border-white/10 text-white/70 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                    >
                        FIX_IN_LOBBY
                    </button>
                    <button
                        onClick={handlePayPenalty}
                        disabled={isPending}
                        className="px-10 py-4 bg-red-600 text-white font-black uppercase text-sm tracking-[0.3em] hover:bg-red-500 transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
                        style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}
                    >
                        {isPending ? <Loader2 className="animate-spin w-5 h-5"/> : (penaltyError ? 'RETRY PAYMENT' : 'PAY PENALTY & REBOOT')}
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );

    return (
        <div className="h-screen flex flex-col overflow-hidden relative font-mono text-white cyber-grid">
            <AnimatePresence>
                {solo.gameStatus === 'won' && <WinOverlay />}
                {solo.gameStatus === 'lost' && <LossOverlay />}
            </AnimatePresence>

            {/* Tactical HUD Header */}
            <header className="h-20 z-50 w-full bg-background/90 backdrop-blur-md border-b-2 border-primary/20 sticky top-0">
                <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                    
                    <div className="flex items-center gap-12">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                                <Radio className="w-3 h-3 text-primary animate-pulse" />
                                <span className="text-[9px] text-primary font-black tracking-[0.3em] uppercase">Sector_Sync</span>
                            </div>
                            <span className="text-xl font-black tracking-tighter text-white uppercase neon-text">
                                {isElite ? 'ELITE_ARENA' : `UNIT_LVL_${solo.level}`}
                            </span>
                        </div>
                        
                        <div className="h-10 w-[1px] bg-primary/20" />

                        <div className="hidden md:flex flex-col text-left">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-3 h-3 text-secondary animate-pulse" />
                                <span className="text-[9px] text-secondary font-black tracking-[0.3em] uppercase">Energy_Reserve</span>
                            </div>
                            <span className={`text-xl font-black tracking-tighter uppercase ${solo.movesLeft <= 1 ? 'text-warning' : 'text-secondary neon-text-secondary'}`}>
                                {solo.movesLeft} / {solo.totalMoves} CHANCES
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-8">
                            <div className="hidden sm:flex items-center gap-6 bg-white/5 px-6 py-2 border-x border-white/10" style={{ clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0 100%)' }}>
                            <StatItem icon={<Target className="w-5 h-5 text-primary"/>} value={`${solo.gridSize}x${solo.gridSize}`} label="GRID" />
                            <div className="w-[1px] h-6 bg-white/10" />
                            <StatItem icon={<Zap className="w-5 h-5 text-accent"/>} value={`${solo.score}`} label="BTQ" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Arena Grid Container */}
            <div className="flex-1 relative flex items-center justify-center p-6 bg-background">
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-accent/10 to-transparent pointer-events-none" />

                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`grid gap-2 bg-background p-4 border-2 border-primary/30 shadow-[0_0_50px_rgba(0,242,255,0.1)] relative z-30 ${solo.gridSize >= 6 ? 'p-2' : 'p-4'}`}
                    style={{ 
                        gridTemplateColumns: `repeat(${solo.gridSize}, minmax(0, 1fr))`,
                        width: 'min(75vh, 90vw)',
                        height: 'min(75vh, 90vw)'
                    }}
                >
                    {Array.from({ length: solo.gridSize * solo.gridSize }).map((_, i) => {
                        const x = i % solo.gridSize;
                        const y = Math.floor(i / solo.gridSize);
                        const tileKey = `${x},${y}`;
                        const isRevealed = solo.revealedTiles.has(tileKey);
                        const isTreasure = solo.treasurePos?.x === x && solo.treasurePos?.y === y;
                        const isFake = solo.fakeTreasures.has(tileKey);
                        const isTrap = solo.trapTiles.has(tileKey);

                        return (
                            <Tile
                                key={tileKey}
                                x={x}
                                y={y}
                                isRevealed={isRevealed}
                                isTreasure={isTreasure}
                                isFake={isFake}
                                isTrap={isTrap}
                                onClick={() => clickTile(x, y)}
                            />
                        );
                    })}
                </motion.div>
            </div>

            {/* Tactical Interaction Panel */}
            <div className="h-32 bg-background border-t-2 border-primary/20 z-50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
                <div className="max-w-7xl mx-auto h-full px-8 flex items-center justify-between relative">
                    <div className="flex items-center justify-between w-full gap-12">
                        <div className="flex flex-col justify-center gap-1 max-w-2xl border-l-2 border-primary/30 pl-6">
                            <span className="text-[10px] text-primary font-black uppercase tracking-[0.4em]">TREASURE_HUNT_OS</span>
                            <p className="text-[11px] text-gray-400 font-mono leading-tight uppercase">
                                &gt; Scan tiles to locate hidden treasure. Each click consumes 1 Charge. <br/>
                                &gt; Mission fails if Charge reaches 0. Trust your instincts.
                            </p>
                        </div>
                        <div className="flex gap-4 items-center">
                            <button
                                onClick={() => setSoloStatus('selecting')}
                                className="relative px-8 py-3 bg-background border border-white/20 text-white font-black uppercase text-[11px] tracking-widest transition-all hover:border-white hover:bg-white/5 active:scale-95"
                                style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
                            >
                                ABORT_SCAN
                            </button>
                            <button
                                onClick={() => startLevel(solo.level)}
                                className="relative px-8 py-3 bg-primary text-black font-black uppercase text-[11px] tracking-widest transition-all hover:bg-white active:scale-95"
                                style={{ clipPath: 'polygon(15% 0, 100% 0, 85% 100%, 0 100%)' }}
                            >
                                REBOOT_LEVEL
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
