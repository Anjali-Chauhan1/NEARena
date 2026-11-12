"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Backdrop, CeilingRig, Machine } from "@/components/game/StageSet";

export type ArenaItem = "gun" | "health" | "skip" | "double_kill" | "magnifier" | "empty";

export interface ArenaTile {
  x: number;
  y: number;
  revealed: boolean;
  item?: ArenaItem;
}

interface DuelArena3DProps {
  gridSize: number;
  tiles: ArenaTile[];
  peeked: Record<string, ArenaItem>;
  canAct: boolean;
  peekMode: boolean;
  onTile: (x: number, y: number, revealed: boolean) => void;
  myLives: number;
  oppLives: number;
  maxLives: number;
  hasOpponent: boolean;
  opponentTurn: boolean;
  shakeKey: number;
  idle: boolean;
}

const SPACING = 1.02;
const ROW_SPACING = 1.3;

const ITEM_COLOR: Record<ArenaItem, string> = {
  gun: "#c0392b",
  health: "#3fae5a",
  skip: "#d9a441",
  double_kill: "#8e44ad",
  magnifier: "#3d8bd9",
  empty: "#4a4d52",
};

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.damp(current, target, lambda, dt);

function ItemModel({ item, ghost = false }: { item: ArenaItem; ghost?: boolean }) {
  const color = ghost ? "#3d8bd9" : ITEM_COLOR[item];
  const mat = (
    <meshStandardMaterial
      color={color}
      emissive={color}
      emissiveIntensity={ghost ? 0.5 : item === "empty" ? 0.05 : 0.45}
      metalness={0.4}
      roughness={0.35}
      transparent={ghost}
      opacity={ghost ? 0.55 : 1}
      wireframe={ghost}
    />
  );

  switch (item) {
    case "gun":
      return (
        <group rotation={[0, 0, 0.15]}>
          <mesh position={[0.04, 0.05, 0]}>
            <boxGeometry args={[0.36, 0.09, 0.08]} />
            {mat}
          </mesh>
          <mesh position={[-0.1, -0.07, 0]} rotation={[0, 0, 0.25]}>
            <boxGeometry args={[0.09, 0.2, 0.07]} />
            {mat}
          </mesh>
          <mesh position={[0.02, -0.03, 0]}>
            <torusGeometry args={[0.045, 0.012, 8, 16]} />
            {mat}
          </mesh>
        </group>
      );
    case "health":
      return (
        <group>
          <mesh>
            <boxGeometry args={[0.3, 0.1, 0.1]} />
            {mat}
          </mesh>
          <mesh>
            <boxGeometry args={[0.1, 0.3, 0.1]} />
            {mat}
          </mesh>
        </group>
      );
    case "skip":
      return (
        <group>
          {[-0.08, 0.1].map((px) => (
            <mesh key={px} position={[px, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.13, 0.18, 3]} />
              {mat}
            </mesh>
          ))}
        </group>
      );
    case "double_kill":
      return (
        <group>
          <mesh>
            <icosahedronGeometry args={[0.15, 1]} />
            {mat}
          </mesh>
          <mesh position={[0.07, 0.17, 0]} rotation={[0, 0, -0.4]}>
            <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
            {mat}
          </mesh>
        </group>
      );
    case "magnifier":
      return (
        <group rotation={[0, 0, -0.6]}>
          <mesh position={[0, 0.07, 0]}>
            <torusGeometry args={[0.11, 0.025, 10, 24]} />
            {mat}
          </mesh>
          <mesh position={[0, -0.13, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
            {mat}
          </mesh>
        </group>
      );
    default:
      return (
        <group>
          {[0.78, -0.78].map((r) => (
            <mesh key={r} rotation={[0, 0, r]}>
              <boxGeometry args={[0.28, 0.035, 0.035]} />
              {mat}
            </mesh>
          ))}
        </group>
      );
  }
}

interface ChestProps {
  px: number;
  pz: number;
  tile: ArenaTile;
  peeked?: ArenaItem;
  canAct: boolean;
  peekMode: boolean;
  onSelect: () => void;
}

function Chest({ px, pz, tile, peeked, canAct, peekMode, onSelect }: ChestProps) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const loot = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  const interactive = canAct && !tile.revealed;
  const hot = hover && interactive;
  const seed = px * 3.1 + pz * 1.7;
  const shown = tile.revealed ? tile.item : undefined;
  const activeItem = shown ?? (!tile.revealed ? peeked : undefined);
  const spinStartRef = useRef<number | null>(null);
  const pendingSpinRef = useRef(false);
  const prevItemRef = useRef<ArenaItem | undefined>(undefined);

  useEffect(() => {
    if (!interactive) setHover(false);
  }, [interactive]);

  useEffect(() => {
    if (activeItem && activeItem !== prevItemRef.current) {
      pendingSpinRef.current = true;
    }
    prevItemRef.current = activeItem;
  }, [activeItem]);

  useEffect(() => {
    if (!hot) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hot]);

  useFrame((state, dt) => {
    if (root.current) root.current.position.y = damp(root.current.position.y, hot ? 0.14 : 0, 12, dt);
    if (lid.current) {
      const target = tile.revealed ? -1.75 : hot ? -0.3 : 0;
      lid.current.rotation.x = damp(lid.current.rotation.x, target, 9, dt);
    }
    if (loot.current) {
      const t = state.clock.elapsedTime;
      if (pendingSpinRef.current) {
        spinStartRef.current = t;
        pendingSpinRef.current = false;
      }
      const spinStart = spinStartRef.current;
      const SPIN_DUR = 0.6;
      const elapsed = spinStart === null ? SPIN_DUR : t - spinStart;
      const p = Math.min(1, elapsed / SPIN_DUR);
      const eased = 1 - Math.pow(1 - p, 3);
      loot.current.rotation.y = eased * Math.PI * 2;
      loot.current.position.y = 0.5 + Math.sin(p * Math.PI) * 0.15;
      const targetScale = 1.35 * THREE.MathUtils.lerp(0.3, 1, Math.min(1, p * 1.5));
      loot.current.scale.setScalar(p >= 1 ? 1.35 : targetScale);
    }
  });

  const lockColor = peeked ? "#3d8bd9" : hot ? (peekMode ? "#3d8bd9" : "#ffe08a") : interactive ? "#d9a441" : "#5a4520";
  const lockGlow = peeked ? 0.7 : hot ? 0.9 : interactive ? 0.3 : 0;

  return (
    <group position={[px, 0, pz]}>
      <group
        ref={root}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHover(true);
        }}
        onPointerOut={() => setHover(false)}
        onClick={(e) => {
          e.stopPropagation();
          if (interactive) onSelect();
        }}
      >
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.72, 0.32, 0.5]} />
          <meshStandardMaterial color={tile.revealed ? "#120c08" : "#22150c"} roughness={0.8} metalness={0.1} />
        </mesh>
        {[-0.24, 0.24].map((bx) => (
          <mesh key={bx} position={[bx, 0.16, 0]}>
            <boxGeometry args={[0.07, 0.335, 0.515]} />
            <meshStandardMaterial color="#7a5f2c" roughness={0.45} metalness={0.8} />
          </mesh>
        ))}
        <group ref={lid} position={[0, 0.32, -0.25]}>
          <mesh position={[0, 0.07, 0.25]} castShadow>
            <boxGeometry args={[0.74, 0.14, 0.52]} />
            <meshStandardMaterial color={tile.revealed ? "#17100a" : "#2a1a0f"} roughness={0.75} metalness={0.1} />
          </mesh>
          {[-0.24, 0.24].map((bx) => (
            <mesh key={bx} position={[bx, 0.07, 0.25]}>
              <boxGeometry args={[0.07, 0.155, 0.535]} />
              <meshStandardMaterial color="#7a5f2c" roughness={0.45} metalness={0.8} />
            </mesh>
          ))}
          <mesh position={[0, 0.02, 0.515]}>
            <boxGeometry args={[0.12, 0.14, 0.03]} />
            <meshStandardMaterial color={lockColor} emissive={lockColor} emissiveIntensity={lockGlow} metalness={0.6} roughness={0.3} />
          </mesh>
        </group>
        {tile.revealed && (
          <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.6, 0.4]} />
            <meshBasicMaterial color="#050302" />
          </mesh>
        )}
      </group>

      {shown && (
        <group ref={loot} position={[0, 0.66, 0]} scale={0.01}>
          <ItemModel item={shown} />
        </group>
      )}
      {!tile.revealed && peeked && (
        <group ref={loot} position={[0, 0.66, 0]} scale={0.01}>
          <ItemModel item={peeked} ghost />
        </group>
      )}
    </group>
  );
}

