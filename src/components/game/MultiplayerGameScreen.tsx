"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, Crosshair, ShieldPlus, SkipForward, Users, Bomb, Search } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { TutorialTour } from "@/components/game/TutorialTour";
import { applyDuelSettlement, getWalletUser, hasDuelPayoutClaimed, hasDuelStakePaid, markDuelPayoutClaimed, markDuelStakePaid } from "@/lib/user";
import { useGameStore } from "@/store/useGameStore";
import { useWriteContract } from "@/lib/near/hooks";
import { btqToYocto } from "@/lib/near/format";

type ChestItem = "gun" | "health" | "skip" | "double_kill" | "magnifier" | "empty";

interface DuelTile {
  x: number;
  y: number;
  revealed: boolean;
  item?: ChestItem;
}

interface DuelPlayer {
  id: string;
  name: string;
}

interface DuelState {
  roomId: string;
  status: "waiting" | "playing" | "ended";
  gridSize: number;
  tiles: DuelTile[];
  turnPlayerId: string | null;
  lives: Record<string, number>;
  maxLives: number;
  peekCharges: Record<string, number>;
  winnerId: string | null;
  betAmount: number;
  totalPot: number;
  players: DuelPlayer[];
}

const itemToIcon: Record<ChestItem, React.ReactNode> = {
  gun: <Crosshair className="w-6 h-6 text-red-400" />,
  health: <ShieldPlus className="w-6 h-6 text-emerald-400" />,
  skip: <SkipForward className="w-6 h-6 text-amber-300" />,
  double_kill: <Bomb className="w-6 h-6 text-fuchsia-400" />,
  magnifier: <Search className="w-6 h-6 text-cyan-300" />,
  empty: <span className="text-xs text-white/30">EMPTY</span>,
};

const itemToLabel: Record<ChestItem, string> = {
  gun: "Gun: -1 life to opponent",
  health: "Health: +1 life (max 5)",
  skip: "Skip: opponent loses next turn",
  double_kill: "Double Kill: -2 lives to opponent",
  magnifier: "Magnifier: inspect one tile without opening",
  empty: "Empty chest",
};

