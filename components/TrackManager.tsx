import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { SegmentData, ObstacleData, CoinData, HeartData, GameState, SegmentType, GamePattern } from '../types';
import { useGameStore } from '../store';
import * as THREE from 'three';
import { Vector3, Euler, Mesh, Group } from 'three';

// -- Helper to transform local offset to world position based on segment rotation --
const getWorldPos = (local: Vector3, segPos: Vector3, segRot: Euler) => {
    const v = local.clone();
    v.applyEuler(segRot);
    v.add(segPos);
    return v;
};

// -- 3D Coin Visual Component --
const CoinVisual: React.FC<{
    worldPos: Vector3;
    coinId: string;
    collectedCoins: Set<string>;
}> = ({ worldPos, coinId, collectedCoins }) => {
    const groupRef = useRef<Group>(null);
    const startY = worldPos.y;
    const isCollected = collectedCoins.has(coinId);

    useFrame((state) => {
        if (groupRef.current && !isCollected) {
            // Spin around Y axis (vertical spin)
            groupRef.current.rotation.y += 0.08;
            // Bob up and down
            groupRef.current.position.y = startY + Math.sin(state.clock.elapsedTime * 3) * 0.3;
        }
    });

    if (isCollected) return null;

    return (
        <group ref={groupRef} position={[worldPos.x, worldPos.y, worldPos.z]}>
            {/* Main coin body - standing vertically (rotated 90 degrees on X) */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.8, 0.8, 0.12, 32]} />
                <meshStandardMaterial
                    color="#ffd700"
                    emissive="#ffaa00"
                    emissiveIntensity={2}
                    metalness={0.9}
                    roughness={0.1}
                />
            </mesh>
            {/* Inner ring detail */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.5, 0.08, 8, 32]} />
                <meshStandardMaterial
                    color="#ffcc00"
                    emissive="#ff8800"
                    emissiveIntensity={1.5}
                    metalness={0.8}
                    roughness={0.2}
                />
            </mesh>
            {/* Center dollar sign sphere */}
            <mesh>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial
                    color="#ffee00"
                    emissive="#ffaa00"
                    emissiveIntensity={3}
                />
            </mesh>
            {/* Glow effect */}
            <pointLight color="#ffd700" intensity={1} distance={5} />
        </group>
    );
};

// -- Heart Visual Component --
const HeartVisual: React.FC<{
    worldPos: Vector3;
    heartId: string;
    collectedHearts: Set<string>;
}> = ({ worldPos, heartId, collectedHearts }) => {
    const meshRef = useRef<Group>(null);
    const startY = worldPos.y;
    const isCollected = collectedHearts.has(heartId);

    useFrame((state) => {
        if (meshRef.current && !isCollected) {
            meshRef.current.rotation.y += 0.03;
            meshRef.current.position.y = startY + Math.sin(state.clock.elapsedTime * 2) * 0.3;
        }
    });

    if (isCollected) return null;

    return (
        <group ref={meshRef} position={[worldPos.x, worldPos.y, worldPos.z]}>
            <mesh position={[-0.25, 0.1, 0]}>
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshStandardMaterial
                    color="#ff0044"
                    emissive="#ff0000"
                    emissiveIntensity={3}
                />
            </mesh>
            <mesh position={[0.25, 0.1, 0]}>
                <sphereGeometry args={[0.35, 12, 12]} />
                <meshStandardMaterial
                    color="#ff0044"
                    emissive="#ff0000"
                    emissiveIntensity={3}
                />
            </mesh>
            <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
                <boxGeometry args={[0.5, 0.5, 0.35]} />
                <meshStandardMaterial
                    color="#ff0044"
                    emissive="#ff0000"
                    emissiveIntensity={3}
                />
            </mesh>
            <pointLight color="#ff0044" intensity={0.8} distance={5} />
        </group>
    );
};

