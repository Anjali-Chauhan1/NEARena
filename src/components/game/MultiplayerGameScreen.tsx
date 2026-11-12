"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Heart, Crosshair, ShieldPlus, SkipForward, Users, Bomb, Search } from "lucide-react";
import { useSocket } from "@/hooks/useSocket";
import { TutorialTour } from "@/components/game/TutorialTour";
import { applyDuelSettlement, getWalletUser, hasDuelPayoutClaimed, hasDuelStakePaid, markDuelPayoutClaimed, markDuelStakePaid } from "@/lib/user";
import { useGameStore } from "@/store/useGameStore";
import { useWriteContract } from "@/lib/near/hooks";
import { btqToYocto } from "@/lib/near/format";

const DuelArena3D = dynamic(() => import("@/components/game/DuelArena3D"), { ssr: false });

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
  gun: <Crosshair className="w-6 h-6 text-[#e74c3c]" />,
  health: <ShieldPlus className="w-6 h-6 text-[#3fae5a]" />,
  skip: <SkipForward className="w-6 h-6 text-[#d9a441]" />,
  double_kill: <Bomb className="w-6 h-6 text-[#a569bd]" />,
  magnifier: <Search className="w-6 h-6 text-[#5dade2]" />,
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

  type DuelFx = { key: number; kind: "hit" | "strike" | "heal" | null; item?: ChestItem };
  const [fx, setFx] = useState<DuelFx>({ key: 0, kind: null });
  const [shakeKey, setShakeKey] = useState(0);
  const prevDuelRef = useRef<DuelState | null>(null);

  useEffect(() => {
    const prev = prevDuelRef.current;
    prevDuelRef.current = duelState;
    if (!prev || !duelState || !myId || prev.roomId !== duelState.roomId) return;

    const opened = duelState.tiles.find(
      (t) => t.revealed && !prev.tiles.find((p) => p.x === t.x && p.y === t.y)?.revealed
    );
    const oppId = duelState.players.find((p) => p.id !== myId)?.id;
    const myDelta = (duelState.lives[myId] ?? 0) - (prev.lives[myId] ?? 0);
    const oppDelta = oppId ? (duelState.lives[oppId] ?? 0) - (prev.lives[oppId] ?? 0) : 0;
    const kind = myDelta < 0 ? "hit" : oppDelta < 0 ? "strike" : myDelta > 0 || oppDelta > 0 ? "heal" : null;
    if (!opened && !kind) return;

    setFx((f) => ({ key: f.key + 1, kind, item: opened?.item }));
    if (kind === "hit" || kind === "strike") setShakeKey((k) => k + 1);
  }, [duelState, myId]);

  const resetToMenu = () => {
    setPhase("menu");
    setStatusText("Choose how to play");
    setPendingJoinIntent(null);
    setJoinError(null);
    setAwaitingStakeConfirm(false);
    setStakeLocked(false);
  };

  const quickMatch = () => {
    if (!socket || !isConnected) return;
    socket.timeout(2000).emit("check_random_available", {}, (err: unknown, res?: { available: boolean; betAmount?: number }) => {
      if (!err && res?.available) {
        setPendingJoinIntent({ type: "random" });
        joinRandom(res.betAmount || STAKE_MIN);
      } else {
        startStakeFor({ type: "random" });
      }
    });
  };

  const joinWithCode = () => {
    const code = joinCodeInput.trim().toUpperCase();
    if (!code) {
      setJoinError("Enter a room code");
      return;
    }
    // The server reads the room's stake and replies with a locked stake confirmation.
    setPendingJoinIntent({ type: "code", code });
    joinByCode(code, STAKE_MIN);
  };

  const preGame = phase !== "in_game";
  const maxLives = duelState?.maxLives ?? 5;
  const myLives = me ? (duelState?.lives[me.id] ?? maxLives) : maxLives;
  const oppLives = opponent ? (duelState?.lives[opponent.id] ?? maxLives) : maxLives;
  const playing = duelState?.status === "playing";
  const pot = duelState?.totalPot ?? selectedStake * 2;

  const plate =
    "px-5 py-4 text-xs font-black uppercase tracking-[0.22em] transition-all disabled:opacity-40 disabled:cursor-not-allowed [clip-path:polygon(14px_0,100%_0,calc(100%-14px)_100%,0_100%)]";
  const plateGold = `${plate} bg-[#c9973a] text-black hover:bg-[#ddb04f] active:translate-y-px`;
  const plateDark = `${plate} bg-[#2a241b] text-[#e8d9b5] hover:bg-[#3a3225]`;

  const lifePips = (lives: number, tone: string) => (
    <div className="flex gap-1">
      {Array.from({ length: maxLives }).map((_, i) => (
        <span
          key={i}
          className={`h-2.5 w-5 -skew-x-12 transition-all duration-300 ${i < lives ? tone : "bg-white/10"}`}
        />
      ))}
    </div>
  );

  return (
    <main className="relative h-screen w-full overflow-hidden bg-[#040506] text-white select-none">
      <div className="absolute inset-0">
        <DuelArena3D
          gridSize={duelState?.gridSize || 6}
          tiles={sortedTiles}
          peeked={peekedTiles}
          canAct={!preGame && isMyTurn && Boolean(playing)}
          peekMode={isPeekMode}
          onTile={onTileClick}
          myLives={myLives}
          oppLives={oppLives}
          maxLives={maxLives}
          hasOpponent={Boolean(opponent)}
          opponentTurn={Boolean(playing && !isMyTurn)}
          shakeKey={shakeKey}
          idle={preGame}
        />
      </div>

      {preGame ? (
        <div className="absolute inset-0 overflow-y-auto flex items-center justify-center p-4 bg-black/35">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-lg bg-[#15120e] border-2 border-[#8a6a2f]"
          >
            <div className="h-1.5 bg-[#8a6a2f]" />
            <div className="p-6 md:p-8 grid gap-5">
              <header className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black tracking-[0.35em] text-amber-400 uppercase">Chest Duel · 1v1</p>
                  <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mt-1">
                    {phase === "stake" ? "Place Stake" : phase === "waiting" ? "Table Open" : "Take a Seat"}
                  </h1>
                </div>
                <div className="flex items-center gap-2 pb-1">
                  <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{statusText}</span>
                </div>
              </header>

              {phase === "stake" && (
                <>
                  <div className="bg-[#0e0c09] border border-[#5c4a26] p-5">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-black">Stake Amount</p>
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <div className="flex items-baseline gap-3">
                        {stakeLocked ? (
                          <span className="text-6xl font-black italic tracking-tighter text-amber-300">{stakeAmount}</span>
                        ) : (
                          <input
                            value={Number.isFinite(stakeAmount) ? stakeAmount : STAKE_MIN}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              setStakeAmount(clampStake(raw ? parseInt(raw, 10) : STAKE_MIN));
                            }}
                            inputMode="numeric"
                            className="w-36 bg-transparent text-6xl font-black italic tracking-tighter text-amber-300 outline-none border-b-2 border-amber-400/40 focus:border-amber-300"
                          />
                        )}
                        <span className="text-xs font-black uppercase tracking-widest text-white/50">BTQ</span>
                      </div>
                      {!stakeLocked && (
                        <div className="flex gap-2">
                          <button onClick={() => setStakeAmount((v) => clampStake(v - STAKE_STEP))} className={`${plateDark} !px-4 !py-3`}>
                            -{STAKE_STEP}
                          </button>
                          <button onClick={() => setStakeAmount((v) => clampStake(v + STAKE_STEP))} className={`${plateDark} !px-4 !py-3`}>
                            +{STAKE_STEP}
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 mt-3">
                      {stakeLocked
                        ? `The room creator set the stake to ${stakeAmount} BTQ.`
                        : `Min ${STAKE_MIN} · Max ${STAKE_MAX} · Winner takes the whole pot`}
                    </p>
                    {joinError && <p className="text-xs text-red-400 mt-2">{joinError}</p>}
                    {stakeError && <p className="text-xs text-red-400 mt-2 break-words">{stakeError}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={resetToMenu} disabled={isJoining} className={`${plateDark} flex-1`}>
                      Back
                    </button>
                    <button onClick={confirmStakeAndJoin} disabled={!isConnected || isJoining || isStakePending} className={`${plateGold} flex-[2]`}>
                      {isStakePending ? "Locking Stake..." : "Confirm Stake"}
                    </button>
                  </div>
                </>
              )}

              {phase === "waiting" && (
                <div className="bg-[#0e0c09] border border-[#5c4a26] p-5">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-black">{roomCode ? "Room Code" : "Matchmaking"}</p>
                  {roomCode ? (
                    <div className="mt-2 flex items-center justify-between gap-3">
                      <p className="text-5xl font-black tracking-[0.25em] text-[#e2b04a]">{roomCode}</p>
                      <button onClick={copyRoomCode} className={`${plateDark} !px-4 !py-3`}>
                        {didCopyCode ? "Copied" : "Copy"}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-lg font-black italic uppercase text-[#e2b04a] animate-pulse">Searching for a rival…</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-[11px] uppercase tracking-widest text-white/60 font-black">
                    <span>Stake {selectedStake} BTQ</span>
                    <span>Seats {Math.max(1, waitingCount)}/2</span>
                  </div>
                  <div className="mt-2 h-1 bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full w-1/3 bg-[#c9973a]"
                      animate={{ x: ["-100%", "300%"] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                  {joinError && <p className="text-xs text-red-400 mt-2">{joinError}</p>}
                </div>
              )}

              {phase !== "stake" && (
                <>
                  <button onClick={quickMatch} disabled={!isConnected || isJoining} className={`${plateGold} w-full !py-5 !text-sm`}>
                    Quick Match
                  </button>
                  <button onClick={() => startStakeFor({ type: "create" })} disabled={!isConnected || isJoining} className={`${plateDark} w-full`}>
                    Create Private Room
                  </button>
                  <div className="grid gap-2 pt-1">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/45 font-black">Have a code?</p>
                    <div className="flex gap-2">
                      <input
                        value={joinCodeInput}
                        onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        className="flex-1 min-w-0 bg-[#0e0c09] border border-[#5c4a26] px-4 py-3 text-sm font-black tracking-[0.3em] outline-none focus:border-[#c9973a]"
                      />
                      <button onClick={joinWithCode} disabled={!isConnected || isJoining} className={`${plateDark} !py-3`}>
                        Join
                      </button>
                    </div>
                    {phase === "menu" && joinError && <p className="text-xs text-red-400">{joinError}</p>}
                  </div>
                </>
              )}

              <button
                onClick={() => router.push("/lobby")}
                className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 hover:text-white/80 justify-self-start"
              >
                ← Exit to Lobby
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 md:p-5">
          <div id="arena-grid" className="absolute inset-x-[18%] top-[24%] bottom-[20%]" />

          <div className="flex items-start justify-between gap-3">
            <div
              id="player-you"
              className={`min-w-[150px] md:min-w-[190px] px-4 py-2.5 border-l-4 bg-[#15120e] transition-all relative ${
                isMyTurn && playing ? "border-[#3fae5a] shadow-[0_0_15px_rgba(63,174,90,0.35)]" : "border-[#5c4a26]"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[9px] font-black tracking-[0.3em] text-white/45 uppercase">You</p>
                {isMyTurn && playing && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3fae5a] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#3fae5a]" />
                  </span>
                )}
              </div>
              <p className="text-base md:text-lg font-black italic uppercase tracking-tight truncate max-w-[40vw] md:max-w-[220px]">
                {me?.name || walletUser}
              </p>
              <div className="mt-1.5">{lifePips(myLives, "bg-[#3fae5a]")}</div>

              {playing && isMyTurn && (
                <motion.div
                  id="stats-info"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 px-3 py-1 bg-[#3fae5a] text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-center"
                >
                  YOUR TURN
                </motion.div>
              )}
            </div>

            <div
              id="player-rival"
              className={`min-w-[150px] md:min-w-[190px] px-4 py-2.5 border-r-4 bg-[#15120e] text-right transition-all relative ${
                !isMyTurn && playing ? "border-[#c0392b] shadow-[0_0_15px_rgba(192,57,43,0.35)]" : "border-[#5c4a26]"
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-row-reverse">
                <p className="text-[9px] font-black tracking-[0.3em] text-white/45 uppercase">Rival</p>
                {!isMyTurn && playing && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c0392b] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c0392b]" />
                  </span>
                )}
              </div>
              <p className="text-base md:text-lg font-black italic uppercase tracking-tight truncate max-w-[40vw] md:max-w-[220px] ml-auto">
                {opponent?.name || "Waiting..."}
              </p>
              <div className="mt-1.5 flex justify-end">{lifePips(oppLives, "bg-[#c0392b]")}</div>

              {playing && !isMyTurn && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2.5 px-3 py-1 bg-[#c0392b] text-white text-[10px] md:text-[11px] font-black uppercase tracking-[0.25em] text-center"
                >
                  OPPONENT TURN
                </motion.div>
              )}
            </div>
          </div>

          <div className="flex items-end justify-center gap-3">
            <div id="chest-legend" className="pointer-events-auto flex gap-1.5 p-1.5 bg-[#15120e] border-2 border-[#8a6a2f]">
              {(["gun", "double_kill", "health", "skip", "magnifier"] as ChestItem[]).map((item) => (
                <div key={item} className="group relative h-11 w-11 md:h-12 md:w-12 flex items-center justify-center bg-[#241f18] border border-[#5c4a26] hover:border-[#e2b04a]">
                  {itemToIcon[item]}
                  <span className="pointer-events-none absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1 text-[10px] font-bold bg-black/90 border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity">
                    {itemToLabel[item]}
                  </span>
                </div>
              ))}
            </div>
            <button
              id="btn-magnifier"
              onClick={() => setIsPeekMode((prev) => !prev)}
              disabled={!isMyTurn || myPeekCharges <= 0 || !playing}
              className={`pointer-events-auto relative h-14 md:h-[60px] px-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] border-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isPeekMode
                  ? "border-[#e2b04a] bg-[#3a2f1a] text-[#e2b04a]"
                  : "border-[#8a6a2f] bg-[#15120e] text-[#e8d9b5] hover:border-[#e2b04a]"
              }`}
            >
              <Search className="w-5 h-5" />
              {isPeekMode ? "Pick a chest" : "Scan"}
              <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] bg-[#c9973a] text-black">
                {myPeekCharges}
              </span>
            </button>
          </div>

          <div
            id="match-pot-info"
            className="pointer-events-auto absolute bottom-3 left-3 md:bottom-5 md:left-5 flex items-center gap-2.5 px-3.5 py-2 bg-[#15120e] border border-[#8a6a2f]/70"
          >
            <span className="h-4 w-4 rounded-full bg-[#e2b04a] border border-[#8a6a2f] shrink-0" />
            <div className="flex flex-col">
              <span className="text-xs md:text-sm font-black italic tracking-tight text-amber-300 leading-none">
                {pot} BTQ POT
              </span>
              <span className="text-[8px] md:text-[9px] font-black tracking-widest text-white/40 uppercase mt-0.5">
                {roomCode ? `Code ${roomCode}` : roomId ? `Match ${roomId.slice(0, 8)}` : "Duel"} · Bet {duelState?.betAmount ?? selectedStake}
              </span>
            </div>
          </div>

          <button
            id="btn-show-tour"
            onClick={() => setShowTour(true)}
            className="pointer-events-auto absolute bottom-3 right-3 md:bottom-5 md:right-5 px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest bg-[#15120e] border border-[#5c4a26] text-white/60 hover:text-white"
          >
            ? Help
          </button>
        </div>
      )}

      {fx.kind && (
        <motion.div
          key={`flash-${fx.key}`}
          initial={{ opacity: 0.75 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.9 }}
          className="absolute inset-0 pointer-events-none z-[120]"
          style={{
            background:
              fx.kind === "hit"
                ? "radial-gradient(circle, transparent 35%, rgba(255,0,40,0.75))"
                : fx.kind === "heal"
                  ? "radial-gradient(circle, transparent 45%, rgba(34,255,154,0.5))"
                  : "radial-gradient(circle, rgba(255,240,200,0.45), transparent 60%)",
          }}
        />
      )}

      {fx.item && !preGame && (
        <motion.div
          key={`toast-${fx.key}`}
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1.08, 1, 1.05] }}
          transition={{ duration: 1.9, times: [0, 0.12, 0.8, 1] }}
          className="absolute inset-x-0 top-[30%] z-[130] pointer-events-none flex flex-col items-center gap-2 text-center px-4"
        >
          <div className="scale-[2.4] mb-4">{itemToIcon[fx.item]}</div>
          <p className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter drop-">
            {fx.item === "double_kill" ? "Double Kill" : fx.item}
          </p>
          <p className="px-3 py-1 text-[11px] font-black uppercase tracking-[0.25em] bg-black/75">{itemToLabel[fx.item]}</p>
        </motion.div>
      )}

      {showTour && !preGame && (
        <TutorialTour
          onComplete={handleTourComplete}
          steps={[
            {
              title: "Welcome to the Table",
              content: "Two players, one grid of chests. Open the right ones and drain your rival's lives to take the pot.",
              icon: <Users className="w-6 h-6" />,
              position: "center",
            },
            {
              targetId: "player-you",
              title: "Your Turn & Health",
              content: "Watch your health pips here. When it's your move, 'YOUR TURN' lights up in green under your card.",
              icon: <Heart className="w-6 h-6" />,
              position: "bottom",
            },
            {
              targetId: "arena-grid",
              title: "The Chests",
              content: "On your turn, click a chest to open it. Whatever is inside takes effect immediately.",
              icon: <Crosshair className="w-6 h-6" />,
              position: "right",
            },
            {
              targetId: "btn-magnifier",
              title: "Scan",
              content: "Spend a scan charge to see inside one chest without opening it.",
              icon: <Search className="w-6 h-6" />,
              position: "top",
            },
            {
              targetId: "chest-legend",
              title: "Chest Items",
              content: "Gun: -1 life to rival. Double Kill: -2 lives. Health: +1 life. Skip: rival loses a turn. Magnifier: +1 scan.",
              icon: <ShieldPlus className="w-6 h-6" />,
              position: "top",
            },
          ]}
        />
      )}

      {duelState?.status === "ended" && !preGame && (
        <div className="absolute inset-0 z-[260] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <motion.section
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 180, damping: 16 }}
            className={`w-full max-w-xl bg-[#15120e] border-2 p-8 text-center ${
              isMeWinner ? "border-[#c9973a]" : "border-[#a93226]"
            }`}
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/50">Match Over</p>
            <h2 className={`mt-2 text-6xl md:text-7xl font-black italic uppercase tracking-tighter ${isMeWinner ? "text-amber-300" : "text-red-500"}`}>
              {isMeWinner ? "Victory" : "Defeated"}
            </h2>
            <p className="mt-2 text-sm font-black uppercase tracking-widest text-white/70">Winner: {winner?.name || "Unknown"}</p>
            <p className={`mt-5 text-3xl font-black italic ${isMeWinner ? "text-emerald-300" : "text-red-300"}`}>
              {isMeWinner ? `+${duelState.totalPot}` : `-${duelState.betAmount}`} BTQ
            </p>
            <p className="mt-1 text-[11px] uppercase tracking-widest text-white/45">
              Stake {duelState.betAmount} · Pot {duelState.totalPot}
            </p>

            {isMeWinner && (
              <div className="mt-6 grid gap-2">
                {hasDuelStakePaid(roomId || "") && !hasDuelPayoutClaimed(roomId || "") && (
                  <button onClick={() => roomId && claimDuelPayout(roomId, duelState.totalPot)} disabled={isPayoutPending} className={`${plateGold} w-full`}>
                    {isPayoutPending ? "Claiming..." : "Claim Winnings"}
                  </button>
                )}
                {hasDuelPayoutClaimed(roomId || "") && (
                  <p className="text-[11px] font-black text-emerald-300 uppercase tracking-widest">Payout confirmed on-chain</p>
                )}
                {payoutError && <p className="text-[11px] text-red-300 break-words">{payoutError}</p>}
              </div>
            )}

            <button onClick={() => router.push("/lobby")} className={`${plateDark} w-full mt-4`}>
              Back to Lobby
            </button>
          </motion.section>
        </div>
      )}
    </main>
  );
}
