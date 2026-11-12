"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, BrightnessContrast, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { damp } from "@/components/game/DuelArena3D";
import { Backdrop, CeilingRig, Machine } from "@/components/game/StageSet";

export type SoloOutcome = "treasure" | "trap" | "empty";

export interface SoloTile {
  x: number;
  y: number;
  hasChest: boolean;
  outcome?: SoloOutcome;
}

interface SoloArena3DProps {
  gridSize: number;
  tiles: SoloTile[];
  canAct: boolean;
  onTile: (x: number, y: number) => void;
  shakeKey: number;
  idle: boolean;
}

const BOARD_W = 6.8;
const BOARD_D = 6.9;
const SPIN_DUR = 0.65;

const GOLD = "#d9a441";
const FOV = 50;

function useOneShot(trigger: unknown) {
  const start = useRef<number | null>(null);
  const pending = useRef(false);
  const prev = useRef<unknown>(undefined);

  useEffect(() => {
    if (trigger && trigger !== prev.current) pending.current = true;
    prev.current = trigger;
  }, [trigger]);

  return (t: number) => {
    if (pending.current) {
      start.current = t;
      pending.current = false;
    }
    if (start.current === null) return 1;
    return Math.min(1, (t - start.current) / SPIN_DUR);
  };
}

function TreasureModel() {
  const gold = <meshStandardMaterial color="#e2b04a" emissive="#b07a1c" emissiveIntensity={0.55} metalness={0.95} roughness={0.25} />;
  return (
    <group>
      {[0, 0.05, 0.1].map((y, i) => (
        <mesh key={y} position={[i === 1 ? 0.03 : -0.02, y, i === 2 ? 0.02 : 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.04, 20]} />
          {gold}
        </mesh>
      ))}
      <mesh position={[0, 0.28, 0]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshStandardMaterial color="#e74c3c" emissive="#9b1c12" emissiveIntensity={0.6} metalness={0.3} roughness={0.15} />
      </mesh>
    </group>
  );
}

function EmptyMark() {
  return (
    <group>
      {[0.78, -0.78].map((r) => (
        <mesh key={r} rotation={[0, 0, r]}>
          <boxGeometry args={[0.3, 0.04, 0.04]} />
          <meshStandardMaterial color="#5b5e63" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

function Spikes({ progress }: { progress: React.MutableRefObject<number> }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.scale.y = Math.max(0.01, progress.current);
  });
  return (
    <group ref={group}>
      {[
        [-0.15, -0.13],
        [0.15, -0.13],
        [-0.15, 0.13],
        [0.15, 0.13],
        [0, 0],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, i === 4 ? 0.2 : 0.14, z]} castShadow>
          <coneGeometry args={[0.07, i === 4 ? 0.4 : 0.28, 6]} />
          <meshStandardMaterial color="#7d1f1a" emissive="#c0392b" emissiveIntensity={0.35} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

interface CellProps {
  px: number;
  pz: number;
  cell: number;
  tile: SoloTile;
  canAct: boolean;
  onSelect: () => void;
}

function Cell({ px, pz, cell, tile, canAct, onSelect }: CellProps) {
  const root = useRef<THREE.Group>(null);
  const lid = useRef<THREE.Group>(null);
  const loot = useRef<THREE.Group>(null);
  const seal = useRef<THREE.Group>(null);
  const spikeProgress = useRef(0);
  const [hover, setHover] = useState(false);
  const revealed = Boolean(tile.outcome);
  const interactive = canAct && !revealed;
  const hot = hover && interactive;
  const sc = cell / 1.15;
  const progress = useOneShot(tile.outcome);

  useEffect(() => {
    if (!interactive) setHover(false);
  }, [interactive]);

  useEffect(() => {
    if (!hot) return;
    document.body.style.cursor = "pointer";
    return () => {
      document.body.style.cursor = "auto";
    };
  }, [hot]);

  useFrame((state, dt) => {
    const p = progress(state.clock.elapsedTime);
    const eased = 1 - Math.pow(1 - p, 3);

    if (root.current) root.current.position.y = damp(root.current.position.y, hot ? 0.12 : 0, 12, dt);
    if (lid.current) lid.current.rotation.x = damp(lid.current.rotation.x, revealed ? -1.75 : hot ? -0.3 : 0, 9, dt);
    if (seal.current) {
      const sink = revealed ? -0.07 : 0;
      seal.current.position.y = damp(seal.current.position.y, sink, 8, dt);
    }
    if (loot.current && revealed) {
      loot.current.rotation.y = eased * Math.PI * 2;
      loot.current.position.y = (tile.hasChest ? 0.5 : 0.22) + Math.sin(p * Math.PI) * 0.18;
      loot.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1.3, Math.min(1, p * 1.5)));
    }
    spikeProgress.current = revealed && tile.outcome === "trap" ? Math.min(1, p * 2.2) : 0;
  });

  const lockColor = hot ? "#ffe08a" : interactive ? GOLD : "#5a4520";
  const lockGlow = hot ? 0.9 : interactive ? 0.3 : 0;
  const slabColor = !revealed ? "#24201b" : tile.outcome === "trap" ? "#2a1210" : tile.outcome === "treasure" ? "#2b2214" : "#141210";

  return (
    <group position={[px, 0, pz]}>
      <mesh position={[0, 0.03, 0]} receiveShadow>
        <boxGeometry args={[cell * 0.94, 0.06, cell * 0.94]} />
        <meshStandardMaterial color="#120f0c" roughness={0.9} />
      </mesh>

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
        <group ref={seal}>
          <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
            <boxGeometry args={[cell * 0.86, 0.07, cell * 0.86]} />
            <meshStandardMaterial color={slabColor} roughness={0.75} metalness={0.15} />
          </mesh>
          {!tile.hasChest && !revealed && (
            <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
              <ringGeometry args={[cell * 0.1, cell * 0.14, 4]} />
              <meshStandardMaterial color={lockColor} emissive={lockColor} emissiveIntensity={lockGlow} metalness={0.8} roughness={0.3} />
            </mesh>
          )}
        </group>

        {tile.hasChest && (
          <group position={[0, 0.12, 0]} scale={sc}>
            <mesh position={[0, 0.16, 0]} castShadow receiveShadow>
              <boxGeometry args={[0.72, 0.32, 0.5]} />
              <meshStandardMaterial color={revealed ? "#120c08" : "#22150c"} roughness={0.8} metalness={0.1} />
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
                <meshStandardMaterial color={revealed ? "#17100a" : "#2a1a0f"} roughness={0.75} metalness={0.1} />
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
            {revealed && (
              <mesh position={[0, 0.3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[0.6, 0.4]} />
                <meshBasicMaterial color="#050302" />
              </mesh>
            )}
          </group>
        )}
      </group>

      {revealed && tile.outcome !== "trap" && (
        <group ref={loot} scale={0.3}>
          <group scale={sc}>{tile.outcome === "treasure" ? <TreasureModel /> : <EmptyMark />}</group>
        </group>
      )}
      {revealed && tile.outcome === "trap" && (
        <group position={[0, tile.hasChest ? 0.45 : 0.12, 0]} scale={sc}>
          <Spikes progress={spikeProgress} />
        </group>
      )}
      {revealed && tile.outcome === "treasure" && (
        <pointLight position={[0, 0.9, 0]} intensity={6} color="#ffcf6b" distance={2.5} />
      )}
    </group>
  );
}

function SoloCamera({ side, shakeKey, idle }: { side: number; shakeKey: number; idle: boolean }) {
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
    const fit = Math.min(2.4, aspect < 1.3 ? 1.3 / aspect : 1);
    const k = THREE.MathUtils.clamp((side + 3) / 9.8, 0.72, 1) * fit;
    const t = state.clock.elapsedTime;

    if (idle) {
      const a = Math.sin(t * 0.16) * 0.55;
      target.set(Math.sin(a) * 11 * k, 6.2 * k, Math.cos(a) * 10.5 * k);
    } else {
      target.set(state.pointer.x * 0.4, 7.4 * k + state.pointer.y * 0.2, 7.6 * k);
    }

    camera.position.lerp(target, 1 - Math.exp(-dt * 2.5));
    shake.current = Math.max(0, shake.current - dt * 2.4);
    const s = shake.current * shake.current * 0.3;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s;
    camera.lookAt(0, idle ? 1.2 : 0.2, BOARD_Z - 0.9);
  });

  return null;
}

function Board({ side }: { side: number }) {
  const frame = side + 0.5;
  const bronze = <meshStandardMaterial color="#9a7432" roughness={0.4} metalness={0.85} />;
  return (
    <group>
      <mesh position={[0, -0.2, 0]} receiveShadow castShadow>
        <boxGeometry args={[frame + 0.3, 0.4, frame + 0.3]} />
        <meshStandardMaterial color="#1d1813" roughness={0.7} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[frame, frame]} />
        <meshStandardMaterial color="#17191c" roughness={0.95} />
      </mesh>
      {[-1, 1].map((sgn) => (
        <group key={sgn}>
          <mesh position={[0, 0.03, (sgn * (frame + 0.15)) / 2]} castShadow>
            <boxGeometry args={[frame + 0.3, 0.08, 0.15]} />
            {bronze}
          </mesh>
          <mesh position={[(sgn * (frame + 0.15)) / 2, 0.03, 0]} castShadow>
            <boxGeometry args={[0.15, 0.08, frame + 0.3]} />
            {bronze}
          </mesh>
        </group>
      ))}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([cx, cz]) => (
        <mesh key={`${cx}${cz}`} position={[(cx * (frame + 0.15)) / 2, 0.08, (cz * (frame + 0.15)) / 2]}>
          <boxGeometry args={[0.32, 0.12, 0.32]} />
          <meshStandardMaterial color="#c9973a" roughness={0.35} metalness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

const BOARD_Z = -0.6;
const TABLE_W = 13;
const TABLE_D = 11.5;
const TABLE_Z = -0.4;

function Line({ w, d, x = 0, z = 0 }: { w: number; d: number; x?: number; z?: number }) {
  return (
    <mesh position={[x, 0.022, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#d9d3c1" roughness={0.9} transparent opacity={0.75} />
    </mesh>
  );
}

function Table() {
  const fw = TABLE_W - 0.9;
  const fd = TABLE_D - 0.9;
  const inset = 0.45;
  const lw = 0.06;
  const near = TABLE_Z + fd / 2 - inset;
  const wear = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        x: Math.sin(i * 12.9898) * fw * 0.42,
        z: TABLE_Z + Math.cos(i * 78.233) * fd * 0.42,
        r: 0.5 + ((i * 37) % 10) / 9,
        dark: i % 2 === 0,
      })),
    [fw, fd]
  );

  return (
    <group>
      <mesh position={[0, -0.3, TABLE_Z]} receiveShadow castShadow>
        <boxGeometry args={[TABLE_W, 0.6, TABLE_D]} />
        <meshStandardMaterial color="#2a1d14" roughness={0.75} />
      </mesh>
      <mesh position={[0, 0.003, TABLE_Z]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[fw, fd]} />
        <meshStandardMaterial color="#45573a" roughness={1} />
      </mesh>
      {wear.map((w, i) => (
        <mesh key={i} position={[w.x, 0.012, w.z]} rotation={[-Math.PI / 2, 0, i]}>
          <circleGeometry args={[w.r, 10]} />
          <meshStandardMaterial color={w.dark ? "#33402b" : "#5a6a45"} roughness={1} transparent opacity={0.45} />
        </mesh>
      ))}

      <Line w={fw - inset * 2} d={lw} z={TABLE_Z - fd / 2 + inset} />
      <Line w={fw - inset * 2} d={lw} z={near} />
      <Line w={lw} d={fd - inset * 2} x={-fw / 2 + inset} z={TABLE_Z} />
      <Line w={lw} d={fd - inset * 2} x={fw / 2 - inset} z={TABLE_Z} />
      <Line w={fw - inset * 2} d={lw} z={BOARD_Z} />
      <mesh position={[0, 0.022, BOARD_Z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.75, 4.82, 64]} />
        <meshStandardMaterial color="#d9d3c1" roughness={0.9} transparent opacity={0.75} />
      </mesh>
      <Line w={4.4} d={lw} z={near - 1.1} />
      <Line w={lw} d={1.1} x={-2.2} z={near - 0.55} />
      <Line w={lw} d={1.1} x={2.2} z={near - 0.55} />

      <group position={[-4.6, 0.035, near - 1.3]} rotation={[-Math.PI / 2, 0, 0.18]}>
        <mesh receiveShadow>
          <planeGeometry args={[1.05, 1.4]} />
          <meshStandardMaterial color="#e6dfcb" roughness={0.95} />
        </mesh>
        {[0.45, 0.3, 0.18, 0.06, -0.06, -0.18, -0.42].map((py, i) => (
          <mesh key={py} position={[i === 0 ? 0 : -0.05, py, 0.006]}>
            <planeGeometry args={[i === 0 ? 0.6 : 0.75, i === 0 ? 0.07 : 0.035]} />
            <meshBasicMaterial color="#3b3530" />
          </mesh>
        ))}
      </group>

      <Machine position={[5.15, 0, TABLE_Z - 3.2]} rotation={-0.35} />
    </group>
  );
}

function Scene({ gridSize, tiles, canAct, onTile, shakeKey, idle }: SoloArena3DProps) {
  const n = Math.max(2, gridSize || 6);
  const cell = Math.min(BOARD_W / n, BOARD_D / n, 1.15);
  const side = n * cell;

  const grid = useMemo<SoloTile[]>(() => {
    if (tiles.length > 0) return tiles;
    return Array.from({ length: n * n }).map((_, i) => ({ x: i % n, y: Math.floor(i / n), hasChest: false }));
  }, [tiles, n]);

  return (
    <>
      <color attach="background" args={["#070605"]} />
      <fog attach="fog" args={["#070605", 14, 30]} />
      <ambientLight intensity={0.35} color="#d8c7a8" />
      <hemisphereLight args={["#4a4f5a", "#140e0a", 0.25]} />
      <pointLight position={[0, 5, 7]} intensity={14} color="#ffe2c4" distance={14} />

      <SoloCamera side={side} shakeKey={shakeKey} idle={idle} />
      <Backdrop />
      <CeilingRig aimZ={BOARD_Z} />
      <Table />

      <group position={[0, 0.06, BOARD_Z]}>
        <Board side={side} />
        {grid.map((tile) => (
          <Cell
            key={`${tile.x}-${tile.y}`}
            px={(tile.x - (n - 1) / 2) * cell}
            pz={(tile.y - (n - 1) / 2) * cell}
            cell={cell}
            tile={tile}
            canAct={canAct}
            onSelect={() => onTile(tile.x, tile.y)}
          />
        ))}
      </group>

      <EffectComposer>
        <Bloom intensity={0.35} luminanceThreshold={0.8} luminanceSmoothing={0.2} mipmapBlur />
        <BrightnessContrast contrast={0.08} />
        <Vignette eskil={false} offset={0.3} darkness={0.6} />
      </EffectComposer>
    </>
  );
}

export default function SoloArena3D(props: SoloArena3DProps) {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: FOV, position: [0, 7.4, 7.6], near: 0.1, far: 80 }} gl={{ antialias: true }}>
      <Scene {...props} />
    </Canvas>
  );
}
