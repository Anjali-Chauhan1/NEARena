"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/useGameStore';
import { useWriteContract } from '@/lib/near/hooks';
import { btqToYocto } from '@/lib/near/format';
import type { SoloOutcome, SoloTile } from './SoloArena3D';

const SoloArena3D = dynamic(() => import('./SoloArena3D'), { ssr: false });

const plate =
    "px-6 py-3.5 text-xs font-black uppercase tracking-[0.22em] transition-all disabled:opacity-40 disabled:cursor-not-allowed [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)]";
const plateGold = `${plate} bg-[#c9973a] text-black hover:bg-[#ddb04f] active:translate-y-px`;
const plateDark = `${plate} bg-[#2a241b] text-[#e8d9b5] hover:bg-[#3a3225]`;
const plateRed = `${plate} bg-[#a93226] text-white hover:bg-[#c0392b] active:translate-y-px`;

const OUTCOME_TEXT: Record<SoloOutcome, { title: string; sub: string; color: string }> = {
    treasure: { title: 'Treasure', sub: 'You found the real chest', color: 'text-[#e2b04a]' },
    trap: { title: 'Trap', sub: 'Spikes! -2 chances', color: 'text-[#e74c3c]' },
    empty: { title: 'Empty', sub: 'Nothing here. -1 chance', color: 'text-[#a8a29e]' },
};

