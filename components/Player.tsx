
/// <reference lib="dom" />
import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSphere } from '@react-three/cannon';
import { Trail } from '@react-three/drei';
import * as THREE from 'three';
import { Vector3, Mesh, Group, Euler } from 'three';
import { useGameStore } from '../store';
import { GameState } from '../types';

const MAX_LATERAL_SPEED = 40; // Increased from 24
const JUMP_FORCE = 24;
const LATERAL_FORCE = 80; // Increased from 30
const TURN_TORQUE = 50;   // Increased from 20

export const Player: React.FC = () => {
    const { gameState } = useGameStore();
    const canJump = useRef(false);

    // Physics body
    const [ref, api] = useSphere(() => ({
        mass: 1,
        position: [0, 5, 0],
        args: [0.6],
        material: { friction: 0.1, restitution: 0.05 },
        linearDamping: 0.1,
        angularDamping: 0.1,
        onCollide: () => {
            // Enable jumping when we touch the track
            canJump.current = true;
        }
    }));

    const visualRef = useRef<Group>(null);
    const ballMeshRef = useRef<Mesh>(null);
    const pos = useRef(new Vector3(0, 5, 0));
    const vel = useRef(new Vector3(0, 0, 0));
    const rollingRotation = useRef(new Euler(0, 0, 0));
    const { camera } = useThree();

    useEffect(() => {
        const unsubPos = api.position.subscribe((v) => pos.current.set(v[0], v[1], v[2]));
        const unsubVel = api.velocity.subscribe((v) => vel.current.set(v[0], v[1], v[2]));
        return () => {
            unsubPos();
            unsubVel();
        };
    }, [api.position, api.velocity]);

    useEffect(() => {
        if (gameState === GameState.PLAYING) {
            api.position.set(0, 5, 0);
            api.velocity.set(0, 0, 0);
            api.angularVelocity.set(0, 0, 0);
            rollingRotation.current.set(0, 0, 0);
            camera.position.set(0, 11.5, 13);
            canJump.current = false;
        }
    }, [gameState, api, camera]);

    const keysPressed = useRef<{ [key: string]: boolean }>({});
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => { keysPressed.current[e.code] = true; };
        const handleKeyUp = (e: KeyboardEvent) => { keysPressed.current[e.code] = false; };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, []);

    useFrame((state, delta) => {
        if (gameState !== GameState.PLAYING) return;

        // Standard downward/forward force
        api.applyForce([0, -28, -18], [0, 0, 0]);

        // Lateral Movement - Significantly amplified
        if (keysPressed.current['ArrowLeft'] || keysPressed.current['KeyA']) {
            api.applyTorque([0, 0, TURN_TORQUE]);
            api.applyForce([-LATERAL_FORCE, 0, 0], [0, 0, 0]);
        }
        if (keysPressed.current['ArrowRight'] || keysPressed.current['KeyD']) {
            api.applyTorque([0, 0, -TURN_TORQUE]);
            api.applyForce([LATERAL_FORCE, 0, 0], [0, 0, 0]);
        }

        // Jumping
        if (keysPressed.current['Space'] && canJump.current) {
            api.applyImpulse([0, JUMP_FORCE, 0], [0, 0, 0]);
            canJump.current = false; // Prevent double jumping in air
        }

        // Speed caps
        if (vel.current.x > MAX_LATERAL_SPEED) api.velocity.set(MAX_LATERAL_SPEED, vel.current.y, vel.current.z);
        if (vel.current.x < -MAX_LATERAL_SPEED) api.velocity.set(-MAX_LATERAL_SPEED, vel.current.y, vel.current.z);

        // Camera following logic
        const camOffset = new Vector3(0, 6.5, 13);
        const lookOffset = new Vector3(0, -4, -30);
        const targetCamPos = pos.current.clone().add(camOffset);
        camera.position.lerp(targetCamPos, 0.12);
        camera.lookAt(pos.current.clone().add(lookOffset));

        // Visual Animation
        if (visualRef.current) {
            visualRef.current.position.copy(pos.current);

            const speed = vel.current.length();
            const rollRate = speed * delta * 1.8;

            // Rolling forward (X-axis)
            rollingRotation.current.x -= rollRate;

            // Tilt when turning (Z-axis) - Adjusted multiplier for new speed ranges
            const targetTilt = -vel.current.x * 0.045;
            rollingRotation.current.z = THREE.MathUtils.lerp(rollingRotation.current.z, targetTilt, 0.15);

            if (ballMeshRef.current) {
                ballMeshRef.current.rotation.set(rollingRotation.current.x, 0, rollingRotation.current.z);

                // Subtle Squash and Stretch
                const stretch = 1 + (speed * 0.002);
                const squash = 1 / Math.sqrt(stretch);
                ballMeshRef.current.scale.set(squash, squash, stretch);
            }
        }

        // Score update
        const currentScore = Math.floor(Math.abs(pos.current.z));
        useGameStore.setState((state) => ({ score: Math.max(state.score, currentScore) }));
    });

    return (
        <>
            {/* Physics Debug / Hidden Body */}
            <mesh ref={ref as React.RefObject<Mesh>} name="player" visible={false}>
                <sphereGeometry args={[0.6]} />
            </mesh>

            <group ref={visualRef}>
                {/* Neon Trail - Preserved for speed effect */}
                <Trail
                    width={1.2}
                    length={8}
                    color={new THREE.Color('#00ff88')}
                    attenuation={(t) => t * t}
                >
                    {/* Main Ball Visuals */}
                    <group ref={ballMeshRef}>
                        {/* Core Dark Shell */}
                        <mesh castShadow>
                            <sphereGeometry args={[0.6, 32, 32]} />
                            <meshStandardMaterial
                                color="#050505"
                                roughness={0.1}
                                metalness={0.9}
                            />
                        </mesh>

                        {/* Glowing Grid Overlay - Essential for seeing the roll */}
                        <mesh>
                            <sphereGeometry args={[0.61, 32, 32]} />
                            <meshStandardMaterial
                                color="#00ff88"
                                emissive="#00ff88"
                                emissiveIntensity={5}
                                wireframe
                                transparent
                                opacity={0.8}
                            />
                        </mesh>

                        {/* Inner Power Core */}
                        <mesh>
                            <octahedronGeometry args={[0.35, 1]} />
                            <meshBasicMaterial color="#ffffff" />
                        </mesh>
                    </group>
                </Trail>

                {/* Ambient Glow / Halo - Subtle atmospheric glow, not a 'flame' */}
                <mesh scale={[1.2, 1.2, 1.2]}>
                    <sphereGeometry args={[0.6, 16, 16]} />
                    <meshStandardMaterial
                        color="#00ff88"
                        emissive="#00ff88"
                        emissiveIntensity={0.5}
                        transparent
                        opacity={0.05}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            </group>
        </>
    );
};