// -- Obstacle Component --
const Obstacle: React.FC<{
    data: ObstacleData;
    segmentPos: Vector3;
    segmentRot: Euler;
}> = React.memo(({ data, segmentPos, segmentRot }) => {
    const meshRef = useRef<Mesh>(null);
    const glowMeshRef = useRef<Mesh>(null);
    const lightRef = useRef<THREE.PointLight>(null);
    const initialPos = useRef<Vector3 | null>(null);

    const worldPos = useMemo(() => {
        const pos = getWorldPos(new Vector3(...data.position), segmentPos, segmentRot);
        initialPos.current = pos.clone();
        return pos;
    }, [data.position, segmentPos, segmentRot]);

    const [ref, api] = useBox(() => ({
        type: 'Static',
        mass: 0,
        position: [worldPos.x, worldPos.y, worldPos.z],
        rotation: [segmentRot.x, segmentRot.y, segmentRot.z],
        args: data.size,
        onCollide: (e) => {
            if (e.body.name === 'player') {
                const { loseLife, setGameState } = useGameStore.getState();
                const isGameOver = loseLife();
                if (isGameOver) {
                    setGameState(GameState.GAME_OVER);
                }
            }
        }
    }));

    // Handle moving obstacles
    useFrame((state) => {
        if (data.type === 'moving' && initialPos.current && meshRef.current) {
            const speed = data.movingSpeed || 2;
            const range = data.movingRange || 3;
            const direction = data.movingDirection || [1, 0, 0];

            const offset = Math.sin(state.clock.elapsedTime * speed) * range;

            const newX = initialPos.current.x + direction[0] * offset;
            const newY = initialPos.current.y + direction[1] * offset;
            const newZ = initialPos.current.z + direction[2] * offset;

            api.position.set(newX, newY, newZ);
            meshRef.current.position.set(newX, newY, newZ);
            
            // Move glow and light with obstacle
            if (glowMeshRef.current) {
                glowMeshRef.current.position.set(newX, newY, newZ);
            }
            if (lightRef.current) {
                lightRef.current.position.set(newX, newY, newZ);
            }
        }
    });

    // Calculate glow size (slightly larger than obstacle)
    const glowSize = useMemo(() => {
        return data.size.map((s: number) => s * 1.15) as [number, number, number];
    }, [data.size]);

    return (
        <group>
            {/* Outer glow layer - bright neon effect (unlit for visibility) */}
            <mesh 
                ref={glowMeshRef}
                position={[worldPos.x, worldPos.y, worldPos.z]} 
                rotation={[segmentRot.x, segmentRot.y, segmentRot.z]}
            >
                <boxGeometry args={glowSize} />
                <meshBasicMaterial 
                    color="#ff0000"
                    transparent={true}
                    opacity={0.7}
                />
            </mesh>
            
            {/* Main obstacle - very deep dark red */}
            <mesh ref={ref as React.RefObject<Mesh>} castShadow receiveShadow>
                <boxGeometry args={data.size} />
                <meshStandardMaterial 
                    color="#330000" 
                    emissive="#ff0000" 
                    emissiveIntensity={25}
                    roughness={0.05}
                    metalness={0.05}
                />
            </mesh>
            
            {/* Bright point light for neon glow */}
            <pointLight 
                ref={lightRef}
                color="#ff0000" 
                intensity={5} 
                distance={15} 
                decay={1}
                position={[worldPos.x, worldPos.y, worldPos.z]}
            />
        </group>
    );
});