export function LifeCells({ lives, max, z, color }: { lives: number; max: number; z: number; color: string }) {
  return (
    <group position={[0, 0, z]}>
      {Array.from({ length: max }).map((_, i) => {
        const alive = i < lives;
        return (
          <group key={i} position={[(i - (max - 1) / 2) * 0.42, 0, 0]}>
            <mesh position={[0, 0.03, 0]}>
              <cylinderGeometry args={[0.15, 0.17, 0.06, 20]} />
              <meshStandardMaterial color="#1b1e24" metalness={0.9} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0.16, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.09, 0.22, 16]} />
              <meshStandardMaterial
                color={alive ? color : "#15171b"}
                emissive={alive ? color : "#000000"}
                emissiveIntensity={alive ? 0.6 : 0}
                roughness={0.25}
                metalness={0.2}
              />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

export function Dealer({ active, present }: { active: boolean; present: boolean }) {
  const body = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const eyeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#110000", emissive: "#ff1a2e", emissiveIntensity: 2.2 }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (body.current) {
      body.current.position.y = Math.sin(t * 1.3) * 0.035;
      body.current.rotation.x = damp(body.current.rotation.x, active ? 0.18 : 0.02, 3, dt);
      body.current.visible = present;
    }
    if (head.current) {
      head.current.rotation.y = Math.sin(t * 0.5) * 0.22 + state.pointer.x * 0.25;
      head.current.rotation.z = Math.sin(t * 0.8) * 0.05;
    }
    const pulse = active ? 4.8 + Math.sin(t * 9) * 1.6 : 2.0;
    eyeMat.emissiveIntensity = damp(eyeMat.emissiveIntensity, pulse, 6, dt);
    eyeMat.emissive.set(active ? "#ff1a2e" : "#ff3344");
  });

  const cloth = <meshStandardMaterial color="#0c0d11" roughness={0.92} />;
  const skin = <meshStandardMaterial color="#c9c2b4" roughness={0.55} />;

  return (
    <group position={[0, 0, -5.3]}>
      <group ref={body}>
        <mesh position={[0, 0.55, 0]} castShadow>
          <boxGeometry args={[2.1, 1.9, 0.9]} />
          {cloth}
        </mesh>
        <mesh position={[0, 1.45, 0.05]} castShadow>
          <boxGeometry args={[2.7, 0.5, 1]} />
          {cloth}
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 1.3, 0.75, 0.55]} rotation={[0.75, 0, s * -0.12]} castShadow>
              <boxGeometry args={[0.42, 1.5, 0.42]} />
              {cloth}
            </mesh>
            <mesh position={[s * 1.22, 0.12, 1.12]} castShadow>
              <boxGeometry args={[0.46, 0.2, 0.6]} />
              {skin}
            </mesh>
          </group>
        ))}
        <group ref={head} position={[0, 2.25, 0.2]}>
          <mesh castShadow>
            <boxGeometry args={[0.95, 1.05, 0.85]} />
            <meshStandardMaterial color="#6b6560" roughness={0.95} metalness={0} />
          </mesh>
          {[-0.22, 0.22].map((ex) => (
            <mesh key={ex} position={[ex, 0.14, 0.43]} material={eyeMat}>
              <sphereGeometry args={[0.1, 16, 16]} />
            </mesh>
          ))}
          {Array.from({ length: 7 }).map((_, i) => (
            <mesh key={i} position={[(i - 3) * 0.105, -0.26 + (i % 2) * 0.02, 0.43]}>
              <boxGeometry args={[0.08, 0.15, 0.03]} />
              <meshStandardMaterial color="#b0a898" emissive="#b0a898" emissiveIntensity={0.05} />
            </mesh>
          ))}
          {/* Hat Brim */}
          <mesh position={[0, 0.68, 0]}>
            <boxGeometry args={[1.35, 0.1, 1.25]} />
            <meshStandardMaterial color="#060709" roughness={1} metalness={0} />
          </mesh>
          {/* Hat Ribbon */}
          <mesh position={[0, 0.78, 0]}>
            <boxGeometry args={[0.85, 0.1, 0.79]} />
            <meshStandardMaterial color="#5a1018" roughness={0.95} metalness={0} />
          </mesh>
          {/* Hat Crown */}
          <mesh position={[0, 1.06, 0]}>
            <boxGeometry args={[0.82, 0.66, 0.76]} />
            <meshStandardMaterial color="#060709" roughness={1} metalness={0} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export function PlayerHands({ active, visible }: { active: boolean; visible: boolean }) {
  const rig = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    if (rig.current) {
      rig.current.visible = visible;
      rig.current.position.y = Math.sin(t * 1.1) * 0.02;
    }
    if (right.current) {
      right.current.position.x = damp(right.current.position.x, 3.05 + (active ? state.pointer.x * 0.4 : 0), 5, dt);
      right.current.position.y = damp(right.current.position.y, active ? 0.3 + Math.sin(t * 3) * 0.03 : 0.1, 5, dt);
      right.current.position.z = damp(right.current.position.z, active ? 3.8 - state.pointer.y * 0.4 : 4.15, 5, dt);
    }
  });

  const arm = (side: number) => (
    <>
      <mesh castShadow>
        <boxGeometry args={[0.5, 0.2, 0.62]} />
        <meshStandardMaterial color="#d9b08c" roughness={0.6} />
      </mesh>
      <mesh position={[side * 0.31, 0, -0.08]} rotation={[0, side * -0.5, 0]} castShadow>
        <boxGeometry args={[0.14, 0.16, 0.34]} />
        <meshStandardMaterial color="#d9b08c" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.42]}>
        <boxGeometry args={[0.56, 0.26, 0.16]} />
        <meshStandardMaterial color="#b8893b" roughness={0.4} metalness={0.8} />
      </mesh>
      <mesh position={[side * 0.25, -0.22, 1.75]} rotation={[0.14, side * 0.16, 0]} castShadow>
        <boxGeometry args={[0.58, 0.46, 2.6]} />
        <meshStandardMaterial color="#14202b" roughness={0.85} />
      </mesh>
    </>
  );

  return (
    <group ref={rig}>
      <group position={[-3.05, 0.1, 4.15]}>{arm(-1)}</group>
      <group ref={right} position={[3.05, 0.1, 4.15]}>
        {arm(1)}
      </group>
    </group>
  );
}

