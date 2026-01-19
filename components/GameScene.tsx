import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Player } from './Player';
import { TrackManager } from './TrackManager';
import { useGameStore } from '../store';
import * as THREE from 'three';

// Speed Particles - particles coming at the player, following player position
const SpeedParticles: React.FC = () => {
    const particlesRef = useRef<THREE.Points>(null);
    const particleCount = 500;
    const particleSpeed = 60; // Speed at which particles move towards player
    const spawnDistance = 50; // How far ahead to spawn particles
    
    const { positions, velocities } = useMemo(() => {
        const pos = new Float32Array(particleCount * 3);
        const vel = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Spawn particles immediately visible around the camera
            pos[i3] = (Math.random() - 0.5) * 100; // X spread
            pos[i3 + 1] = (Math.random() - 0.5) * 50; // Y spread
            pos[i3 + 2] = -(Math.random() * spawnDistance + 50); // Z (behind camera, but close enough to be visible immediately)
            
            // Velocity towards camera/screen (positive Z moves towards camera)
            vel[i3] = (Math.random() - 0.5) * 1; // Slight X drift
            vel[i3 + 1] = (Math.random() - 0.5) * 1; // Slight Y drift
            vel[i3 + 2] = particleSpeed + Math.random() * 15; // Move towards screen (positive Z)
        }
        
        return { positions: pos, velocities: vel };
    }, []);

    const geometry = useMemo(() => {
        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return geom;
    }, [positions]);

    useFrame((state, delta) => {
        if (!particlesRef.current) return;
        
        // Get camera position (which follows the player)
        const camPos = state.camera.position;
        const posArray = particlesRef.current.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Update positions based on velocity (relative to camera)
            posArray[i3] += velocities[i3] * delta;
            posArray[i3 + 1] += velocities[i3 + 1] * delta;
            posArray[i3 + 2] += velocities[i3 + 2] * delta;
            
            // Reset particles that have passed the camera (moved in front of camera)
            if (posArray[i3 + 2] > 50) {
                posArray[i3] = (Math.random() - 0.5) * 100;
                posArray[i3 + 1] = (Math.random() - 0.5) * 50;
                posArray[i3 + 2] = -(spawnDistance + 50); // Spawn behind again
            }
        }
        
        // Position the particle system to follow the camera (player)
        particlesRef.current.position.set(camPos.x, camPos.y, camPos.z);
        
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef} geometry={geometry} frustumCulled={false}>
            <pointsMaterial 
                size={0.1} 
                color="#ffffff" 
                sizeAttenuation={true}
                transparent={true}
                opacity={0.9}
                fog={false}
            />
        </points>
    );
};

export const GameScene: React.FC = () => {
    const { getCurrentBackgroundSkin } = useGameStore();
    const backgroundSkin = getCurrentBackgroundSkin();

    return (
        <Canvas shadows camera={{ position: [0, 5, 10], fov: 60 }}>
            <color attach="background" args={[backgroundSkin.backgroundColor]} />
            {/* Maximum visibility: Fog starts late and ends very far away */}
            <fog attach="fog" args={[backgroundSkin.fogColor, 100, 600]} />

            <ambientLight intensity={0.8} />
            <pointLight position={[20, 30, 10]} intensity={1.5} />
            <directionalLight
                position={[0, 20, 10]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            <SpeedParticles />

            <Physics
                gravity={[0, -25, 0]}
                defaultContactMaterial={{ friction: 0.01, restitution: 0.1 }}
            >
                <Player />
                <TrackManager />
            </Physics>
        </Canvas>
    );
};