// -- Segment Component --
const Segment: React.FC<{
    data: SegmentData;
    collectedCoins: Set<string>;
    collectedHearts: Set<string>;
}> = React.memo(({ data, collectedCoins, collectedHearts }) => {
    const backgroundSkins = useGameStore(state => state.backgroundSkins);
    const backgroundSkinId = useGameStore(state => state.options.backgroundSkinId);
    const backgroundSkin = backgroundSkins.find(s => s.id === backgroundSkinId) || backgroundSkins[0];
    const thickness = 10;

    const [ref] = useBox(() => ({
        type: 'Static',
        args: [data.width, thickness, data.length],
        position: data.position,
        rotation: [data.slope, data.yaw, data.bank],
        friction: 0.1
    }));

    const edgesGeo = useMemo(() => new THREE.BoxGeometry(data.width, thickness, data.length), [data.width, data.length]);
    const segmentRot = useMemo(() => new Euler(data.slope, data.yaw, data.bank), [data.slope, data.yaw, data.bank]);
    const segmentPos = useMemo(() => new Vector3(...data.position), [data.position]);

    // Calculate world positions for coin and heart
    const coinWorldPos = useMemo(() => {
        if (!data.coin) return null;
        return getWorldPos(new Vector3(...data.coin.position), segmentPos, segmentRot);
    }, [data.coin, segmentPos, segmentRot]);

    const heartWorldPos = useMemo(() => {
        if (!data.heart) return null;
        return getWorldPos(new Vector3(...data.heart.position), segmentPos, segmentRot);
    }, [data.heart, segmentPos, segmentRot]);

    let color = "#050505";
    let neonColor = backgroundSkin.outlineColor;

    if (data.type === SegmentType.STEEP) {
        color = "#150000";
        neonColor = "#ff2200";
    } else if (data.type === SegmentType.NARROW) {
        color = "#151500";
        neonColor = "#ffff00";
    } else if (data.type === SegmentType.BANKED) {
        color = "#000a15";
        neonColor = "#00aaff";
    } else if (data.type === SegmentType.TURN) {
        color = "#0a0015";
        neonColor = "#cc00ff";
    }

    return (
        <group>
            <mesh ref={ref as React.RefObject<Mesh>} receiveShadow castShadow>
                <boxGeometry args={[data.width, thickness, data.length]} />
                <meshStandardMaterial color={color} roughness={0.05} metalness={0.95} />
                <lineSegments>
                    <edgesGeometry args={[edgesGeo]} />
                    <lineBasicMaterial color={neonColor} linewidth={4} transparent={false} opacity={1} />
                </lineSegments>
            </mesh>

            {/* Obstacles */}
            {data.obstacles.map(obs => (
                <Obstacle
                    key={obs.id}
                    data={obs}
                    segmentPos={segmentPos}
                    segmentRot={segmentRot}
                />
            ))}

            {/* Coin Visual */}
            {coinWorldPos && data.coin && (
                <CoinVisual
                    worldPos={coinWorldPos}
                    coinId={data.coin.id}
                    collectedCoins={collectedCoins}
                />
            )}

            {/* Heart Visual */}
            {heartWorldPos && data.heart && (
                <HeartVisual
                    worldPos={heartWorldPos}
                    heartId={data.heart.id}
                    collectedHearts={collectedHearts}
                />
            )}
        </group>
    );
});

