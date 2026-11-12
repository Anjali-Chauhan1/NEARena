"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, ChevronRight, ChevronLeft, Target, Shield, Swords, Users, Zap, Coins } from "lucide-react";

interface TourStep {
    targetId?: string;
    title: string;
    content: string;
    icon: React.ReactNode;
    position: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
    {
        title: "Welcome to the Arena",
        content: "You've been deployed to the tactical grid. Your mission: Dominate the sectors and outsmart your opponents.",
        icon: <Target className="w-6 h-6 text-primary" />,
        position: "center"
    },
    {
        targetId: "match-id-info",
        title: "Mission Coordinates",
        content: "This is your unique Match ID. All actions on this grid are synchronized in real-time for every connected player.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        position: "bottom"
    },
    {
        targetId: "stats-info",
        title: "Vital Signs",
        content: "Monitor your Armor (HP) and Trust (Reputation). Trust is crucial for alliances and affects how AI bots perceive you.",
        icon: <Shield className="w-6 h-6 text-secondary" />,
        position: "bottom"
    },
    {
        targetId: "arena-grid",
        title: "The Battle Grid",
        content: "Click any visible tile to move. You have a vision radius of 12 cells. Capture YELLOW zones for passive XP.",
        icon: <Target className="w-6 h-6 text-accent" />,
        position: "right"
    },
    {
        targetId: "btn-strike",
        title: "Strike Protocol",
        content: "Use STRIKE to engage enemies within 3 cells. Successful attacks grant points but risk retaliation.",
        icon: <Swords className="w-6 h-6 text-primary" />,
        position: "top"
    },
    {
        targetId: "btn-defend",
        title: "Shield Up",
        content: "DEFEND to reduce incoming damage for the next few seconds. Timing is everything in the arena.",
        icon: <Shield className="w-6 h-6 text-secondary" />,
        position: "top"
    },
    {
        targetId: "btn-alliance",
        title: "Strategic Pacts",
        content: "Propose an ALLIANCE to nearby players. Allies share vision and resource yields, doubling your efficiency.",
        icon: <Users className="w-6 h-6 text-pink-500" />,
        position: "top"
    },
    {
        targetId: "btn-snatch",
        title: "The Betrayal",
        content: "Feeling greedy? SNATCH tokens to steal rewards from your ally. It boosts points but destroys your Trust score.",
        icon: <Coins className="w-6 h-6 text-yellow-500" />,
        position: "top"
    },
    {
        targetId: "btn-pact",
        title: "Diplomatic Pacts",
        content: "Draft a formal agreement with another operative. Pact members share vision and can perform high-yield split actions.",
        icon: <Users className="w-6 h-6 text-secondary" />,
        position: "top"
    },
    {
        targetId: "btn-split",
        title: "Fair Share",
        content: "Choose to SPLIT rewards with your ally for a steady, low-risk growth strategy. It builds maximum Trust.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        position: "top"
    },
    {
        title: "Begin Mission",
        content: "The fog of war is lifting. Choose your strategy wisely. Good luck, Operative.",
        icon: <Zap className="w-6 h-6 text-primary" />,
        position: "center"
    }
];

interface TutorialTourProps {
    onComplete: () => void;
    steps?: TourStep[];
}

