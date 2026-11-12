"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Dealer } from "@/components/game/DuelArena3D";
import { CeilingRig } from "@/components/game/StageSet";

const bandMat = <meshStandardMaterial color="#8a6a2f" roughness={0.4} metalness={0.85} />;

function HeroChest({ position, rotation = 0, open = false }: { position: [number, number, number]; rotation?: number; open?: boolean }) {
  const loot = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (loot.current) loot.current.position.y = 0.62 + Math.sin(state.clock.elapsedTime * 1.4) * 0.04;
  });

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.4, 0.62]} />
        <meshStandardMaterial color="#2a1a0f" roughness={0.8} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 0.2, 0]}>
          <boxGeometry args={[0.08, 0.41, 0.64]} />
          {bandMat}
        </mesh>
      ))}
      <group position={[0, 0.4, -0.31]} rotation={[open ? -1.9 : 0, 0, 0]}>
        <mesh position={[0, 0.09, 0.31]} castShadow>
          <boxGeometry args={[0.92, 0.18, 0.64]} />
          <meshStandardMaterial color="#331f12" roughness={0.75} />
        </mesh>
        {[-0.3, 0.3].map((x) => (
          <mesh key={x} position={[x, 0.09, 0.31]}>
            <boxGeometry args={[0.08, 0.19, 0.66]} />
            {bandMat}
          </mesh>
        ))}
        <mesh position={[0, 0.02, 0.635]}>
          <boxGeometry args={[0.14, 0.16, 0.03]} />
          <meshStandardMaterial color="#d9a441" emissive="#d9a441" emissiveIntensity={0.3} metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      {open && (
        <>
          <mesh position={[0, 0.39, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.8, 0.52]} />
            <meshStandardMaterial color="#e2b04a" emissive="#c98a1c" emissiveIntensity={0.9} roughness={0.4} metalness={0.8} />
          </mesh>
          <group ref={loot}>
            <mesh rotation={[0, 0.6, 0]}>
              <octahedronGeometry args={[0.16, 0]} />
              <meshStandardMaterial color="#e74c3c" emissive="#9b1c12" emissiveIntensity={0.8} metalness={0.3} roughness={0.15} />
            </mesh>
          </group>
          <pointLight position={[0, 0.9, 0.2]} intensity={10} color="#ffc76b" distance={4} />
        </>
      )}
    </group>
  );
}

function Coins() {
  const coins = useMemo(
    () =>
      Array.from({ length: 14 }).map((_, i) => ({
        x: 0.9 + Math.sin(i * 12.9898) * 0.9,
        z: 0.35 + Math.cos(i * 78.233) * 0.45,
        y: 0.02 + (i % 3) * 0.035,
        r: i * 0.7,
      })),
    []
  );
  return (
    <group>
      {coins.map((c, i) => (
        <mesh key={i} position={[c.x, c.y, c.z]} rotation={[0.2 * (i % 2), c.r, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
          <meshStandardMaterial color="#e2b04a" emissive="#8a5a10" emissiveIntensity={0.35} metalness={0.95} roughness={0.25} />
        </mesh>
      ))}
    </group>
  );
}

function HeroCamera() {
  const { camera, size } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const look = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const aspect = size.width / size.height;
    const narrow = aspect < 1;
    const pull = narrow ? Math.min(1.9, 1.15 / aspect) : 1;
    target.set(
      (narrow ? 2.6 : 0.2) + state.pointer.x * 0.35,
      2.0 * pull + state.pointer.y * 0.15,
      9.2 * pull
    );
    look.set(narrow ? 2.6 : 1.15, narrow ? 1.6 : 1.45, -1.6);
    camera.position.lerp(target, 1 - Math.exp(-dt * 2));
    camera.lookAt(look);
  });

  return null;
}

function KeyLight() {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(2.6, 1, -2.4);
    return o;
  }, []);
  return (
    <>
      <primitive object={target} />
      <spotLight position={[-3, 7, 6]} target={target} color="#ffd9a0" intensity={260} angle={0.45} penumbra={0.8} distance={30} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} />
    </>
  );
}

function Scene() {
  return (
    <>
      <fog attach="fog" args={["#120c08", 11, 30]} />
      <ambientLight intensity={0.3} color="#e8cfa8" />
      <hemisphereLight args={["#ffcf8a", "#0a0706", 0.35]} />
      <KeyLight />
      <pointLight position={[2.8, 3.4, -6.2]} intensity={70} color="#ffae4a" distance={10} />
      <pointLight position={[6.5, 2, -3]} intensity={25} color="#7fa8d6" distance={9} />

      <HeroCamera />
      <group position={[2.2, 0, 0]}>
        <CeilingRig aimZ={-1.4} />
      </group>

      <group position={[2.6, -0.05, 2.75]}>
        <Dealer active present />
      </group>

      <mesh position={[2.4, -0.3, -0.7]} receiveShadow castShadow>
        <boxGeometry args={[7.5, 0.6, 3.6]} />
        <meshStandardMaterial color="#23170f" roughness={0.75} />
      </mesh>
      <mesh position={[2.4, 0.003, -0.7]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[7.1, 3.2]} />
        <meshStandardMaterial color="#3f4f33" roughness={1} />
      </mesh>

      <HeroChest position={[1.35, 0, -0.4]} rotation={0.25} open />
      <HeroChest position={[3.0, 0, 0.1]} rotation={-0.2} />
      <HeroChest position={[4.35, 0, -0.85]} rotation={-0.45} />
      <Coins />

      <mesh position={[0, -3.2, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#0c0907" roughness={0.95} />
      </mesh>

      <EffectComposer>
        <Bloom intensity={0.45} luminanceThreshold={0.75} luminanceSmoothing={0.25} mipmapBlur />
        <Vignette eskil={false} offset={0.25} darkness={0.6} />
      </EffectComposer>
    </>
  );
}

export default function HeroScene() {
  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 35, position: [0.2, 2, 9.2], near: 0.1, far: 80 }} gl={{ antialias: true, alpha: true }}>
      <Scene />
    </Canvas>
  );
}