export function Room() {
  const bronze = <meshStandardMaterial color="#9a7432" roughness={0.4} metalness={0.85} />;
  return (
    <group>
      <mesh position={[0, -0.3, 0]} receiveShadow castShadow>
        <boxGeometry args={[7.9, 0.6, 9.5]} />
        <meshStandardMaterial color="#1d1813" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.4, 9]} />
        <meshStandardMaterial color="#17191c" roughness={0.95} />
      </mesh>
      {[-4.6, 4.6].map((z) => (
        <mesh key={z} position={[0, 0.02, z]}>
          <boxGeometry args={[7.9, 0.06, 0.12]} />
          {bronze}
        </mesh>
      ))}
      {[-3.85, 3.85].map((x) => (
        <mesh key={x} position={[x, 0.02, 0]}>
          <boxGeometry args={[0.12, 0.06, 9.3]} />
          {bronze}
        </mesh>
      ))}
      <mesh position={[0, -1.9, 0]}>
        <boxGeometry args={[2.4, 2.7, 2.8]} />
        <meshStandardMaterial color="#15110d" roughness={0.8} />
      </mesh>

    </group>
  );
}

export function CameraRig({ shakeKey, idle }: { shakeKey: number; idle: boolean }) {
  const { camera, size } = useThree();
  const shake = useRef(0);
  const mounted = useRef(false);
  const target = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    shake.current = 1;
  }, [shakeKey]);

  useFrame((state, dt) => {
    const aspect = size.width / size.height;
    const fit = Math.min(2.6, aspect < 1.25 ? 1.25 / aspect : 1);
    const t = state.clock.elapsedTime;

    if (idle) {
      const a = Math.sin(t * 0.18) * 0.55;
      target.set(Math.sin(a) * 11 * fit, 5.2 * fit, Math.cos(a) * 10.5 * fit);
    } else {
      target.set(state.pointer.x * 0.45, 11 * fit + state.pointer.y * 0.25, 10.9 * fit);
    }

    camera.position.lerp(target, 1 - Math.exp(-dt * 2.5));
    shake.current = Math.max(0, shake.current - dt * 2.4);
    const s = shake.current * shake.current * 0.3;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s;
    camera.lookAt(0, idle ? 0.9 : 0.55, -0.55);
  });

  return null;
}

