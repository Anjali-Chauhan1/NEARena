"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const CEIL_Y = 6.6;

export function Machine({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  const shell = <meshStandardMaterial color="#b8b2a2" roughness={0.6} metalness={0.25} />;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.9, 1.1]} />
        {shell}
      </mesh>
      <mesh position={[0, 0.5, 0.56]}>
        <boxGeometry args={[1.35, 0.6, 0.02]} />
        <meshStandardMaterial color="#2a2a28" roughness={0.6} />
      </mesh>
      {[-0.4, 0, 0.4].map((dx) => (
        <mesh key={dx} position={[dx, 0.55, 0.59]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.06, 16]} />
          <meshStandardMaterial color="#d6d0bf" roughness={0.4} metalness={0.4} />
        </mesh>
      ))}
      <mesh position={[0.55, 0.32, 0.58]}>
        <boxGeometry args={[0.07, 0.07, 0.02]} />
        <meshBasicMaterial color="#ff3b30" />
      </mesh>
      <mesh position={[0.4, 0.32, 0.58]}>
        <boxGeometry args={[0.07, 0.07, 0.02]} />
        <meshBasicMaterial color="#3fae5a" />
      </mesh>
      <mesh position={[-0.2, 1.05, -0.1]} castShadow>
        <boxGeometry args={[0.9, 0.3, 0.7]} />
        {shell}
      </mesh>
      <mesh position={[0.45, 1.05, 0.15]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 8]} />
        <meshStandardMaterial color="#1c1c1c" />
      </mesh>
    </group>
  );
}

export function Cable({ points }: { points: [number, number, number][] }) {
  const geometry = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
    return new THREE.TubeGeometry(curve, 40, 0.035, 6, false);
  }, [points]);
  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial color="#1e1c1a" roughness={0.7} />
    </mesh>
  );
}

export function StageLight({ position, aim }: { position: [number, number, number]; aim: [number, number, number] }) {
  const head = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const aimVec = useMemo(() => new THREE.Vector3(...aim), [aim]);
  // Emit from just in front of the lens so the housing never shadows its own light.
  const emitPos = useMemo(() => {
    const p = new THREE.Vector3(...position);
    return p.add(aimVec.clone().sub(p).normalize().multiplyScalar(0.8)).toArray() as [number, number, number];
  }, [position, aimVec]);

  useEffect(() => {
    target.position.copy(aimVec);
    target.updateMatrixWorld();
    head.current?.lookAt(aimVec);
  }, [aimVec, target]);


  return (
    <group>
      <primitive object={target} />
      <mesh position={[position[0], (position[1] + CEIL_Y - 0.4) / 2 + 0.25, position[2]]}>
        <cylinderGeometry args={[0.04, 0.04, CEIL_Y - 0.4 - position[1], 6]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.35} roughness={0.5} />
      </mesh>
      <group ref={head} position={position}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.42, 1.1, 20]} />
          <meshStandardMaterial color="#3a3a3e" metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, -0.62]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.42, 0.18, 16]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.35} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.56]}>
          <circleGeometry args={[0.44, 24]} />
          <meshBasicMaterial color="#fff4dc" />
        </mesh>
        {[-1, 1].map((sgn) => (
          <mesh key={sgn} position={[sgn * 0.62, 0, 0]}>
            <boxGeometry args={[0.06, 0.9, 0.12]} />
            <meshStandardMaterial color="#3a3a3a" metalness={0.35} roughness={0.5} />
          </mesh>
        ))}
      </group>
      <spotLight
        position={emitPos}
        target={target}
        color="#fff1d6"
        intensity={420}
        angle={0.62}
        penumbra={0.55}
        distance={24}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
    </group>
  );
}