export const TrackManager: React.FC = () => {
    const [segments, setSegments] = useState<SegmentData[]>([]);
    const [collectedCoins, setCollectedCoins] = useState<Set<string>>(new Set());
    const [collectedHearts, setCollectedHearts] = useState<Set<string>>(new Set());
    const nextStartPos = useRef(new Vector3(0, 0, 0));
    const gameState = useGameStore(state => state.gameState);
    const prevGameState = useRef<GameState>(gameState);
    const platformCounter = useRef(0);
    const lastClearedPlatform = useRef(-1);

    const generateSegment = useCallback((index: number): SegmentData => {
        const pattern = useGameStore.getState().currentPattern;
        let type = SegmentType.NORMAL;
        let width = 16;
        let length = 55;
        let slope = -0.15;
        let bank = 0;
        let yaw = 0;

        const rand = Math.random();

        if (pattern === GamePattern.FLAT_WITH_OBSTACLES) {
            slope = -0.1;
            if (index > 8) {
                if (rand < 0.15) type = SegmentType.NARROW;
            }
        } else {
            if (index > 8) {
                if (rand < 0.25) type = SegmentType.STEEP;
                else if (rand < 0.5) type = SegmentType.TURN;
                else if (rand < 0.7) type = SegmentType.BANKED;
            }
        }

        switch (type) {
            case SegmentType.STEEP:
                slope = -0.5 - (Math.random() * 0.25);
                length = 80;
                break;
            case SegmentType.NARROW:
                width = 6;
                length = 65;
                break;
            case SegmentType.BANKED:
                width = 22;
                bank = (Math.random() > 0.5 ? 0.4 : -0.4);
                break;
            case SegmentType.TURN:
                yaw = (Math.random() > 0.5 ? 0.3 : -0.3);
                width = 20;
                length = 70;
                break;
            default:
                break;
        }

        const dirRot = new Euler(slope, yaw, 0, 'YXZ');
        const fwd = new Vector3(0, 0, -1).applyEuler(dirRot);
        const center = nextStartPos.current.clone().add(fwd.clone().multiplyScalar(length / 2));
        const end = nextStartPos.current.clone().add(fwd.clone().multiplyScalar(length));

        nextStartPos.current.copy(end);

        // Generate obstacles only in FLAT_WITH_OBSTACLES pattern
        const obstacles: ObstacleData[] = [];
        if (pattern === GamePattern.FLAT_WITH_OBSTACLES && index > 5) {
            const isNarrow = width < 9;
            const obstacleCount = isNarrow ? 0 : Math.floor(Math.random() * 3);

            for (let i = 0; i < obstacleCount; i++) {
                const oz = (Math.random() - 0.5) * length * 0.8;
                const lane = Math.floor(Math.random() * 3);
                let ox = 0;
                if (lane === 0) ox = -width / 2.8;
                if (lane === 2) ox = width / 2.8;

                ox += (Math.random() - 0.5) * 2;
                if (lane === 1 && Math.random() > 0.4) continue;

                const isMoving = Math.random() > 0.8;

                obstacles.push({
                    id: `obs-${index}-${i}`,
                    position: [ox, 6.25, oz],
                    size: [2.5, 2.5, 2.5],
                    type: isMoving ? 'moving' : 'static',
                    movingDirection: isMoving ? [1, 0, 0] : undefined,
                    movingSpeed: isMoving ? 1.5 + Math.random() * 2 : undefined,
                    movingRange: isMoving ? 2 + Math.random() * 3 : undefined
                });
            }
        }

        // Generate coin (every platform has one)
        const coin: CoinData = {
            id: `coin-${index}`,
            position: [(Math.random() - 0.5) * (width * 0.6), 6.5, (Math.random() - 0.5) * (length * 0.5)],
            collected: false
        };

        // Generate heart every 20 platforms
        let heart: HeartData | undefined;
        if (index > 0 && index % 20 === 0) {
            heart = {
                id: `heart-${index}`,
                position: [0, 7, 0],
                collected: false
            };
        }

        platformCounter.current = index;

        return {
            id: `seg-${index}-${Math.random()}`,
            position: [center.x, center.y, center.z],
            length,
            width,
            slope,
            bank,
            yaw,
            type,
            obstacles,
            coin,
            heart,
            platformIndex: index
        };
    }, []);

    const initTrack = useCallback(() => {
        nextStartPos.current.set(0, 0, 0);
        platformCounter.current = 0;
        lastClearedPlatform.current = -1;
        setCollectedCoins(new Set());
        setCollectedHearts(new Set());
        const initialSegments = [];
        for (let i = 0; i < 12; i++) {
            const seg = generateSegment(i);
            if (i < 6) {
                seg.type = SegmentType.NORMAL;
                seg.width = 16;
                seg.bank = 0;
                seg.yaw = 0;
                seg.slope = -0.1;
                seg.obstacles = [];
            }
            initialSegments.push(seg);
        }
        setSegments(initialSegments);
    }, [generateSegment]);

    useEffect(() => {
        const isRestarting = prevGameState.current === GameState.GAME_OVER && gameState === GameState.PLAYING;
        if (gameState === GameState.MENU || isRestarting) {
            initTrack();
        }
        prevGameState.current = gameState;
    }, [gameState, initTrack]);

    useFrame((state) => {
        if (gameState !== GameState.PLAYING || segments.length === 0) return; // Pause track updates when paused

        const playerPos = state.camera.position;
        const lastSeg = segments[segments.length - 1];
        const distToEnd = lastSeg ? playerPos.distanceTo(new Vector3(...lastSeg.position)) : 0;

        // Generate new segments
        if (distToEnd < 450) {
            const newSeg = generateSegment(platformCounter.current + 1);
            setSegments(prev => [...prev, newSeg]);
        }

        // Clean up old segments behind the player
        const playerZ = state.camera.position.z - 13; // Player Z based on camera offset
        const playerZThreshold = playerZ + 100; // Keep segments within 100 units behind player
        setSegments(prev => prev.filter(seg => seg.position[2] < playerZThreshold));

        // Position of player in game world relative to camera
        const estimatedPlayerPos = new Vector3(
            state.camera.position.x,
            state.camera.position.y - 6.5,
            state.camera.position.z - 13
        );

        // Find closest segment
        let closestSeg = segments[0];
        let minDist = Infinity;
        for (const seg of segments) {
            const dist = estimatedPlayerPos.distanceTo(new Vector3(...seg.position));
            if (dist < minDist) {
                minDist = dist;
                closestSeg = seg;
            }
        }

        // Track platform clearing for score
        if (closestSeg && closestSeg.platformIndex > lastClearedPlatform.current) {
            lastClearedPlatform.current = closestSeg.platformIndex;
            useGameStore.getState().incrementPlatformsCleared();
        }

        // Check for coin/heart collection by proximity (increased hitbox to 3.5)
        let coinsToAdd: string[] = [];
        let heartsToAdd: string[] = [];

        for (const seg of segments) {
            if (seg.coin && !collectedCoins.has(seg.coin.id)) {
                const segPos = new Vector3(...seg.position);
                const segRot = new Euler(seg.slope, seg.yaw, seg.bank);
                const coinWorldPos = getWorldPos(new Vector3(...seg.coin.position), segPos, segRot);

                // Increased hitbox from 2 to 3.5
                if (estimatedPlayerPos.distanceTo(coinWorldPos) < 3.5) {
                    coinsToAdd.push(seg.coin.id);
                    useGameStore.getState().collectCoin();
                }
            }

            if (seg.heart && !collectedHearts.has(seg.heart.id)) {
                const segPos = new Vector3(...seg.position);
                const segRot = new Euler(seg.slope, seg.yaw, seg.bank);
                const heartWorldPos = getWorldPos(new Vector3(...seg.heart.position), segPos, segRot);

                // Increased hitbox from 2 to 3
                if (estimatedPlayerPos.distanceTo(heartWorldPos) < 3) {
                    heartsToAdd.push(seg.heart.id);
                    useGameStore.getState().addLife();
                }
            }
        }

        // Update collected sets if we collected anything
        if (coinsToAdd.length > 0) {
            setCollectedCoins(prev => {
                const newSet = new Set(prev);
                coinsToAdd.forEach(id => newSet.add(id));
                return newSet;
            });
        }

        if (heartsToAdd.length > 0) {
            setCollectedHearts(prev => {
                const newSet = new Set(prev);
                heartsToAdd.forEach(id => newSet.add(id));
                return newSet;
            });
        }

        // Death detection
        if (closestSeg && estimatedPlayerPos.y < closestSeg.position[1] - 40) {
            const { loseLife, setGameState, lives } = useGameStore.getState();
            if (lives > 0) {
                const isGameOver = loseLife();
                if (isGameOver) {
                    setGameState(GameState.GAME_OVER);
                }
            }
        }
    });

    return (
        <group>
            {segments.map(seg => (
                <Segment
                    key={seg.id}
                    data={seg}
                    collectedCoins={collectedCoins}
                    collectedHearts={collectedHearts}
                />
            ))}
        </group>
    );
};