export function MultiplayerGameScreen() {
  const router = useRouter();
  const { socket, isConnected } = useSocket();
  const { writeContractAsync } = useWriteContract();
  const [duelState, setDuelState] = useState<DuelState | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [statusText, setStatusText] = useState("Connecting...");
  const [isPeekMode, setIsPeekMode] = useState(false);
  const [peekedTiles, setPeekedTiles] = useState<Record<string, ChestItem>>({});
  const [showTour, setShowTour] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [phase, setPhase] = useState<"menu" | "stake" | "waiting" | "in_game">("menu");
  const [waitingCount, setWaitingCount] = useState(0);
  const [didCopyCode, setDidCopyCode] = useState(false);
  const applyBtqDelta = useGameStore((state) => state.applyBtqDelta);
  const settlementAppliedRef = useRef<string | null>(null);
  const [stakeError, setStakeError] = useState<string | null>(null);
  const [payoutError, setPayoutError] = useState<string | null>(null);
  const [isStakePending, setIsStakePending] = useState(false);
  const [isPayoutPending, setIsPayoutPending] = useState(false);

  const STAKE_MIN = 50;
  const STAKE_MAX = 200;
  const STAKE_STEP = 10;

  type PendingJoinIntent =
    | { type: "random" }
    | { type: "create" }
    | { type: "code"; code: string };

  const [pendingJoinIntent, setPendingJoinIntent] = useState<PendingJoinIntent | null>(null);
  const [stakeAmount, setStakeAmount] = useState<number>(STAKE_MIN);
  const [selectedStake, setSelectedStake] = useState<number>(STAKE_MIN);
  const [awaitingStakeConfirm, setAwaitingStakeConfirm] = useState(false);
  const [stakeLocked, setStakeLocked] = useState(false);
  const pendingJoinIntentRef = useRef<PendingJoinIntent | null>(null);

  const clampStake = (value: number) => Math.min(STAKE_MAX, Math.max(STAKE_MIN, value));

  const lockDuelStake = async (roomKey: string, amount: number) => {
    if (hasDuelStakePaid(roomKey)) return true;

    try {
      setStakeError(null);
      setIsStakePending(true);
      await writeContractAsync({
        functionName: "burn",
        args: { amount: btqToYocto(amount) },
      });
      markDuelStakePaid(roomKey);
      return true;
    } catch (error) {
      const msg = (error as any)?.message || String(error);
      setStakeError(msg);
      return false;
    } finally {
      setIsStakePending(false);
    }
  };

  const claimDuelPayout = async (roomKey: string, totalPot: number) => {
    if (hasDuelPayoutClaimed(roomKey)) return true;

    try {
      setPayoutError(null);
      setIsPayoutPending(true);
      await writeContractAsync({
        functionName: "record_game_win",
        args: { reward_amount: btqToYocto(totalPot) },
      });
      markDuelPayoutClaimed(roomKey);
      return true;
    } catch (error) {
      const msg = (error as any)?.message || String(error);
      setPayoutError(msg);
      return false;
    } finally {
      setIsPayoutPending(false);
    }
  };

  useEffect(() => {
    pendingJoinIntentRef.current = pendingJoinIntent;
  }, [pendingJoinIntent]);

  const myId = socket?.id;
  const me = duelState?.players.find((p) => p.id === myId);
  const opponent = duelState?.players.find((p) => p.id !== myId);
  const isMyTurn = Boolean(duelState && myId && duelState.turnPlayerId === myId);
  const winner = duelState?.players.find((p) => p.id === duelState?.winnerId);
  const myPeekCharges = myId ? (duelState?.peekCharges?.[myId] ?? 0) : 0;
  const isMeWinner = Boolean(myId && duelState?.winnerId && myId === duelState.winnerId);

  useEffect(() => {
    if (!socket || !isConnected) return;

    setStatusText("Choose how to play");

    const onPlayerJoined = (payload: { roomId: string; roomCode?: string; players?: Record<string, unknown> }) => {
      setRoomId(payload.roomId);
      setRoomCode(payload.roomCode ?? null);
      const count = payload.players ? Object.keys(payload.players).length : 0;
      setWaitingCount(count);
      setPhase("waiting");
      setStatusText("Waiting for second player...");
      setJoinError(null);
      setIsJoining(false);
      setPendingJoinIntent(null);
      socket.emit("request_duel_state", { roomId: payload.roomId });
    };

    const onMatchStarted = () => {
      setPhase("in_game");
      setStatusText("Match started");
    };

    const onDuelState = (payload: DuelState) => {
      setDuelState(payload);
      setRoomId(payload.roomId);
      if (payload.status === "waiting") {
        setPhase("waiting");
        setStatusText("Waiting for second player...");
      } else if (payload.status === "playing") {
        setPhase("in_game");
        setStatusText(payload.turnPlayerId === socket.id ? "Your turn" : "Opponent turn");
      } else {
        setPhase("in_game");
        setStatusText("Match ended");
      }
    };

    const onPeekResult = (payload: { x: number; y: number; item: ChestItem }) => {
      const key = `${payload.x}-${payload.y}`;
      setPeekedTiles((prev) => ({ ...prev, [key]: payload.item }));
    };

    const onPlayerLeft = () => {
      setStatusText("Opponent disconnected");
    };

    const onRoomCreated = (payload: { roomId: string; roomCode: string }) => {
      setRoomId(payload.roomId);
      setRoomCode(payload.roomCode);
      setWaitingCount(1);
      setPhase("waiting");
      setStatusText("Share the code — waiting for opponent...");
      setJoinError(null);
      setIsJoining(false);
      setPendingJoinIntent(null);
      socket.emit("request_duel_state", { roomId: payload.roomId });
    };

    const onRequestStakeConfirmation = (payload: { roomId: string; betAmount: number }) => {
      // Show stake confirmation UI with the room's bet and force confirm
      setRoomId(payload.roomId);
      setStakeAmount(payload.betAmount);
      setSelectedStake(payload.betAmount);
      setStakeLocked(true);
      setAwaitingStakeConfirm(true);
      setPhase("stake");
      setStatusText("Confirm stake to start");
      setIsJoining(false);
      setJoinError(null);
    };

    const onJoinError = (payload: { message: string }) => {
      const message = payload?.message || "Unable to join room";
      setJoinError(message);
      setIsJoining(false);
      setWaitingCount(0);
      setRoomId(null);
      setRoomCode(null);

      // If the join failed due to stake mismatch or we were mid-stake, keep the user on the stake screen.
      const looksLikeStakeError = /stake|bet/i.test(message);
      if (pendingJoinIntentRef.current && looksLikeStakeError) {
        setPhase("stake");
        setStatusText("Adjust stake");
      } else {
        setPhase("menu");
        setStatusText("Choose how to play");
        setPendingJoinIntent(null);
      }
    };

    const onMatchEnded = (payload: { roomId?: string; winnerId?: string | null; betAmount?: number; totalPot?: number }) => {
      const matchKey = payload.roomId || roomId || "duel";
      if (settlementAppliedRef.current === matchKey) return;

      const betAmount = payload.betAmount ?? STAKE_MIN;
      const totalPot = payload.totalPot ?? betAmount * 2;
      const isWinner = Boolean(socket?.id && payload.winnerId && socket.id === payload.winnerId);
      const stakePaid = hasDuelStakePaid(matchKey);

      if (stakePaid && isWinner) {
        void claimDuelPayout(matchKey, totalPot);
      }

      if (!stakePaid) {
        const delta = isWinner ? totalPot : -betAmount;
        if (applyDuelSettlement(matchKey, delta)) {
          applyBtqDelta(delta);
        }
      }

      settlementAppliedRef.current = matchKey;
      setStatusText(isWinner ? `You won +${totalPot} BTQ` : `You lost ${betAmount} BTQ`);
    };

    socket.on("player_joined", onPlayerJoined);
    socket.on("match_started", onMatchStarted);
    socket.on("duel_state", onDuelState);
    socket.on("duel_peek_result", onPeekResult);
    socket.on("player_left", onPlayerLeft);
    socket.on("duel_room_created", onRoomCreated);
    socket.on("duel_join_error", onJoinError);
    socket.on("request_stake_confirmation", onRequestStakeConfirmation);
    socket.on("match_ended", onMatchEnded);

    return () => {
      socket.off("player_joined", onPlayerJoined);
      socket.off("match_started", onMatchStarted);
      socket.off("duel_state", onDuelState);
      socket.off("duel_peek_result", onPeekResult);
      socket.off("player_left", onPlayerLeft);
      socket.off("duel_room_created", onRoomCreated);
      socket.off("duel_join_error", onJoinError);
      socket.off("request_stake_confirmation", onRequestStakeConfirmation);
      socket.off("match_ended", onMatchEnded);
    };
  }, [socket, isConnected, roomId, applyBtqDelta]);

  useEffect(() => {
    if (!isMyTurn) {
      setIsPeekMode(false);
    }
  }, [isMyTurn]);

  useEffect(() => {
    setPeekedTiles({});
    setIsPeekMode(false);
  }, [roomId]);

  const walletUser = useMemo(() => getWalletUser(), []);

  const copyRoomCode = async () => {
    if (!roomCode) return;
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      // Fallback for browsers without clipboard API permissions
      const textarea = document.createElement("textarea");
      textarea.value = roomCode;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.top = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }

    setDidCopyCode(true);
    window.setTimeout(() => setDidCopyCode(false), 1200);
  };

  const joinRandom = (betAmount: number) => {
    if (!socket || !isConnected) return;
    setIsJoining(true);
    setJoinError(null);
    setStatusText("Finding opponent...");
    setPhase("waiting");
    setWaitingCount(1);

    try {
      socket
        .timeout(5000)
        .emit(
          "duel_join_random",
          {
            name: walletUser,
            role: "attacker",
            betAmount: clampStake(betAmount),
          },
          (err: unknown, res?: { ok: boolean; roomId?: string; message?: string }) => {
            if (err) {
              // Fallback for older server processes that don't have the new events.
              socket.emit("join_match", {
                name: walletUser,
                role: "attacker",
                mode: "duel",
              });
              return;
            }
            if (!res?.ok) {
              setJoinError(res?.message || "Unable to find a match");
              setStatusText("Choose how to play");
              setIsJoining(false);
              setPhase("stake");
              setWaitingCount(0);
            }
          }
        );
    } catch (e) {
      setJoinError("Server not responding. Restart the game server.");
      setStatusText("Choose how to play");
      setIsJoining(false);
      setPhase("stake");
      setWaitingCount(0);
    }
  };

  const createRoom = (betAmount: number) => {
    if (!socket || !isConnected) return;
    setIsJoining(true);
    setJoinError(null);
    setStatusText("Creating room...");
    setPhase("waiting");
    setWaitingCount(1);
    try {
      socket
        .timeout(5000)
        .emit(
          "duel_create_room",
          {
            name: walletUser,
            role: "attacker",
            betAmount: clampStake(betAmount),
          },
          (err: unknown, res?: { ok: boolean; roomId?: string; roomCode?: string; message?: string }) => {
            if (err) {
              setJoinError("Server not responding. Restart the game server.");
              setStatusText("Choose how to play");
              setIsJoining(false);
              setPhase("stake");
              setWaitingCount(0);
              return;
            }
            if (!res?.ok) {
              setJoinError(res?.message || "Unable to create room");
              setStatusText("Choose how to play");
              setIsJoining(false);
              setPhase("stake");
              setWaitingCount(0);
            }
          }
        );
    } catch (e) {
      setJoinError("Server not responding. Restart the game server.");
      setStatusText("Choose how to play");
      setIsJoining(false);
      setPhase("stake");
      setWaitingCount(0);
    }
  };

  const joinByCode = (code: string, betAmount: number) => {
    if (!socket || !isConnected) return;
    if (!code) {
      setJoinError("Enter a room code");
      return;
    }
    setIsJoining(true);
    setJoinError(null);
    setStatusText("Joining room...");
    setPhase("waiting");
    try {
      socket
        .timeout(5000)
        .emit(
          "duel_join_room",
          {
            roomCode: code,
            name: walletUser,
            role: "attacker",
            betAmount: clampStake(betAmount),
          },
          (err: unknown, res?: { ok: boolean; message?: string }) => {
            if (err) {
              setJoinError("Server not responding. Restart the game server.");
              setStatusText("Choose how to play");
              setIsJoining(false);
              setPhase("stake");
              setWaitingCount(0);
              return;
            }
            if (!res?.ok) {
              setJoinError(res?.message || "Unable to join room");
              setStatusText("Choose how to play");
              setIsJoining(false);
              setPhase("stake");
              setWaitingCount(0);
            }
          }
        );
    } catch (e) {
      setJoinError("Server not responding. Restart the game server.");
      setStatusText("Choose how to play");
      setIsJoining(false);
      setPhase("stake");
      setWaitingCount(0);
    }
  };

  const startStakeFor = (intent: PendingJoinIntent) => {
    if (!isConnected) return;
    setJoinError(null);
    setPendingJoinIntent(intent);
    setStakeAmount((prev) => clampStake(prev || STAKE_MIN));
    setPhase("stake");
    setStatusText("Set your stake");
  };

  const confirmStakeAndJoin = async () => {
    // If we're confirming a server-requested stake, tell server to proceed
    if (awaitingStakeConfirm && roomId && socket) {
      const bet = clampStake(stakeAmount);
      const ok = await lockDuelStake(roomId, bet);
      if (!ok) return;

      setAwaitingStakeConfirm(false);
      setStakeLocked(false);
      setStatusText("Waiting for opponent...");
      socket.emit("confirm_stake", { roomId });
      return;
    }

    if (!pendingJoinIntent) {
      setPhase("menu");
      setStatusText("Choose how to play");
      return;
    }
    const bet = clampStake(stakeAmount);
    setSelectedStake(bet);
    if (pendingJoinIntent.type === "random") {
      joinRandom(bet);
    } else if (pendingJoinIntent.type === "create") {
      createRoom(bet);
    } else {
      joinByCode(pendingJoinIntent.code, bet);
    }
  };

  useEffect(() => {
    try {
      const completed = localStorage.getItem("nearena_multiplayer_tour_complete");
      if (!completed) setShowTour(true);
    } catch (e) {
      // ignore
    }
  }, []);

  const handleTourComplete = () => {
    try {
      localStorage.setItem("nearena_multiplayer_tour_complete", "true");
    } catch (e) {}
    setShowTour(false);
  };

  const sortedTiles = useMemo(() => {
    if (!duelState) return [];
    return [...duelState.tiles].sort((a, b) => a.y - b.y || a.x - b.x);
  }, [duelState]);

  const onTileClick = (x: number, y: number, revealed: boolean) => {
    if (!socket || !roomId || !isMyTurn || revealed || duelState?.status !== "playing") return;

    if (isPeekMode && myPeekCharges > 0) {
      socket.emit("player_action", {
        roomId,
        action: "peek_tile",
        x,
        y,
      });
      setIsPeekMode(false);
      return;
    }

    socket.emit("player_action", {
      roomId,
      action: "open_chest",
      x,
      y,
    });
  };

  if (phase !== "in_game") {
    return (
      <main className="min-h-screen bg-[#020203] text-white font-mono cyber-grid relative overflow-hidden overflow-y-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />
        <div className="relative z-10 max-w-4xl mx-auto px-5 py-12 flex flex-col gap-6">
          <header className="border border-primary/30 bg-black/60 backdrop-blur-md p-5 flex items-center justify-between">
            <div>
              <p className="text-[9px] tracking-[0.2em] text-primary font-semibold uppercase">DUEL MULTIPLAYER</p>
              <h1 className="text-2xl font-black uppercase tracking-tight">Join a Match</h1>
              <p className="text-[11px] text-white/50 mt-1">{isConnected ? "Real-time via socket" : "Connecting to server..."}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-extrabold text-primary">{statusText}</p>
            </div>
          </header>

          {phase === "stake" && (
            <section className="border border-white/12 bg-black/45 p-6 grid gap-4">
              <div className="border border-primary/25 bg-black/50 p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/50">Stake Amount</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    {stakeLocked ? (
                      <div className="w-32 bg-transparent text-4xl font-black tracking-tight text-primary">
                        {stakeAmount}
                      </div>
                    ) : (
                      <input
                        value={Number.isFinite(stakeAmount) ? stakeAmount : STAKE_MIN}
                        onChange={(e) => {
                          if (stakeLocked) return;
                          const raw = e.target.value.replace(/\D/g, "");
                          const next = raw ? parseInt(raw, 10) : STAKE_MIN;
                          setStakeAmount(clampStake(next));
                        }}
                        inputMode="numeric"
                        className="w-32 bg-transparent text-4xl font-black tracking-tight text-primary outline-none border-b border-primary/40"
                        disabled={stakeLocked}
                      />
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/50">BTQ</span>
                  </div>

                  {!stakeLocked && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => !stakeLocked && setStakeAmount((v) => clampStake(v - STAKE_STEP))}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 hover:bg-white/10"
                        disabled={stakeLocked}
                      >
                        -{STAKE_STEP}
                      </button>
                      <button
                        onClick={() => !stakeLocked && setStakeAmount((v) => clampStake(v + STAKE_STEP))}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 hover:bg-white/10"
                        disabled={stakeLocked}
                      >
                        +{STAKE_STEP}
                      </button>
                    </div>
                  )}
                </div>
                {!stakeLocked && <p className="text-[11px] text-white/50 mt-2">Min {STAKE_MIN} • Max {STAKE_MAX}</p>}
                {joinError && <p className="text-xs text-red-400 mt-2">{joinError}</p>}
                {stakeError && <p className="text-xs text-red-400 mt-2">{stakeError}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setPhase("menu");
                    setStatusText("Choose how to play");
                    setPendingJoinIntent(null);
                    setJoinError(null);
                    setAwaitingStakeConfirm(false);
                    setStakeLocked(false);
                  }}
                  disabled={isJoining}
                  className="flex-1 px-5 py-4 text-xs font-black uppercase tracking-widest border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Back
                </button>
                <button
                  onClick={confirmStakeAndJoin}
                  disabled={!isConnected || isJoining || isStakePending}
                  className="flex-[2] px-5 py-4 text-xs font-black uppercase tracking-widest border border-primary/40 bg-primary/10 hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isStakePending ? "Locking Stake..." : "Confirm & Continue"}
                </button>
              </div>

              {stakeLocked ? (
                <p className="text-[11px] text-white/45">
                  The room creator has set the stake amount to {stakeAmount} BTQ.
                </p>
              ) : (
                <p className="text-[11px] text-white/45">
                  Tip: If you stake {STAKE_MIN}, you can increase up to {STAKE_MAX}.
                </p>
              )}
            </section>
          )}

          {phase !== "stake" && (
          <section className="border border-white/12 bg-black/45 p-6 grid gap-4">
            {phase === "waiting" && (
              <div className="border border-primary/25 bg-black/50 p-5">
                <p className="text-[10px] uppercase tracking-widest text-white/50">Room</p>
                {roomCode ? (
                  <div className="mt-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-3xl font-black tracking-[0.2em] text-primary">{roomCode}</p>
                      <button
                        onClick={copyRoomCode}
                        className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border border-white/20 bg-white/5 hover:bg-white/10"
                      >
                        {didCopyCode ? "Copied" : "Copy"}
                      </button>
                    </div>
                    <p className="text-[11px] text-white/50 mt-2">Share this code to invite a friend.</p>
                    <p className="text-[11px] text-white/60 mt-1">Stake: {selectedStake} BTQ</p>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-[11px] text-white/50">Random matchmaking…</p>
                    <p className="text-[11px] text-white/60 mt-1">Stake: {selectedStake} BTQ</p>
                  </div>
                )}
                <p className="text-[11px] text-white/60 mt-3">Players in room: {Math.max(1, waitingCount)}/2</p>
                {joinError && <p className="text-xs text-red-400 mt-2">{joinError}</p>}
              </div>
            )}

            <button
              onClick={() => {
                if (!socket || !isConnected) return;
                socket.timeout(2000).emit("check_random_available", {}, (err: unknown, res?: { available: boolean; betAmount?: number }) => {
                  if (err || !res) {
                    startStakeFor({ type: "random" });
                    return;
                  }
                  if (res.available) {
                    setPendingJoinIntent({ type: "random" });
                    joinRandom(res.betAmount || STAKE_MIN);
                  } else {
                    startStakeFor({ type: "random" });
                  }
                });
              }}
              disabled={!isConnected || isJoining}
              className="w-full px-5 py-4 text-xs font-black uppercase tracking-widest border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Join Random Room
            </button>

            <button
              onClick={() => startStakeFor({ type: "create" })}
              disabled={!isConnected || isJoining}
              className="w-full px-5 py-4 text-xs font-black uppercase tracking-widest border border-primary/40 bg-primary/10 hover:bg-primary/15 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Room (Get Code)
            </button>

            <div className="border-t border-white/10 pt-4 grid gap-2">
              <p className="text-[10px] uppercase tracking-widest text-white/50">Enter Code</p>
              <div className="flex gap-2">
                <input
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  className="flex-1 bg-black/40 border border-white/15 px-4 py-3 text-sm outline-none"
                />
                <button
                  onClick={() => {
                    const code = joinCodeInput.trim().toUpperCase();
                    if (!code) {
                      setJoinError("Enter a room code");
                      return;
                    }
                    // Removed startStakeFor so we skip the adjustment screen and join directly.
                    // Backend will read the room's stake and immediately respond with a stake confirmation lock.
                    setPendingJoinIntent({ type: "code", code });
                    joinByCode(code, STAKE_MIN);
                  }}
                  disabled={!isConnected || isJoining}
                  className="px-5 py-3 text-xs font-black uppercase tracking-widest border border-white/20 bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Join
                </button>
              </div>
              {joinError && <p className="text-xs text-red-400">{joinError}</p>}
            </div>
          </section>
          )}

          {phase !== "stake" && (
            <p className="text-[11px] text-white/45">
              Tip: Use “Create Room” to get a code and share it with a friend.
            </p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020203] text-white font-mono cyber-grid relative overflow-hidden overflow-y-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[100] bg-[length:100%_2px,3px_100%]" />

      <div className="relative z-10 max-w-7xl mx-auto px-5 py-4 md:py-6 flex flex-col gap-4 md:gap-6">
        <header className="border border-primary/30 bg-black/60 backdrop-blur-md p-2 md:p-3 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <p className="text-[9px] tracking-[0.2em] text-primary font-semibold uppercase">REALTIME DUEL</p>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">Shared Chest Grid</h1>
            <p id="match-id-info" className="text-[11px] text-white/50 mt-1">{roomCode ? `Code: ${roomCode}` : (roomId ? `Match: ${roomId}` : 'Match: TBD')}</p>
          </div>

          <div className="text-right">
              <p id="stats-info" className="text-base md:text-lg font-extrabold text-primary">{statusText}</p>
              <div className="mt-1 text-[11px] text-white/60">
                <span className="inline-block mr-4">Bet: {duelState?.betAmount ?? selectedStake} BTQ</span>
                <span className="inline-block mr-4">Pot: {duelState?.totalPot ?? selectedStake * 2} BTQ</span>
                <span className="inline-block">Peek: {myPeekCharges}</span>
              </div>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">
          <div className="md:col-span-1 flex flex-col gap-4">
            {[me, opponent].map((player, idx) => {
              const maxLives = duelState?.maxLives ?? 5;
              const lives = player ? (duelState?.lives[player.id] ?? maxLives) : maxLives;
              const isTurnForPlayer = Boolean(
                duelState?.status === "playing" &&
                  duelState?.turnPlayerId &&
                  player?.id &&
                  player.id === duelState.turnPlayerId
              );
              return (
                <div
                  key={player?.id || idx}
                  className={`relative overflow-hidden border p-3 transition-all duration-300 ${
                    isTurnForPlayer
                      ? "border-primary bg-primary/15 shadow-[0_0_40px_rgba(0,242,255,0.22)] ring-1 ring-primary/40 scale-[1.01]"
                      : "border-white/12 bg-black/50"
                  }`}
                >
                  {isTurnForPlayer && (
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse" />
                  )}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] tracking-[0.25em] text-white/40 uppercase">{idx === 0 ? "You" : "Opponent"}</p>
                      <p className={`text-lg md:text-xl font-black uppercase tracking-tight ${isTurnForPlayer ? "text-primary" : "text-white"}`}>
                        {player?.name || "Waiting..."}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {isTurnForPlayer ? (
                        <span className="px-2 py-1 text-[9px] font-black uppercase tracking-[0.25em] bg-primary text-black">
                          Your Turn
                        </span>
                      ) : (
                        <Users className="w-5 h-5 text-primary/80" />
                      )}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {Array.from({ length: maxLives }).map((_, i) => (
                      <Heart
                        key={i}
                        className={`w-5 h-5 ${i < lives ? "text-red-500 fill-red-500/80" : "text-white/20"}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center justify-between">
              <p className="text-xs text-white/60 uppercase tracking-widest">Lives: {duelState?.maxLives ?? 5}</p>
              <button
                id="btn-magnifier"
                onClick={() => setIsPeekMode((prev) => !prev)}
                disabled={!isMyTurn || myPeekCharges <= 0 || duelState?.status !== "playing"}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border transition-all ${
                  isPeekMode
                    ? "border-cyan-300 text-cyan-300 bg-cyan-300/10"
                    : "border-white/25 text-white/80"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isPeekMode ? "Peek ON" : "Use Magnifier"}
              </button>
            </div>

            <div id="chest-legend" className="grid grid-cols-1 gap-2 text-xs">
              {(["gun", "health", "skip", "double_kill", "magnifier"] as ChestItem[]).map((item) => (
                <div key={item} className="border border-white/12 bg-black/40 p-2 flex items-center gap-2">
                  <div className="w-5 h-5 flex items-center justify-center">{itemToIcon[item]}</div>
                  <p className="text-white/80 text-xs">{itemToLabel[item]}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <section id="arena-grid" className="border border-primary/25 bg-black/55 p-2 md:p-4">
              <div className="grid gap-2 md:gap-3" style={{ gridTemplateColumns: `repeat(${duelState?.gridSize || 6}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${duelState?.gridSize || 6}, minmax(0, 1fr))`, height: 'min(72vh, calc(100vh - 170px))' }}>
                {(sortedTiles.length > 0 ? sortedTiles : Array.from({ length: 36 }).map((_, i) => ({
                  x: i % 6,
                  y: Math.floor(i / 6),
                  revealed: false,
                  item: undefined,
                }))).map((tile) => (
                  <motion.button
                    key={`${tile.x}-${tile.y}`}
                    whileHover={!tile.revealed && isMyTurn ? { scale: 1.03 } : {}}
                    whileTap={!tile.revealed && isMyTurn ? { scale: 0.98 } : {}}
                    onClick={() => onTileClick(tile.x, tile.y, tile.revealed)}
                    disabled={!isMyTurn || tile.revealed || duelState?.status !== "playing"}
                    className={`w-full h-full border text-sm md:text-base font-bold tracking-wide transition-all flex items-center justify-center ${
                      tile.revealed
                        ? "border-primary/50 bg-primary/10"
                        : peekedTiles[`${tile.x}-${tile.y}`]
                          ? "border-cyan-300/70 bg-cyan-300/10"
                        : isMyTurn
                          ? "border-white/20 bg-white/5 hover:border-primary/60"
                          : "border-white/10 bg-white/[0.03]"
                    }`}
                  >
                    {tile.revealed && tile.item
                      ? itemToIcon[tile.item]
                      : peekedTiles[`${tile.x}-${tile.y}`]
                        ? (
                          <div className="flex flex-col items-center gap-1 text-[10px]">
                            {itemToIcon[peekedTiles[`${tile.x}-${tile.y}`]]}
                            <span className="text-[9px] text-cyan-300 uppercase">Scanned</span>
                          </div>
                        )
                        : <span className="text-white/60">CHEST</span>}
                  </motion.button>
                ))}
              </div>
            </section>
          </div>
        </section>

        {/* Multiplayer Tour */}
        {showTour && (
          <TutorialTour
            onComplete={handleTourComplete}
            steps={[
              {
                title: "Welcome to Multiplayer",
                content: "This short tour will guide you through the shared chest duel interface and basic actions.",
                icon: <Users className="w-6 h-6 text-primary" />, 
                position: "center"
              },
              {
                targetId: "match-id-info",
                title: "Match ID",
                content: "This is your match identifier — share it with friends to join the same duel.",
                icon: <Search className="w-6 h-6 text-cyan-300" />, 
                position: "bottom"
              },
              {
                targetId: "stats-info",
                title: "Status & Pot",
                content: "Monitor current match status, pot size and your magnifier charges here.",
                icon: <Heart className="w-6 h-6 text-rose-400" />, 
                position: "bottom"
              },
              {
                targetId: "arena-grid",
                title: "Arena Grid",
                content: "Click a chest when it's your turn to reveal items. Use strategy to win the pot.",
                icon: <Crosshair className="w-6 h-6 text-red-400" />, 
                position: "right"
              },
              {
                targetId: "btn-magnifier",
                title: "Magnifier (Peek)",
                content: "Toggle Magnifier when it's your turn to scan a chest without opening it.",
                icon: <Search className="w-6 h-6 text-cyan-300" />, 
                position: "top"
              },
              {
                targetId: "chest-legend",
                title: "Chest Items",
                content: "Gun: -1 life to opponent. Health: +1 life (max 5). Skip: opponent loses next turn. Double Kill: -2 lives to opponent. Magnifier: inspect one tile without opening.",
                icon: <ShieldPlus className="w-6 h-6 text-emerald-400" />,
                position: "bottom"
              },
              {
                title: "Begin Duel",
                content: "You're ready — good luck. Remember turn order and watch your lives.",
                icon: <Users className="w-6 h-6 text-primary" />, 
                position: "center"
              }
            ]}
          />
        )}

        {/* chest legend moved to left column */}

        {duelState?.status === "ended" && (
          <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

            <section className="relative w-full max-w-4xl border-2 border-primary bg-[#020203]/90 p-8 text-center">
              <p className="text-xs uppercase tracking-[0.25em] text-primary mb-2">Match Ended</p>
              <h2 className="text-3xl md:text-4xl font-black uppercase">Winner: {winner?.name || "Unknown"}</h2>

              <div className="mt-4 grid gap-2">
                <p className={`text-sm uppercase tracking-widest ${isMeWinner ? "text-emerald-300" : "text-red-300"}`}>
                  {isMeWinner ? `You won +${duelState.totalPot} BTQ` : `You lost ${duelState.betAmount} BTQ`}
                </p>
                <p className="text-sm uppercase tracking-widest text-white/70">
                  Stake: {duelState.betAmount} BTQ • Pot: {duelState.totalPot} BTQ
                </p>
                <p className="text-[11px] text-white/55">Winner receives {duelState.totalPot} BTQ pot</p>
              </div>

              {isMeWinner && (
                <div className="mt-6 grid gap-2">
                  {hasDuelStakePaid(roomId || "") && !hasDuelPayoutClaimed(roomId || "") && (
                    <button
                      onClick={() => roomId && claimDuelPayout(roomId, duelState.totalPot)}
                      disabled={isPayoutPending}
                      className="px-8 py-4 bg-emerald-400 text-black font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {isPayoutPending ? "Claiming..." : "Claim Winnings"}
                    </button>
                  )}
                  {hasDuelPayoutClaimed(roomId || "") && (
                    <p className="text-[11px] text-emerald-300 uppercase tracking-widest">Payout confirmed on-chain</p>
                  )}
                  {payoutError && (
                    <p className="text-[11px] text-red-300 uppercase tracking-widest">{payoutError}</p>
                  )}
                </div>
              )}

              <button
                onClick={() => router.push("/lobby")}
                className="mt-6 px-8 py-4 bg-primary text-black font-black uppercase tracking-widest"
              >
                Back To Lobby
              </button>
            </section>
          </div>
        )}
      </div>

      {/* Debug: Show Tour button for testing (small, unobtrusive) */}
      <div className="fixed top-4 right-4 z-[250]">
        <button
          id="btn-show-tour"
          onClick={() => setShowTour(true)}
          className="px-3 py-2 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/10 text-white/80 hover:bg-white/10"
        >
          Show Tour
        </button>
      </div>
    </main>
  );
}