export function CeilingRig({ aimZ }: { aimZ: number }) {
  const wood = <meshStandardMaterial color="#6b5545" roughness={0.85} />;
  const steel = <meshStandardMaterial color="#55504a" roughness={0.6} metalness={0.3} />;
  const crossZ = [-2.6, -5.4, -8.2, -11];
  const longX = [-6.5, -2.2, 2.2, 6.5];

  return (
    <group>
      <mesh position={[0, CEIL_Y + 0.4, -4]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#2a211c" roughness={1} />
      </mesh>
      <pointLight position={[0, CEIL_Y - 1.4, -4.5]} intensity={30} color="#ffd9b0" distance={11} />
      <pointLight position={[-6, CEIL_Y - 1.2, -7]} intensity={14} color="#ffd9b0" distance={9} />
      <pointLight position={[6, CEIL_Y - 1.2, -7]} intensity={14} color="#ffd9b0" distance={9} />
      {crossZ.map((z) => (
        <mesh key={z} position={[0, CEIL_Y, z]}>
          <boxGeometry args={[30, 0.4, 0.4]} />
          {wood}
        </mesh>
      ))}
      {longX.map((x) => (
        <mesh key={x} position={[x, CEIL_Y + 0.2, -6.8]}>
          <boxGeometry args={[0.3, 0.3, 10]} />
          {wood}
        </mesh>
      ))}
      {crossZ.slice(0, -1).map((z, i) => (
        <group key={z}>
          {[-4.3, 4.3].map((x) => (
            <mesh key={x} position={[x, CEIL_Y - 0.05, z - 1.4]} rotation={[0, (i % 2 ? 1 : -1) * 0.55, 0]}>
              <boxGeometry args={[0.12, 0.12, 3.2]} />
              {steel}
            </mesh>
          ))}
        </group>
      ))}

      <StageLight position={[-2.6, 4.7, -3.4]} aim={[-0.6, 0, aimZ]} />
      <StageLight position={[2.6, 4.7, -3.4]} aim={[0.6, 0, aimZ]} />

      <Cable points={[[-9, CEIL_Y - 0.2, -2.6], [-5.8, CEIL_Y - 1.5, -2.9], [-2.6, CEIL_Y - 0.25, -3.4]]} />
      <Cable points={[[9, CEIL_Y - 0.2, -2.6], [5.8, CEIL_Y - 1.5, -2.9], [2.6, CEIL_Y - 0.25, -3.4]]} />
      <Cable points={[[-2.6, CEIL_Y - 0.2, -3.4], [0, CEIL_Y - 1.2, -3.8], [2.6, CEIL_Y - 0.2, -3.4]]} />
      <Cable points={[[-12, CEIL_Y - 0.2, -5.4], [-4, CEIL_Y - 1.9, -5.6], [4, CEIL_Y - 1.6, -5.5], [12, CEIL_Y - 0.2, -5.4]]} />
      <Cable points={[[-10, CEIL_Y - 0.2, -8.2], [-1, CEIL_Y - 2.2, -8.4], [10, CEIL_Y - 0.2, -8.2]]} />
    </group>
  );
}

export function Backdrop() {
  return (
    <group>
      <mesh position={[0, 1, -13]}>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial color="#1c1714" roughness={1} />
      </mesh>
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} position={[sgn * 14, 1, -2]} rotation={[0, -sgn * Math.PI / 2, 0]}>
          <planeGeometry args={[30, 16]} />
          <meshStandardMaterial color="#17130f" roughness={1} />
        </mesh>
      ))}
      <mesh position={[0, -3.5, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#120f0c" roughness={0.9} />
      </mesh>
      <group position={[-7.5, 3.2, -12.9]}>
        <mesh>
          <boxGeometry args={[1.1, 0.4, 0.1]} />
          <meshBasicMaterial color="#8a1c14" />
        </mesh>
        <pointLight position={[0, 0, 0.8]} intensity={8} color="#ff3b2a" distance={7} />
      </group>
      {[-10, -9.2, -8.4].map((x, i) => (
        <mesh key={x} position={[x, -1.2 + i * 0.9, -9]}>
          <boxGeometry args={[0.7, 0.12, 2.2]} />
          <meshStandardMaterial color="#25211d" roughness={0.6} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