export const GameScreen = () => {
    const { solo, clickTile, setSoloStatus, startLevel, nextLevel } = useGameStore();
    const router = useRouter();
    const { writeContractAsync } = useWriteContract();

    const [isPending, setIsPending] = useState(false);
    const [penaltyError, setPenaltyError] = useState<string | null>(null);
    const [fx, setFx] = useState<{ key: number; outcome: SoloOutcome | null }>({ key: 0, outcome: null });
    const [shakeKey, setShakeKey] = useState(0);
    const prevRevealedRef = useRef<Set<string>>(solo.revealedTiles);

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
    const multiplier = isElite ? (1.5 + (solo.revealedTiles.size * 0.1)) : (1.5 + (solo.level * 0.2));
    const winAmount = Math.floor(currentStake * multiplier);

    const outcomeAt = (key: string): SoloOutcome => {
        const [x, y] = key.split(',').map(Number);
        if (solo.treasurePos?.x === x && solo.treasurePos?.y === y) return 'treasure';
        if (solo.trapTiles.has(key)) return 'trap';
        return 'empty';
    };

    useEffect(() => {
        const prev = prevRevealedRef.current;
        prevRevealedRef.current = solo.revealedTiles;
        if (solo.revealedTiles.size <= prev.size) return;
        const added = [...solo.revealedTiles].find((k) => !prev.has(k));
        if (!added) return;
        const outcome = outcomeAt(added);
        setFx((f) => ({ key: f.key + 1, outcome }));
        if (outcome === 'trap') setShakeKey((k) => k + 1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [solo.revealedTiles]);

    const tiles = useMemo<SoloTile[]>(() => {
        const n = solo.gridSize;
        return Array.from({ length: n * n }).map((_, i) => {
            const x = i % n;
            const y = Math.floor(i / n);
            const key = `${x},${y}`;
            const isTreasure = solo.treasurePos?.x === x && solo.treasurePos?.y === y;
            return {
                x,
                y,
                hasChest: isTreasure || solo.fakeTreasures.has(key),
                outcome: solo.revealedTiles.has(key) ? outcomeAt(key) : undefined,
            };
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [solo.gridSize, solo.treasurePos, solo.fakeTreasures, solo.trapTiles, solo.revealedTiles]);

    const handleClaimReward = async () => {
        try {
            setIsPending(true);
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

    const playing = solo.gameStatus === 'playing';
    const lowMoves = solo.movesLeft <= 1;

    return (
        <main className="relative h-screen w-full overflow-hidden bg-[#0b0a08] text-white select-none">
            <div className="absolute inset-0">
                <SoloArena3D
                    gridSize={solo.gridSize}
                    tiles={tiles}
                    canAct={playing}
                    onTile={clickTile}
                    shakeKey={shakeKey}
                    idle={false}
                />
            </div>

            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5">
                <div id="arena-grid" className="absolute inset-x-[18%] top-[24%] bottom-[20%]" />

                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div id="match-id-info" className="min-w-[160px] px-4 py-2.5 border-l-4 border-[#8a6a2f] bg-[#15120e]">
                        <p className="text-[9px] font-black tracking-[0.3em] text-white/45 uppercase">{isElite ? 'Elite Arena' : 'Practice'}</p>
                        <p className="text-lg md:text-xl font-black italic uppercase tracking-tight text-[#e8d9b5]">
                            {isElite ? 'Elite Vault' : `Level ${solo.level}`}
                        </p>
                        <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase mt-0.5">
                            Grid {solo.gridSize}x{solo.gridSize}
                        </p>
                    </div>

                    <div id="stats-info" className="order-last md:order-none w-full md:w-auto flex flex-col items-center gap-1.5">
                        <div className="flex items-center gap-3 px-6 py-2 bg-[#15120e] [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)]">
                            <span className={`text-3xl font-black italic tracking-tighter ${lowMoves ? 'text-[#e74c3c]' : 'text-[#e2b04a]'}`}>
                                {solo.movesLeft}
                                <span className="text-lg text-white/40">/{solo.totalMoves}</span>
                            </span>
                            <span className="text-[10px] font-black tracking-[0.25em] text-white/50 uppercase">Chances</span>
                        </div>
                        <p className={`px-4 py-1 text-[11px] font-black uppercase tracking-[0.3em] ${playing ? (lowMoves ? 'bg-[#a93226] text-white' : 'bg-[#3fae5a] text-black') : 'bg-[#2a241b] text-white'}`}>
                            {playing ? (lowMoves ? 'Last chance' : 'Find the treasure') : solo.gameStatus === 'won' ? 'Vault cracked' : 'Out of chances'}
                        </p>
                        <p className="text-[9px] font-black tracking-[0.25em] text-white/40 uppercase">
                            Stake {currentStake} · Win {winAmount} BTQ
                        </p>
                    </div>

                    <div className="min-w-[160px] px-4 py-2.5 border-r-4 border-[#8a6a2f] bg-[#15120e] text-right">
                        <p className="text-[9px] font-black tracking-[0.3em] text-white/45 uppercase">Balance</p>
                        <p className="text-lg md:text-xl font-black italic tracking-tight text-[#e2b04a]">{solo.score} BTQ</p>
                        <p className="text-[10px] font-black tracking-[0.2em] text-white/40 uppercase mt-0.5">Solo vault</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-3">
                    <div className="hidden md:block max-w-md px-4 py-2.5 bg-[#15120e] border-l-4 border-[#8a6a2f]">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#e2b04a]">How to win</p>
                        <p className="text-[11px] text-[#e8d9b5]/70 leading-snug mt-1">
                            One chest holds the treasure, the rest are decoys. Every pick costs a chance. Hidden traps cost two.
                        </p>
                    </div>
                    <div className="pointer-events-auto flex gap-2">
                        <button onClick={() => setSoloStatus('selecting')} className={plateDark}>
                            Abort
                        </button>
                        <button onClick={() => startLevel(solo.level)} className={plateGold}>
                            Restart
                        </button>
                    </div>
                </div>
            </div>

            {fx.outcome && (
                <motion.div
                    key={`flash-${fx.key}`}
                    initial={{ opacity: 0.7 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.9 }}
                    className="absolute inset-0 pointer-events-none z-[120]"
                    style={{
                        background:
                            fx.outcome === 'trap'
                                ? 'radial-gradient(circle, transparent 35%, rgba(169,50,38,0.75))'
                                : fx.outcome === 'treasure'
                                    ? 'radial-gradient(circle, rgba(226,176,74,0.45), transparent 65%)'
                                    : 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.5))',
                    }}
                />
            )}

            {fx.outcome && playing && (
                <motion.div
                    key={`toast-${fx.key}`}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.08, 1, 1.05] }}
                    transition={{ duration: 1.6, times: [0, 0.12, 0.8, 1] }}
                    className="absolute inset-x-0 top-[32%] z-[130] pointer-events-none flex flex-col items-center gap-2 text-center px-4"
                >
                    <p className={`text-5xl md:text-7xl font-black italic uppercase tracking-tighter drop-shadow-[0_4px_12px_rgba(0,0,0,0.9)] ${OUTCOME_TEXT[fx.outcome].color}`}>
                        {OUTCOME_TEXT[fx.outcome].title}
                    </p>
                    <p className="px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] bg-[#15120e] text-[#e8d9b5]">
                        {OUTCOME_TEXT[fx.outcome].sub}
                    </p>
                </motion.div>
            )}

            <AnimatePresence>
                {solo.gameStatus === 'won' && (
                    <motion.div
                        key="won"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.9 }}
                        className="absolute inset-0 z-[260] flex items-center justify-center p-4 bg-black/65"
                    >
                        <motion.section
                            initial={{ opacity: 0, scale: 0.85, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.9 }}
                            className="w-full max-w-xl bg-[#15120e] border-2 border-[#c9973a] p-8 text-center"
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">
                                {isElite ? 'Elite vault secured' : `Level ${solo.level} cleared`}
                            </p>
                            <h2 className="mt-2 text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-[#e2b04a]">Treasure!</h2>
                            <p className="mt-5 text-4xl font-black italic text-[#3fae5a]">+{winAmount} BTQ</p>
                            <p className="mt-1 text-[11px] uppercase tracking-widest text-white/45">
                                Stake {currentStake} · {multiplier.toFixed(1)}x multiplier
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button onClick={() => setSoloStatus('selecting')} className={`${plateDark} flex-1`}>
                                    Back to levels
                                </button>
                                <button onClick={handleClaimReward} disabled={isPending} className={`${plateGold} flex-[2] flex items-center justify-center gap-2`}>
                                    {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : isElite ? 'Claim & play again' : 'Claim & next level'}
                                </button>
                            </div>
                        </motion.section>
                    </motion.div>
                )}

                {solo.gameStatus === 'lost' && (
                    <motion.div
                        key="lost"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ delay: 0.9 }}
                        className="absolute inset-0 z-[260] flex items-center justify-center p-4 bg-black/70"
                    >
                        <motion.section
                            initial={{ opacity: 0, scale: 0.85, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 180, damping: 16, delay: 0.9 }}
                            className="w-full max-w-xl bg-[#15120e] border-2 border-[#a93226] p-8 text-center"
                        >
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Out of chances</p>
                            <h2 className="mt-2 text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-[#c0392b]">Defeated</h2>
                            <p className="mt-5 text-4xl font-black italic text-[#e74c3c]">-{currentStake} BTQ</p>
                            <p className="mt-1 text-[11px] uppercase tracking-widest text-white/45">Pay the stake to try this level again</p>
                            {penaltyError && (
                                <div className="mt-5 border border-[#a93226]/60 bg-[#2a1210] p-4 text-left">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#e74c3c] font-black mb-1">Payment failed</p>
                                    <p className="text-xs text-white/75 break-words">{penaltyError}</p>
                                    <p className="text-[11px] text-white/45 mt-2">Top up BTQ in the lobby, then retry.</p>
                                </div>
                            )}
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button onClick={() => { setPenaltyError(null); router.push('/lobby'); }} className={`${plateDark} flex-1`}>
                                    Go to lobby
                                </button>
                                <button onClick={handlePayPenalty} disabled={isPending} className={`${plateRed} flex-[2] flex items-center justify-center gap-2`}>
                                    {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : penaltyError ? 'Retry payment' : 'Pay stake & retry'}
                                </button>
                            </div>
                        </motion.section>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
};