function Scene(props: DuelArena3DProps) {
  const { gridSize, tiles, peeked, canAct, peekMode, onTile, myLives, oppLives, maxLives, hasOpponent, opponentTurn, shakeKey, idle } = props;
  const n = gridSize || 6;

  const grid = useMemo<ArenaTile[]>(() => {
    if (tiles.length > 0) return tiles;
    return Array.from({ length: n * n }).map((_, i) => ({ x: i % n, y: Math.floor(i / n), revealed: false }));
  }, [tiles, n]);

  return (
    <>
      <color attach="background" args={["#0b0a08"]} />
      <fog attach="fog" args={["#0b0a08", 16, 36]} />
      <ambientLight intensity={0.55} color="#d8c7a8" />
      <hemisphereLight args={["#6b7280", "#1a120a", 0.5]} />
      <pointLight position={[-7, 3, 4]} intensity={30} color="#ffcf99" distance={18} />
      <pointLight position={[7, 3, -4]} intensity={30} color="#ffcf99" distance={18} />
      <pointLight position={[0, 3.2, -6.4]} intensity={opponentTurn ? 28 : 14} color={opponentTurn ? "#c0392b" : "#ff8866"} distance={9} />
      <pointLight position={[0, 2.8, -3.8]} intensity={16} color="#ffe2b8" distance={7} />
      <pointLight position={[0, 4.2, -5.8]} intensity={22} color="#ffcf99" distance={8} />

      <CameraRig shakeKey={shakeKey} idle={idle} />
      <Backdrop />
      <CeilingRig aimZ={0} />
      <Room />
      <mesh position={[5.4, -1.75, -3.8]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 3.5, 1.5]} />
        <meshStandardMaterial color="#2a1d14" roughness={0.8} />
      </mesh>
      <Machine position={[5.4, 0, -3.8]} rotation={-0.5} />
      <Dealer active={opponentTurn} present={hasOpponent || idle} />
      <PlayerHands active={canAct} visible={!idle} />

      <LifeCells lives={myLives} max={maxLives} z={4.05} color="#3fae5a" />
      <LifeCells lives={oppLives} max={maxLives} z={-4.05} color="#c0392b" />

      {grid.map((tile) => (
        <Chest
          key={`${tile.x}-${tile.y}`}
          px={(tile.x - (n - 1) / 2) * SPACING}
          pz={(tile.y - (n - 1) / 2) * ROW_SPACING}
          tile={tile}
          peeked={peeked[`${tile.x}-${tile.y}`]}
          canAct={canAct}
          peekMode={peekMode}
          onSelect={() => onTile(tile.x, tile.y, tile.revealed)}
        />
      ))}

      <EffectComposer>
        <Bloom intensity={0.25} luminanceThreshold={0.85} luminanceSmoothing={0.2} mipmapBlur />
        <Vignette eskil={false} offset={0.3} darkness={0.7} />
      </EffectComposer>
    </>
  );
}

export default function DuelArena3D(props: DuelArena3DProps) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 42, position: [0, 9.4, 8.6], near: 0.1, far: 60 }} gl={{ antialias: true }}>
      <Scene {...props} />
    </Canvas>
  );
}
