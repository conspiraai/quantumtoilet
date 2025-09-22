import { Canvas, useFrame, extend } from '@react-three/fiber';
import { Suspense, useRef } from 'react';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import { useMemo } from 'react';
import { Color, Mesh } from 'three';
import wormholeFragment from './shaders/wormhole.frag?raw';
import { ToiletModel } from './ToiletModel';
import { useFlushStore } from '../state/flushStore';

const WormholeMaterial = shaderMaterial(
  {
    uTime: 0,
    uColorA: new Color('#6CE7FF'),
    uColorB: new Color('#9D7CFF')
  },
  /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,
  wormholeFragment
);
extend({ WormholeMaterial });

type WormholeMesh = Mesh & { material: typeof WormholeMaterial };

const Wormhole = () => {
  const mesh = useRef<WormholeMesh>(null!);
  const latest = useFlushStore((s) => s.timeline[0]);
  const colors = useMemo(() => {
    const mapping: Record<string, [string, string]> = {
      cosmic_violet: ['#5c00ff', '#ff8cff'],
      toxic_green: ['#8aff6c', '#00ffb2'],
      solar_flare: ['#ff9a45', '#ffe66c'],
      deep_space: ['#001633', '#003366'],
      pastel_nebula: ['#9d7cff', '#6ce7ff']
    };
    return latest ? mapping[latest.traits.wormhole] ?? mapping.pastel_nebula : mapping.pastel_nebula;
  }, [latest]);

  useFrame((state, delta) => {
    if (!mesh.current) return;
    mesh.current.material.uniforms.uTime.value += delta;
    mesh.current.material.uniforms.uColorA.value.set(colors[0]);
    mesh.current.material.uniforms.uColorB.value.set(colors[1]);
  });

  return (
    <mesh ref={mesh} rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
      <circleGeometry args={[1.2, 64]} />
      {/* @ts-expect-error custom material */}
      <wormholeMaterial attach="material" />
    </mesh>
  );
};

const SceneContent = () => {
  const reduceMotion = useFlushStore((s) => s.settings.reduceMotion);
  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 2]} intensity={1} />
      <Suspense fallback={null}>
        <ToiletModel />
        <Wormhole />
      </Suspense>
      {!reduceMotion && <OrbitControls enablePan={false} />}
    </>
  );
};

export const Scene = () => {
  if (!(window.WebGLRenderingContext && document.createElement('canvas').getContext('webgl'))) {
    return <div className="scene-fallback">WebGL not supported. View timeline below.</div>;
  }

  return (
    <div className="scene">
      <Canvas camera={{ position: [0, 1.2, 2.5], fov: 50 }}>
        <SceneContent />
      </Canvas>
    </div>
  );
};
