import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/cannon';
import { Stars } from '@react-three/drei';
import { Player } from './Player';
import { TrackManager } from './TrackManager';
import { useGameStore } from '../store';

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

            <Physics
                gravity={[0, -25, 0]}
                defaultContactMaterial={{ friction: 0.01, restitution: 0.1 }}
            >
                <Player />
                <TrackManager />
            </Physics>

            <Stars
                radius={150}
                depth={50}
                count={7000}
                factor={4}
                saturation={0}
                fade
                speed={1.5}
            />
        </Canvas>
    );
};
