import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Mesh } from 'three';
import { useFlushStore } from '../state/flushStore';

const morphTargets = ['elongated', 'chunky', 'lowpoly', 'bevelled', 'rubbery'] as const;

export const ToiletModel = () => {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(new URL('../assets/toilet.glb', import.meta.url).href);
  const latest = useFlushStore((s) => s.timeline[0]);

  const morphIndex = useMemo(() => {
    if (!latest) return 0;
    const index = morphTargets.findIndex((name) => name === latest.traits.shape);
    return index === -1 ? 0 : index;
  }, [latest]);

  useEffect(() => {
    const materials: Record<string, string> = {
      chrome: '#d8f5ff',
      obsidian: '#1a1c2c',
      iridescent: '#b2a1ff',
      hologram: '#6ce7ff',
      porcelain: '#f5f5f5',
      glitch_metal: '#ff71c5'
    };
    const materialColor = latest ? materials[latest.traits.material] ?? '#ffffff' : '#ffffff';
    scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        if (mesh.morphTargetDictionary && mesh.morphTargetInfluences) {
          mesh.morphTargetInfluences.fill(0);
          mesh.morphTargetInfluences[morphIndex] = 1;
        }
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((mat) => {
            if ('color' in mat) {
              (mat as any).color.set(materialColor);
              (mat as any).metalness = 0.6;
              (mat as any).roughness = 0.2;
            }
          });
        } else if (mesh.material && 'color' in mesh.material) {
          (mesh.material as any).color.set(materialColor);
          (mesh.material as any).metalness = 0.6;
          (mesh.material as any).roughness = 0.2;
        }
      }
    });
  }, [scene, morphIndex, latest]);

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.2) * 0.3;
    }
  });

  return <primitive ref={group} object={scene} position={[0, 0, 0]} scale={1.2} />;
};

useGLTF.preload(new URL('../assets/toilet.glb', import.meta.url).href);