export function TutorialTour({ onComplete, steps: stepsProp }: TutorialTourProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const stepsList = stepsProp ?? TOUR_STEPS;
    const step = stepsList[currentStep];
    const [viewSize, setViewSize] = useState({ w: 0, h: 0 });

    useEffect(() => {
        const update = () => setViewSize({ w: window.innerWidth, h: window.innerHeight });
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    const handleNext = useCallback(() => {
        if (currentStep < stepsList.length - 1) {
            setCurrentStep(s => s + 1);
        } else {
            onComplete();
        }
    }, [currentStep, onComplete, stepsList.length]);

    const handlePrev = useCallback(() => {
        if (currentStep > 0) {
            setCurrentStep(s => s - 1);
        }
    }, [currentStep]);

    useEffect(() => {
        let measureTimer: any;
        if (step.targetId) {
            const el = document.getElementById(step.targetId);
            if (el) {
                // Scroll first, then measure after a short delay to allow layout/scroll to settle
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                measureTimer = setTimeout(() => {
                    const rect = el.getBoundingClientRect();
                    setCoords({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                }, 140);
            } else {
                // If element isn't present, wait a bit then retry once; if still missing, skip step
                measureTimer = setTimeout(() => {
                    const retryEl = document.getElementById(step.targetId!);
                    if (!retryEl) {
                        handleNext();
                    } else {
                        retryEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        const rect = retryEl.getBoundingClientRect();
                        setCoords({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
                    }
                }, 200);
            }
        } else {
            // Full screen overlay with no hole (for welcome/farewell steps)
            setCoords({ top: viewSize.h / 2, left: viewSize.w / 2, width: 0, height: 0 });
        }
        return () => clearTimeout(measureTimer);
    }, [currentStep, step.targetId, viewSize, handleNext]);

    const tooltipRef = useRef<HTMLDivElement>(null);
    const [tooltipHeight, setTooltipHeight] = useState(0);

    useEffect(() => {
        if (tooltipRef.current) {
            setTooltipHeight(tooltipRef.current.offsetHeight);
        }
    }, [currentStep, viewSize]);

    const getTooltipPlacement = () => {
        if (!step.targetId) {
            return {
                style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' } as const,
                placement: 'center' as const,
            };
        }

        const margin = 20;
        const hMargin = 20;
        // Minimum visual separation between tooltip and highlighted target.
        // Larger value pushes the card further away (upwards for bottom overlaps).
        const avoidGap = 72;
        const width = Math.min(320, Math.max(240, viewSize.w - hMargin * 2));
        const vMargin = 60;

        const effectiveTooltipHeight = tooltipHeight || 260;

        const targetX = coords.left + coords.width / 2;
        const targetY = coords.top + coords.height / 2;

        const targetRect = {
            left: coords.left - 12,
            top: coords.top - 12,
            right: coords.left + coords.width + 12,
            bottom: coords.top + coords.height + 12,
        };

        const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

        const clampTop = (top: number) => clamp(top, hMargin, Math.max(hMargin, viewSize.h - vMargin - effectiveTooltipHeight));
        const clampLeft = (left: number) => clamp(left, hMargin, Math.max(hMargin, viewSize.w - hMargin - width));

        const calcOverlapArea = (
            rect: { left: number; top: number; right: number; bottom: number },
            againstRect: { left: number; top: number; right: number; bottom: number } = targetRect
        ) => {
            const overlapW = Math.max(0, Math.min(rect.right, againstRect.right) - Math.max(rect.left, againstRect.left));
            const overlapH = Math.max(0, Math.min(rect.bottom, againstRect.bottom) - Math.max(rect.top, againstRect.top));
            return overlapW * overlapH;
        };

        const compute = (placement: TourStep['position']) => {
            let top = 0;
            let left = targetX - width / 2;

            if (placement === 'top') {
                top = coords.top - effectiveTooltipHeight - margin;
                left = targetX - width / 2;
            } else if (placement === 'bottom') {
                top = coords.top + coords.height + margin;
                left = targetX - width / 2;
            } else if (placement === 'left') {
                top = targetY - effectiveTooltipHeight / 2;
                left = coords.left - width - margin;
            } else if (placement === 'right') {
                top = targetY - effectiveTooltipHeight / 2;
                left = coords.left + coords.width + margin;
            } else {
                top = targetY - effectiveTooltipHeight / 2;
                left = targetX - width / 2;
            }

            // Clamp into viewport
            top = clampTop(top);
            left = clampLeft(left);

            const rect = {
                left,
                top,
                right: left + width,
                bottom: top + effectiveTooltipHeight,
            };

            return { top, left, overlapArea: calcOverlapArea(rect) };
        };

        const pushAwayIfOverlapping = (candidate: { top: number; left: number; overlapArea: number }) => {
            // Also treat "too close" as overlapping by expanding the target vertically.
            // This prevents the tooltip from sitting right on top of the highlighted element.
            const targetAvoidRect = {
                left: targetRect.left,
                right: targetRect.right,
                top: targetRect.top - avoidGap,
                bottom: targetRect.bottom + avoidGap,
            };

            if (candidate.overlapArea === 0) {
                const proximityRect = { left: candidate.left, top: candidate.top, right: candidate.left + width, bottom: candidate.top + effectiveTooltipHeight };
                if (calcOverlapArea(proximityRect, targetAvoidRect) === 0) return candidate;
            }

            let top = candidate.top;
            let left = candidate.left;

            const currentRect = () => ({ left, top, right: left + width, bottom: top + effectiveTooltipHeight });
            const currentOverlap = () => calcOverlapArea(currentRect(), targetAvoidRect);

            // First, nudge vertically to clear the target with a safety gap.
            // This addresses cases where clamping kept the tooltip in view but still overlapping.
            {
                const rect = currentRect();
                const overlapsVertically = rect.bottom > targetRect.top - avoidGap && rect.top < targetRect.bottom + avoidGap;
                if (overlapsVertically) {
                    // If the tooltip is above the target (most common), move it up.
                    if (rect.top <= targetRect.top) {
                        const shiftUp = rect.bottom - (targetRect.top - avoidGap);
                        top = clampTop(top - shiftUp);
                        if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
                    }

                    // If the tooltip is below the target, move it down.
                    if (rect.bottom >= targetRect.bottom) {
                        const shiftDown = (targetRect.bottom + avoidGap) - rect.top;
                        top = clampTop(top + shiftDown);
                        if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
                    }

                    // If still overlapping (e.g. target is tall), push to whichever side has more space.
                    const spaceAbove = (targetRect.top - avoidGap) - hMargin;
                    const spaceBelow = (viewSize.h - vMargin - hMargin) - (targetRect.bottom + avoidGap);
                    if (spaceAbove >= spaceBelow) {
                        top = clampTop(targetRect.top - avoidGap - effectiveTooltipHeight);
                    } else {
                        top = clampTop(targetRect.bottom + avoidGap);
                    }
                    if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
                }
            }

            // Try to move fully above target
            if (targetRect.top - margin - effectiveTooltipHeight >= hMargin) {
                top = clampTop(targetRect.top - margin - effectiveTooltipHeight);
                if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
            }

            // Try to move fully below target
            if (targetRect.bottom + margin + effectiveTooltipHeight <= viewSize.h - vMargin) {
                top = clampTop(targetRect.bottom + margin);
                if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
            }

            // Try to move left of target
            if (targetRect.left - margin - width >= hMargin) {
                left = clampLeft(targetRect.left - margin - width);
                top = clampTop(top);
                if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
            }

            // Try to move right of target
            if (targetRect.right + margin + width <= viewSize.w - hMargin) {
                left = clampLeft(targetRect.right + margin);
                top = clampTop(top);
                if (currentOverlap() === 0) return { top, left, overlapArea: 0 };
            }

            // As a last resort, slide horizontally away from the target's center
            const preferredLeft = targetX < viewSize.w / 2 ? (targetRect.right + margin) : (targetRect.left - margin - width);
            left = clampLeft(preferredLeft);
            top = clampTop(top);

            return { top, left, overlapArea: currentOverlap() };
        };

        const candidates: TourStep['position'][] = ([step.position, 'top', 'bottom', 'right', 'left'] as TourStep['position'][]).filter(
            (p, idx, arr) => p !== 'center' && arr.indexOf(p) === idx
        );

        let best = { placement: step.position, top: hMargin, left: hMargin, overlapArea: Number.POSITIVE_INFINITY };

        for (const placement of candidates) {
            const attempt = pushAwayIfOverlapping(compute(placement));
            if (attempt.overlapArea === 0) {
                return { style: { top: attempt.top, left: attempt.left, width }, placement };
            }
            if (attempt.overlapArea < best.overlapArea) {
                best = { placement, ...attempt };
            }
        }

        // Final fallback: pin tooltip to the far edge away from the target to guarantee visibility.
        // This prevents the tooltip from covering the highlighted element when the screen is too small.
        const pinTop = targetRect.top > viewSize.h / 2;
        const pinnedTop = pinTop
            ? hMargin
            : clampTop(viewSize.h - vMargin - effectiveTooltipHeight - hMargin);
        const pinnedLeft = hMargin;
        const pinnedRect = {
            left: pinnedLeft,
            top: pinnedTop,
            right: pinnedLeft + width,
            bottom: pinnedTop + effectiveTooltipHeight,
        };

        if (calcOverlapArea(pinnedRect) === 0) {
            return { style: { top: pinnedTop, left: pinnedLeft, width }, placement: 'center' as const };
        }

        return { style: { top: best.top, left: best.left, width }, placement: best.placement };
    };

    const tooltipPlacement = getTooltipPlacement();

    return (
        <div className="fixed inset-0 z-[200] pointer-events-auto">
            {/* Backdrop spotlight implemented with 4 panels (reliable across browsers) */}
            <AnimatePresence>
                <motion.div
                    initial={false}
                    animate={{ height: coords.top }}
                    className="absolute top-0 left-0 right-0 bg-black/86 backdrop-blur-[2px] z-10 pointer-events-auto"
                />
                <motion.div
                    initial={false}
                    animate={{ top: coords.top + coords.height, height: Math.max(0, viewSize.h - (coords.top + coords.height)) }}
                    className="absolute bottom-0 left-0 right-0 bg-black/86 backdrop-blur-[2px] z-10 pointer-events-auto"
                />
                <motion.div
                    initial={false}
                    animate={{ top: coords.top, height: coords.height, width: coords.left }}
                    className="absolute left-0 bg-black/86 backdrop-blur-[2px] z-10 pointer-events-auto"
                />
                <motion.div
                    initial={false}
                    animate={{ top: coords.top, left: coords.left + coords.width, height: coords.height, width: Math.max(0, viewSize.w - (coords.left + coords.width)) }}
                    className="absolute right-0 bg-black/86 backdrop-blur-[2px] z-10 pointer-events-auto"
                />
            </AnimatePresence>

            {/* Target Highlight Ring (above backdrop) */}
            {step.targetId && (
                <motion.div
                    initial={false}
                    animate={{ top: coords.top - 10, left: coords.left - 10, width: coords.width + 20, height: coords.height + 20, opacity: 1 }}
                    className="absolute rounded-xl z-30 pointer-events-none"
                    style={{ border: '3px solid rgba(59,130,246,0.95)', boxShadow: '0 0 24px rgba(59,130,246,0.35), inset 0 0 12px rgba(59,130,246,0.12)' }}
                />
            )}

            {/* Interactive Tooltip */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentStep}
                    ref={tooltipRef}
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -15 }}
                    className="absolute pointer-events-auto bg-[#0a0a0a]/95 border border-white/10 glass-panel p-6 w-[320px] shadow-[0_0_80px_rgba(0,0,0,0.8)] z-40 max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide"
                    style={tooltipPlacement.style}
                >
                    {/* Inner Glow */}
                    <div className="absolute -inset-[1px] bg-gradient-to-br from-primary/30 via-transparent to-secondary/30 rounded-2xl -z-10 blur-[1px]" />

                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-primary shadow-inner">
                            {step.icon}
                        </div>
                        <h4 className="text-lg font-black tracking-tighter text-white uppercase italic leading-none">{step.title}</h4>
                    </div>

                    <p className="text-gray-300 text-xs leading-relaxed mb-6 font-medium tracking-wide">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-gray-500 hover:text-white transition-all hover:bg-white/10"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onComplete}
                                className="px-3 py-2 text-[10px] font-black text-gray-400 hover:text-primary uppercase tracking-[0.2em] transition-all italic"
                            >
                                Skip
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-[9px] font-black text-gray-600 tracking-[0.3em] uppercase">
                                {currentStep + 1} / {stepsList.length}
                            </span>
                            <button
                                onClick={handleNext}
                                className="flex items-center gap-2 px-5 py-2 bg-primary text-black font-black uppercase text-[10px] tracking-[0.1em] rounded group hover:scale-105 transition-all shadow-lg italic"
                            >
                                {currentStep === stepsList.length - 1 ? "Begin" : "Next"}
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    {/* Arrow (only if pointing to something) */}
                    {step.targetId && tooltipPlacement.placement !== 'center' && (
                        <div
                            className={`absolute w-3 h-3 bg-black border-white/10 rotate-45 z-[-1] pointer-events-none ${tooltipPlacement.placement === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' :
                                    tooltipPlacement.placement === 'bottom' ? 'top-[-7px] left-1/2 -translate-x-1/2 border-t border-l' :
                                        tooltipPlacement.placement === 'left' ? 'right-[-7px] top-1/2 -translate-y-1/2 border-t border-r' :
                                            'left-[-7px] top-1/2 -translate-y-1/2 border-b border-l'
                                }`}
                        />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
