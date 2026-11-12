"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, ChevronLeft, Target, Coins, Gem, Box, Heart } from "lucide-react";

interface TourStep {
    targetId?: string;
    title: string;
    content: string;
    icon: React.ReactNode;
    position: "top" | "bottom" | "left" | "right" | "center";
}

const TOUR_STEPS: TourStep[] = [
    {
        title: "Welcome to the Vault",
        content: "One chest on this table holds the real treasure. The rest are decoys, and some spots hide traps. Find the treasure before your chances run out.",
        icon: <Gem className="w-6 h-6" />,
        position: "center"
    },
    {
        targetId: "match-id-info",
        title: "Your Vault",
        content: "Your current level and grid size. Practice levels are smaller; the Elite vault is a 6x6 grid where you set your own stake.",
        icon: <Box className="w-6 h-6" />,
        position: "bottom"
    },
    {
        targetId: "stats-info",
        title: "Chances",
        content: "Every pick costs one chance. A trap costs two. Your stake and the BTQ you can win are shown just below.",
        icon: <Heart className="w-6 h-6" />,
        position: "bottom"
    },
    {
        targetId: "arena-grid",
        title: "The Board",
        content: "Click any chest or tile to open it. The real treasure is always inside a chest, but not every chest holds it.",
        icon: <Target className="w-6 h-6" />,
        position: "right"
    },
    {
        title: "Good Luck",
        content: "Find the treasure to claim your BTQ on-chain. Run out of chances and the stake is lost.",
        icon: <Coins className="w-6 h-6" />,
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
                    key="backdrop-top"
                    initial={false}
                    animate={{ height: coords.top }}
                    className="absolute top-0 left-0 right-0 bg-[#06070a]/85 z-10 pointer-events-auto"
                />
                <motion.div
                    key="backdrop-bottom"
                    initial={false}
                    animate={{ top: coords.top + coords.height, height: Math.max(0, viewSize.h - (coords.top + coords.height)) }}
                    className="absolute bottom-0 left-0 right-0 bg-[#06070a]/85 z-10 pointer-events-auto"
                />
                <motion.div
                    key="backdrop-left"
                    initial={false}
                    animate={{ top: coords.top, height: coords.height, width: coords.left }}
                    className="absolute left-0 bg-[#06070a]/85 z-10 pointer-events-auto"
                />
                <motion.div
                    key="backdrop-right"
                    initial={false}
                    animate={{ top: coords.top, left: coords.left + coords.width, height: coords.height, width: Math.max(0, viewSize.w - (coords.left + coords.width)) }}
                    className="absolute right-0 bg-[#06070a]/85 z-10 pointer-events-auto"
                />
            </AnimatePresence>

            {/* Target Highlight Ring (above backdrop) */}
            {step.targetId && (
                <motion.div
                    initial={false}
                    animate={{ top: coords.top - 10, left: coords.left - 10, width: coords.width + 20, height: coords.height + 20, opacity: 1 }}
                    className="absolute z-30 pointer-events-none"
                    style={{ border: '2px solid #e2b04a', boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 0 28px rgba(226,176,74,0.25)' }}
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
                    className="absolute pointer-events-auto bg-[linear-gradient(160deg,#2a1d10_0%,#14100b_55%,#0c0a08_100%)] border border-[#8a6a2f] p-6 w-[320px] shadow-[0_20px_60px_rgba(0,0,0,0.7)] z-40 max-h-[85vh] overflow-y-auto overflow-x-hidden scrollbar-hide text-[#efe6d2]"
                    style={tooltipPlacement.style}
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-11 h-11 shrink-0 flex items-center justify-center text-[#f3d28a] bg-[linear-gradient(160deg,#5a3d17_0%,#2a1b0c_55%,#140d06_100%)] border border-[#8a6a2f]">
                            {step.icon}
                        </div>
                        <h4 className="font-[family-name:var(--font-cinzel)] text-lg font-bold text-[#f6efe1] leading-tight">{step.title}</h4>
                    </div>

                    <p className="text-[#efe6d2]/70 text-sm leading-relaxed mb-6">
                        {step.content}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[#efe6d2]/10">
                        <div className="flex items-center gap-3">
                            {currentStep > 0 && (
                                <button
                                    onClick={handlePrev}
                                    className="p-2 border border-[#efe6d2]/20 text-[#efe6d2]/60 hover:border-[#e2b04a] hover:text-[#e2b04a] transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={onComplete}
                                className="px-2 py-2 text-[10px] font-semibold text-[#efe6d2]/45 hover:text-[#e2b04a] uppercase tracking-[0.25em] transition-colors"
                            >
                                Skip
                            </button>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-semibold text-[#efe6d2]/40 tracking-[0.25em] uppercase">
                                {currentStep + 1} / {stepsList.length}
                            </span>
                            <button
                                onClick={handleNext}
                                className="group flex items-center gap-2 px-5 py-2 bg-[#c9973a] text-[#120c08] font-bold uppercase text-[10px] tracking-[0.2em] hover:bg-[#e2b04a] transition-colors"
                            >
                                {currentStep === stepsList.length - 1 ? "Begin" : "Next"}
                                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    {/* Arrow (only if pointing to something) */}
                    {step.targetId && tooltipPlacement.placement !== 'center' && (
                        <div
                            className={`absolute w-3 h-3 bg-[#1a130b] border-[#8a6a2f] rotate-45 z-[-1] pointer-events-none ${tooltipPlacement.placement === 'top' ? 'bottom-[-7px] left-1/2 -translate-x-1/2 border-b border-r' :
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
