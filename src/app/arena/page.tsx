"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useGameStore } from "@/store/useGameStore";
import { AuthGuard } from "@/components/shared/AuthGuard";
import { TutorialTour } from "@/components/game/TutorialTour";
import { MultiplayerGameScreen } from "@/components/game/MultiplayerGameScreen";
import { useAccount } from "@/lib/near/hooks";
import { getWalletUser } from "@/lib/user";

// Solo System Imports
import { LevelSelectionScreen } from "@/components/solo/LevelSelectionScreen";
import { GameRulesOverlay } from "@/components/solo/GameRulesOverlay";
import { GameScreen } from "@/components/solo/GameScreen";
import { StakeConfirmation } from "@/components/solo/StakeConfirmation";
import { useSyncBtqBalance } from "@/hooks/useSyncBtqBalance";

export default function Arena() {
    const [mode, setMode] = useState("solo");
    const { solo, setSoloStatus, startLevel, setStake } = useGameStore();
    const [showTour, setShowTour] = useState(false);
    const { address, isConnected } = useAccount();
    const walletId = isConnected && address ? address.toLowerCase() : getWalletUser().toLowerCase();
    const tourKey = `nearena_tour_v2:${walletId}`;

    // Sync on-chain BTQ balance → game store score
    useSyncBtqBalance();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setMode(params.get("mode") || "solo");
    }, []);

    useEffect(() => {
        const hasSeenTour = localStorage.getItem(tourKey);
        setShowTour(!hasSeenTour);
    }, [tourKey]);

    if (mode === "duel") {
        return (
            <AuthGuard>
                <MultiplayerGameScreen />
            </AuthGuard>
        );
    }

    const completeTour = () => {
        setShowTour(false);
        localStorage.setItem(tourKey, 'true');
    };

    // If we are in selecting OR staking mode, use the full-screen layout
    if (solo.gameStatus === 'selecting' || solo.gameStatus === 'staking') {
        const isElite = solo.level > 3;
        const practiceStakes = [5, 10, 15];
        const currentStake = isElite ? solo.stake : (practiceStakes[solo.level - 1] || solo.level * 5);
        
        // Multiplier calculation mirrored from useGameStore.ts
        // In Elite Arena, we show the base multiplier (1.5x) or a dynamic range
        const multiplier = isElite ? 1.5 : (1.5 + (solo.level * 0.2));
        const potentialReward = Math.floor(currentStake * multiplier);

        return (
            <AuthGuard>
                <main className="min-h-screen bg-[#020203] font-mono text-white cyber-grid relative overflow-y-auto">
                    <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
                    
                    <AnimatePresence mode="wait">
                        {solo.gameStatus === 'selecting' && (
                            <motion.div 
                                key="selecting"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3 }}
                            >
                                <LevelSelectionScreen />
                            </motion.div>
                        )}
                        
                        {solo.gameStatus === 'staking' && (
                            <motion.div 
                                key="staking"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3 }}
                            >
                                <StakeConfirmation 
                                    level={solo.level}
                                    stakeAmount={currentStake}
                                    potentialReward={potentialReward}
                                    onConfirm={() => setSoloStatus('rules')}
                                    onCancel={() => setSoloStatus('selecting')}
                                    onStakeChange={isElite ? setStake : undefined}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </AuthGuard>
        );
    }

    // Default Gameplay Layout
    return (
      <AuthGuard>
        <div className="relative h-screen bg-black overflow-hidden font-mono text-white">
            <AnimatePresence>
                {/* Main Game Screen */}
                {(solo.gameStatus === 'playing' || solo.gameStatus === 'won' || solo.gameStatus === 'lost') && (
                    <motion.div 
                        key="game"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <GameScreen />
                    </motion.div>
                )}

                {/* rules overlay */}
                {solo.gameStatus === 'rules' && <GameRulesOverlay key="rules" />}
                
                {showTour && <TutorialTour onComplete={completeTour} key="tour" />}
            </AnimatePresence>
        </div>
      </AuthGuard>
    )
}
