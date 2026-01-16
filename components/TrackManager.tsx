import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useBox } from '@react-three/cannon';
import { SegmentData, ObstacleData, GameState, SegmentType } from '../types';
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

// -- Obstacle Component --
const Obstacle: React.FC<{
    data: ObstacleData;
    segmentPos: Vector3;
    segmentRot: Euler;
}> = ({ data, segmentPos, segmentRot }) => {
    const { setGameState } = useGameStore();

    const worldPos = useMemo(() => {
        return getWorldPos(new Vector3(...data.position), segmentPos, segmentRot);
    }, [data.position, segmentPos, segmentRot]);

    const [ref] = useBox(() => ({
        type: 'Static',
        mass: 0,
        position: [worldPos.x, worldPos.y, worldPos.z],
        rotation: [segmentRot.x, segmentRot.y, segmentRot.z],
        args: data.size,
        onCollide: (e) => {
            if (e.body.name === 'player') {
                setGameState(GameState.GAME_OVER);
            }
        }
    }));

    return (
        <mesh ref={ref as React.RefObject<Mesh>} castShadow receiveShadow>
            <boxGeometry args={data.size} />
            <meshStandardMaterial color="#ff0044" emissive="#ff0000" emissiveIntensity={4} />
        </mesh>
    );
};

// -- Segment Component --
const Segment: React.FC<{ data: SegmentData }> = ({ data }) => {
    const thickness = 10; // Deeper platforms for a solid monolithic look

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

    let color = "#050505";
    let neonColor = "#00ffff";

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
                    <lineBasicMaterial color={neonColor} linewidth={4} transparent opacity={0.8} />
                </lineSegments>
            </mesh>

            {data.obstacles.map(obs => (
                <Obstacle
                    key={obs.id}
                    data={obs}
                    segmentPos={segmentPos}
                    segmentRot={segmentRot}
                />
            ))}
        </group>
    );
};

export const TrackManager: React.FC<{ playerZ: number }> = ({ playerZ }) => {
    const [segments, setSegments] = useState<SegmentData[]>([]);
    const nextStartPos = useRef(new Vector3(0, 0, 0));
    const { gameState, setGameState } = useGameStore();
    const prevGameState = useRef<GameState>(gameState);

    const generateSegment = (index: number): SegmentData => {
        let type = SegmentType.NORMAL;
        let width = 16;
        let length = 55;
        let slope = -0.15;
        let bank = 0;
        let yaw = 0;

        const rand = Math.random();
        if (index > 8) {
            if (rand < 0.2) type = SegmentType.STEEP;
            else if (rand < 0.4) type = SegmentType.TURN;
            else if (rand < 0.55) type = SegmentType.BANKED;
            else if (rand < 0.7) type = SegmentType.NARROW;
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

        const obstacles: ObstacleData[] = [];
        if (index > 5) {
            const isNarrow = width < 9;
            const obstacleCount = isNarrow ? 0 : Math.floor(Math.random() * 4);

            for (let i = 0; i < obstacleCount; i++) {
                const oz = (Math.random() - 0.5) * length * 0.8;
                const lane = Math.floor(Math.random() * 3);
                let ox = 0;
                if (lane === 0) ox = -width / 2.8;
                if (lane === 2) ox = width / 2.8;

                ox += (Math.random() - 0.5) * 2;
                if (lane === 1 && Math.random() > 0.4) continue;

                obstacles.push({
                    id: `obs-${index}-${i}`,
                    position: [ox, 6.25, oz], // Surface of 10-thick is 5. Height is 2.5, so center 5+1.25 = 6.25
                    size: [2.5, 2.5, 2.5],
                    type: 'static'
                });
            }
        }

        return { id: `seg-${index}-${Math.random()}`, position: [center.x, center.y, center.z], length, width, slope, bank, yaw, type, obstacles };
    };

    const initTrack = () => {
        nextStartPos.current.set(0, 0, 0);
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
    };

    // Improved effect to handle Retry (GAME_OVER -> PLAYING)
    useEffect(() => {
        const isRestarting = prevGameState.current === GameState.GAME_OVER && gameState === GameState.PLAYING;
        if (gameState === GameState.MENU || isRestarting) {
            initTrack();
        }
        prevGameState.current = gameState;
    }, [gameState]);

    useFrame((state) => {
        if (gameState !== GameState.PLAYING || segments.length === 0) return;
        const playerPos = state.camera.position;
        const lastSeg = segments[segments.length - 1];
        const distToEnd = lastSeg ? playerPos.distanceTo(new Vector3(...lastSeg.position)) : 0;

        if (distToEnd < 450) {
            const newSeg = generateSegment(segments.length);
            setSegments(prev => [...prev, newSeg]);
        }

        if (segments.length > 70) {
            setSegments(prev => prev.slice(prev.length - 70));
        }

        // Position of player in game world relative to camera
        const estimatedPlayerPos = new Vector3(state.camera.position.x, state.camera.position.y - 6.5, state.camera.position.z - 13);

        let closestSeg = segments[0];
        let minDist = Infinity;
        for (const seg of segments) {
            const dist = estimatedPlayerPos.distanceTo(new Vector3(...seg.position));
            if (dist < minDist) {
                minDist = dist;
                closestSeg = seg;
            }
        }

        // Death detection: If player is way below the current platform
        if (closestSeg && estimatedPlayerPos.y < closestSeg.position[1] - 40) {
            setGameState(GameState.GAME_OVER);
        }
    });

    return (
        <group>
            {segments.map(seg => (
                <Segment key={seg.id} data={seg} />
            ))}
        </group>
    );
};