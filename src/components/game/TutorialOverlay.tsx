"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { 
  Move, Swords, TrendingUp, Shield, 
  Users, Rocket, ChevronRight, X 
} from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { useAccount } from "@/lib/near/hooks";
import { getWalletUser } from "@/lib/user";

const TUTORIAL_STEPS = [
  {
    icon: <Move className="w-12 h-12 text-primary" />,
    title: "Movement & Navigation",
    description: "Use ARROW KEYS or WASD to navigate the 20x20 tactical grid. Each move updates your position in real-time.",
    tip: "You can only see enemies within a 12-cell radius. Use this to scout safely!"
  },
  {
    icon: <Rocket className="w-12 h-12 text-secondary" />,
    title: "Capture Resource Zones",
    description: "Move onto YELLOW cells to capture them. These zones provide passive points (XP) over time.",
    tip: "Multiple allies in the same zone increase the yield for everyone!"
  },
  {
    icon: <Swords className="w-12 h-12 text-pink-500" />,
    title: "Strike Protocol",
    description: "Identify enemies (Pulsing Crosshairs) and use STRIKE when they are within 3 cells. Combat success boosts your rank but costs life.",
    tip: "Wait for a target to enter your range before engaging."
  },
  {
    icon: <Users className="w-12 h-12 text-secondary" />,
    title: "Pact & Betrayal",
    description: "Propose a PACT to form alliances. You can SPLIT rewards for safe play or SNATCH (Betray) for a huge point boost at the cost of your Trust score.",
    tip: "Your Trust Score is your reputation. Low trust makes AI bots more aggressive."
  },
  {
    icon: <Shield className="w-12 h-12 text-primary" />,
    title: "Operational Summary",
    description: "Survive, build trust, and dominate the leaderboard before the timer hits 0. Good luck, Commander.",
    tip: "The Behavior Engine will nudge you with health if you show exceptional tactical skill."
  }
];

export function TutorialOverlay() {
  const { showTutorial, setTutorial } = useGameStore();
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(0);
  const walletId = isConnected && address ? address.toLowerCase() : getWalletUser().toLowerCase();
  const tutorialKey = `nearena_tutorial_complete:${walletId}`;

  useEffect(() => {
    const completed = localStorage.getItem(tutorialKey);
    setTutorial(!completed);
  }, [setTutorial, tutorialKey]);

  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    localStorage.setItem(tutorialKey, "true");
    setTutorial(false);
  };

  if (!showTutorial) return null;

  const step = TUTORIAL_STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-6"
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleComplete} />
        
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          className="relative max-w-xl w-full glass-panel p-10 neon-border-blue overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 flex">
            {TUTORIAL_STEPS.map((_, idx) => (
                <div 
                    key={idx}
                    className={`h-full transition-all duration-500 ${
                        idx <= currentStep ? 'bg-primary' : 'bg-white/10'
                    }`}
                    style={{ width: `${100 / TUTORIAL_STEPS.length}%` }}
                />
            ))}
          </div>

          <button 
             onClick={handleComplete}
             className="absolute top-4 right-4 text-gray-500 hover:text-white transition-all"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center text-center gap-6">
            <motion.div
               key={currentStep}
               initial={{ rotate: -10, scale: 0.5, opacity: 0 }}
               animate={{ rotate: 0, scale: 1, opacity: 1 }}
               className="p-6 rounded-3xl bg-primary/5 neon-border-blue relative"
            >
                {step.icon}
                <div className="absolute inset-0 bg-primary/20 blur-2xl -z-10" />
            </motion.div>

            <div className="space-y-4">
                <h3 className="text-3xl font-black tracking-tight uppercase">
                    {step.title}
                </h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                    {step.description}
                </p>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-[10px] uppercase font-black tracking-widest text-secondary">Tactical Insight:</p>
                    <p className="text-xs text-gray-500 italic">{step.tip}</p>
                </div>
            </div>

            <button 
               onClick={handleNext}
               className="w-full mt-4 group relative flex items-center justify-center py-4 bg-primary text-black font-black uppercase tracking-[0.2em] transition-all hover:bg-white overflow-hidden"
            >
                <span className="relative z-10 flex items-center gap-2">
                    {currentStep === TUTORIAL_STEPS.length - 1 ? "BEGIN MISSION" : "NEXT MODULE"}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
            </button>

            <span className="text-[10px] uppercase font-black text-gray-600 tracking-widest">
                STEP {currentStep + 1} OF {TUTORIAL_STEPS.length}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
