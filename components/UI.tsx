import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store';
import { GameState, Difficulty, BallSkin, BackgroundSkin } from '../types';

// Animated Star Background Component
const StarBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameRef = useRef<number>();

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size
        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        // Create stars
        const starCount = 200;
        const stars: Array<{ x: number; y: number; radius: number; speed: number; opacity: number }> = [];

        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.5 + 0.5,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.5 + 0.5
            });
        }

        // Animation loop
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ffffff';

            stars.forEach(star => {
                star.y += star.speed;
                if (star.y > canvas.height) {
                    star.y = 0;
                    star.x = Math.random() * canvas.width;
                }

                ctx.globalAlpha = star.opacity;
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            ctx.globalAlpha = 1;
            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 0 }}
        />
    );
};

// Heart Icon Component
const HeartIcon: React.FC<{ filled: boolean }> = ({ filled }) => (
    <svg
        className={`w-6 h-6 ${filled ? 'text-red-500' : 'text-gray-600'}`}
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
    </svg>
);

// Coin Icon Component
const CoinIcon: React.FC = () => (
    <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="#b8860b" strokeWidth="2" fill="#ffd700" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="#b8860b" fontWeight="bold">$</text>
    </svg>
);

// Menu Button Component
const MenuButton: React.FC<{
    onClick: () => void;
    children: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
}> = ({ onClick, children, variant = 'secondary', disabled = false }) => {
    const baseClasses = "px-8 py-3 font-bold text-lg rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed font-jersey backdrop-blur-md border";
    const variantClasses = {
        primary: "bg-green-500/20 hover:bg-green-500/30 text-green-300 border-green-400/50 hover:border-green-400 hover:shadow-[0_0_20px_rgba(74,222,128,0.6)]",
        secondary: "bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50",
        danger: "bg-red-600/20 hover:bg-red-600/30 text-red-300 border-red-400/50 hover:border-red-400"
    };

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${variantClasses[variant]}`}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

// Back Button Component
const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute top-4 left-4 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/30 hover:border-white/50 transition-colors font-jersey backdrop-blur-md"
    >
        ← Back
    </button>
);

// Keybind Editor Component
const KeybindEditor: React.FC<{
    label: string;
    keys: string[];
    onKeysChange: (keys: string[]) => void;
}> = ({ label, keys, onKeysChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [pendingKeys, setPendingKeys] = useState<string[]>(keys);

    const formatKey = (key: string): string => {
        const keyMap: Record<string, string> = {
            'KeyA': 'A',
            'KeyD': 'D',
            'KeyW': 'W',
            'KeyS': 'S',
            'Space': 'Space',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
        };
        return keyMap[key] || key.replace('Key', '').replace('Arrow', '');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const code = e.code;
        if (!pendingKeys.includes(code)) {
            setPendingKeys([...pendingKeys, code]);
        }
    };

    const handleSave = () => {
        if (pendingKeys.length > 0) {
            onKeysChange(pendingKeys);
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        setPendingKeys(keys);
        setIsEditing(false);
    };

    const removeKey = (keyToRemove: string) => {
        setPendingKeys(pendingKeys.filter((k: string) => k !== keyToRemove));
    };

    return (
        <div className="bg-gray-800 p-3 rounded-lg">
            <div className="flex justify-between items-center">
                <span className="text-white font-jersey">{label}</span>
                {!isEditing ? (
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-jersey">
                            {keys.map(formatKey).join(' / ')}
                        </span>
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/50 hover:border-purple-400 text-xs rounded font-jersey backdrop-blur-md"
                        >
                            Edit
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <div
                            className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/30 text-white text-xs rounded min-w-[100px] text-center font-jersey"
                            onKeyDown={handleKeyDown}
                            tabIndex={0}
                        >
                            {pendingKeys.length > 0 ? pendingKeys.map(formatKey).join(' / ') : 'Press key...'}
                        </div>
                        <button
                            onClick={handleSave}
                            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-400/50 hover:border-green-400 text-xs rounded font-jersey backdrop-blur-md"
                        >
                            ✓
                        </button>
                        <button
                            onClick={handleCancel}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/50 hover:border-red-400 text-xs rounded font-jersey backdrop-blur-md"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>
            {isEditing && pendingKeys.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                    {pendingKeys.map((key: string) => (
                        <button
                            key={key}
                            onClick={() => removeKey(key)}
                            className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 text-xs rounded font-jersey backdrop-blur-md"
                        >
                            {formatKey(key)} ×
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// Main Menu Screen
const MainMenu: React.FC = () => {
    const { setGameState, resetGame, coins, highScore } = useGameStore();

    const handleStart = () => {
        resetGame();
        setGameState(GameState.PLAYING);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
            {/* Animated Star Background */}
            <StarBackground />

            {/* Info Button - Top Right */}
            <button
                onClick={() => setGameState(GameState.INFO)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 flex items-center justify-center text-xl font-bold transition-colors backdrop-blur-md z-10"
            >
                ?
            </button>

            {/* Coins Display - Top Left */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30 z-10">
                <CoinIcon />
                <span className="text-yellow-400 font-bold">{coins}</span>
            </div>

            <div className="text-center space-y-8 p-12 border border-green-500/30 rounded-2xl bg-black/50 shadow-[0_0_50px_rgba(0,255,100,0.1)] backdrop-blur-sm z-10">
                <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 italic tracking-tighter drop-shadow-sm">
                    ASKEW
                </h1>

                <div className="text-gray-400">
                    <p className="text-sm">HIGH SCORE: <span className="text-white font-bold">{highScore}</span></p>
                </div>

                <div className="flex flex-col gap-4">
                    <MenuButton onClick={handleStart} variant="primary">
                        PLAY
                    </MenuButton>
                    <MenuButton onClick={() => setGameState(GameState.LEADERBOARD)}>
                        LEADERBOARD
                    </MenuButton>
                    <MenuButton onClick={() => setGameState(GameState.SHOP)}>
                        SHOP
                    </MenuButton>
                    <MenuButton onClick={() => setGameState(GameState.OPTIONS)}>
                        OPTIONS
                    </MenuButton>
                </div>
            </div>
        </div>
    );
};

// Playing HUD
const PlayingHUD: React.FC = () => {
    const { score, highScore, lives, maxLives, coins, currentSpeed, options } = useGameStore();
    const speedDisplay = (currentSpeed * (options.difficulty === Difficulty.EASY ? 0.8 : options.difficulty === Difficulty.HARD ? 1.15 : 1.0)).toFixed(2);

    return (
        <div className="absolute top-0 left-0 w-full p-4 pointer-events-none z-10">
            <div className="flex justify-between items-start">
                {/* Left Side - Speed */}
                <div className="text-white bg-black/50 px-4 py-2 rounded-lg">
                    <p className="text-sm text-gray-400">SPEED</p>
                    <p className="text-2xl font-bold text-cyan-400">{speedDisplay}x</p>
                </div>

                {/* Center - Score */}
                <div className="text-center">
                    <h2 className="text-4xl font-bold tracking-wider text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
                        {score}
                    </h2>
                    <p className="text-sm text-gray-400">SCORE</p>
                </div>

                {/* Right Side - Lives & Coins */}
                <div className="flex flex-col items-end gap-2">
                    {/* Lives */}
                    <div className="flex gap-1 bg-black/50 px-3 py-1 rounded-lg">
                        {Array.from({ length: maxLives }).map((_, i) => (
                            <HeartIcon key={i} filled={i < lives} />
                        ))}
                    </div>

                    {/* Coins */}
                    <div className="flex items-center gap-2 bg-black/50 px-3 py-1 rounded-lg">
                        <CoinIcon />
                        <span className="text-yellow-400 font-bold">{coins}</span>
                    </div>

                    {/* High Score */}
                    <div className="text-right bg-black/50 px-3 py-1 rounded-lg">
                        <p className="text-xs text-gray-400">HIGH</p>
                        <p className="text-sm text-white font-bold">{highScore}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Pause Screen
const PauseScreen: React.FC = () => {
    const { togglePause, setGameState } = useGameStore();

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-30 backdrop-blur-sm">
            <div className="text-center space-y-8 p-12 border border-yellow-500/30 rounded-2xl bg-black/50 shadow-[0_0_50px_rgba(255,255,0,0.1)]">
                <h2 className="text-6xl font-bold text-yellow-400 mb-4 font-jersey">PAUSED</h2>
                <p className="text-gray-400 text-sm mb-6">Press P or ESCAPE to resume</p>
                
                <div className="flex flex-col gap-4">
                    <MenuButton onClick={togglePause} variant="primary">
                        RESUME
                    </MenuButton>
                    <MenuButton onClick={() => setGameState(GameState.MENU)}>
                        MAIN MENU
                    </MenuButton>
                </div>
            </div>
        </div>
    );
};

// Game Over Screen
const GameOverScreen: React.FC = () => {
    const { score, resetGame, setGameState, addToLeaderboard, totalCoinsCollected } = useGameStore();

    React.useEffect(() => {
        addToLeaderboard(score);
    }, [score, addToLeaderboard]);

    const handleRetry = () => {
        resetGame();
        setGameState(GameState.PLAYING);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 z-20 backdrop-blur-md">
            <div className="text-center max-w-lg w-full p-8 border border-red-500/50 rounded-xl bg-black/80">
                <h2 className="text-5xl font-bold text-red-500 mb-2">CRASHED</h2>
                <p className="text-xl text-white mb-2">SCORE: {score}</p>
                <p className="text-sm text-yellow-400 mb-6">Coins collected: {totalCoinsCollected}</p>

                <div className="flex flex-col gap-3 mt-8">
                    <MenuButton onClick={handleRetry} variant="primary">
                        RETRY
                    </MenuButton>
                    <MenuButton onClick={() => setGameState(GameState.MENU)}>
                        MAIN MENU
                    </MenuButton>
                </div>
            </div>
        </div>
    );
};

// Leaderboard Screen
const LeaderboardScreen: React.FC = () => {
    const { setGameState, leaderboard, highScore } = useGameStore();

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 backdrop-blur-sm">
            <BackButton onClick={() => setGameState(GameState.MENU)} />

            <div className="text-center max-w-md w-full p-8 border border-cyan-500/30 rounded-2xl bg-black/50">
                <h2 className="text-4xl font-bold text-cyan-400 mb-6">LEADERBOARD</h2>

                <div className="mb-6 p-4 bg-cyan-900/20 rounded-lg border border-cyan-500/30">
                    <p className="text-gray-400 text-sm">YOUR BEST</p>
                    <p className="text-3xl font-bold text-white">{highScore}</p>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                    {leaderboard.length === 0 ? (
                        <p className="text-gray-500 py-8">No scores yet. Play to set a record!</p>
                    ) : (
                        leaderboard.map((entry, index) => (
                            <div
                                key={index}
                                className={`flex justify-between items-center p-3 rounded-lg ${index === 0 ? 'bg-yellow-500/20 border border-yellow-500/50' :
                                        index === 1 ? 'bg-gray-400/20 border border-gray-400/50' :
                                            index === 2 ? 'bg-orange-600/20 border border-orange-600/50' :
                                                'bg-gray-800/50'
                                    }`}
                            >
                                <span className="text-gray-400 font-bold">#{entry.rank}</span>
                                <span className="text-white font-bold text-xl">{entry.score}</span>
                                <span className="text-gray-500 text-sm">{entry.date}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// Shop Screen
const ShopScreen: React.FC = () => {
    const {
        setGameState,
        coins,
        ballSkins,
        backgroundSkins,
        purchaseBallSkin,
        purchaseBackgroundSkin,
        selectBallSkin,
        selectBackgroundSkin,
        options
    } = useGameStore();

    const [activeTab, setActiveTab] = useState<'balls' | 'backgrounds'>('balls');

    const renderSkinItem = (skin: BallSkin | BackgroundSkin, type: 'ball' | 'background') => {
        const isSelected = type === 'ball'
            ? options.ballSkinId === skin.id
            : options.backgroundSkinId === skin.id;
        const isBallSkin = type === 'ball';

        return (
            <div
                key={skin.id}
                className={`p-4 rounded-lg border-2 transition-all ${isSelected
                        ? 'border-green-500 bg-green-500/10'
                        : skin.owned
                            ? 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                            : 'border-gray-700 bg-gray-900/50'
                    }`}
            >
                {/* Preview */}
                <div
                    className="w-16 h-16 mx-auto mb-3 rounded-full border-2"
                    style={{
                        backgroundColor: isBallSkin
                            ? (skin as BallSkin).color
                            : (skin as BackgroundSkin).backgroundColor,
                        borderColor: isBallSkin
                            ? (skin as BallSkin).wireframeColor
                            : (skin as BackgroundSkin).outlineColor,
                        boxShadow: `0 0 15px ${isBallSkin
                            ? (skin as BallSkin).emissiveColor
                            : (skin as BackgroundSkin).outlineColor}40`
                    }}
                />

                <p className="text-white font-bold text-sm mb-2">{skin.name}</p>

                {skin.owned ? (
                    isSelected ? (
                        <span className="text-green-400 text-sm">EQUIPPED</span>
                    ) : (
                        <button
                            onClick={() => type === 'ball' ? selectBallSkin(skin.id) : selectBackgroundSkin(skin.id)}
                            className="px-4 py-1 bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/50 text-sm rounded-full transition-colors backdrop-blur-md"
                        >
                            EQUIP
                        </button>
                    )
                ) : (
                    <button
                        onClick={() => type === 'ball' ? purchaseBallSkin(skin.id) : purchaseBackgroundSkin(skin.id)}
                        disabled={coins < skin.price}
                        className={`px-4 py-1 text-sm rounded-full transition-colors flex items-center gap-1 mx-auto backdrop-blur-md border ${coins >= skin.price
                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 border-yellow-400/50 hover:border-yellow-400'
                                : 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed'
                            }`}
                    >
                        <CoinIcon /> {skin.price}
                    </button>
                )}
            </div>
        );
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 backdrop-blur-sm">
            <BackButton onClick={() => setGameState(GameState.MENU)} />

            {/* Coins Display */}
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/30 z-10">
                <CoinIcon />
                <span className="text-yellow-400 font-bold">{coins}</span>
            </div>

            <div className="text-center max-w-2xl w-full p-8 border border-yellow-500/30 rounded-2xl bg-black/50">
                <h2 className="text-4xl font-bold text-yellow-400 mb-6">SHOP</h2>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('balls')}
                        className={`px-6 py-2 rounded-full font-bold transition-colors backdrop-blur-md border ${activeTab === 'balls'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
                                : 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50'
                            }`}
                    >
                        BALL SKINS
                    </button>
                    <button
                        onClick={() => setActiveTab('backgrounds')}
                        className={`px-6 py-2 rounded-full font-bold transition-colors backdrop-blur-md border ${activeTab === 'backgrounds'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
                                : 'bg-white/10 text-white border-white/30 hover:bg-white/20 hover:border-white/50'
                            }`}
                    >
                        BACKGROUNDS
                    </button>
                </div>

                {/* Items Grid */}
                <div className="grid grid-cols-3 gap-4 max-h-80 overflow-y-auto p-2">
                    {activeTab === 'balls'
                        ? ballSkins.map(skin => renderSkinItem(skin, 'ball'))
                        : backgroundSkins.map(skin => renderSkinItem(skin, 'background'))
                    }
                </div>
            </div>
        </div>
    );
};

// Options Screen
const OptionsScreen: React.FC = () => {
    const {
        setGameState,
        options,
        setDifficulty,
        setInputBinding,
        ballSkins,
        backgroundSkins,
        selectBallSkin,
        selectBackgroundSkin
    } = useGameStore();

    const difficulties: Difficulty[] = [Difficulty.EASY, Difficulty.NORMAL, Difficulty.HARD];
    const difficultyLabels: Record<Difficulty, string> = {
        [Difficulty.EASY]: 'EASY (0.8x)',
        [Difficulty.NORMAL]: 'NORMAL (1.0x)',
        [Difficulty.HARD]: 'HARD (1.15x)'
    };

    const ownedBallSkins = ballSkins.filter(s => s.owned);
    const ownedBackgroundSkins = backgroundSkins.filter(s => s.owned);

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 backdrop-blur-sm overflow-y-auto py-8">
            <BackButton onClick={() => setGameState(GameState.MENU)} />

            <div className="text-center max-w-lg w-full p-8 border border-purple-500/30 rounded-2xl bg-black/50 my-auto">
                <h2 className="text-4xl font-bold text-purple-400 mb-6">OPTIONS</h2>

                <div className="space-y-6 text-left">
                    {/* Difficulty */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">DIFFICULTY</label>
                        <div className="flex gap-2">
                            {difficulties.map(diff => (
                                <button
                                    key={diff}
                                    onClick={() => setDifficulty(diff)}
                                    className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-colors backdrop-blur-md border ${options.difficulty === diff
                                            ? 'bg-purple-500/20 text-purple-300 border-purple-400/50'
                                            : 'bg-white/10 text-gray-300 border-white/30 hover:bg-white/20 hover:border-white/50'
                                        }`}
                                >
                                    {difficultyLabels[diff]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Ball Color */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">BALL COLOR</label>
                        <div className="flex gap-2 flex-wrap">
                            {ownedBallSkins.map(skin => (
                                <button
                                    key={skin.id}
                                    onClick={() => selectBallSkin(skin.id)}
                                    className={`w-10 h-10 rounded-full border-2 transition-all ${options.ballSkinId === skin.id
                                            ? 'border-white scale-110'
                                            : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                    style={{
                                        backgroundColor: skin.color,
                                        boxShadow: `0 0 10px ${skin.emissiveColor}60`
                                    }}
                                    title={skin.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Background */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">BACKGROUND</label>
                        <div className="flex gap-2 flex-wrap">
                            {ownedBackgroundSkins.map(skin => (
                                <button
                                    key={skin.id}
                                    onClick={() => selectBackgroundSkin(skin.id)}
                                    className={`w-10 h-10 rounded-lg border-2 transition-all ${options.backgroundSkinId === skin.id
                                            ? 'border-white scale-110'
                                            : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                    style={{
                                        backgroundColor: skin.backgroundColor,
                                        boxShadow: `0 0 10px ${skin.outlineColor}60`
                                    }}
                                    title={skin.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Input Bindings */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">CONTROLS</label>
                        <div className="space-y-2">
                            <KeybindEditor
                                label="Move Left"
                                keys={options.inputBindings.left}
                                onKeysChange={(keys) => setInputBinding('left', keys)}
                            />
                            <KeybindEditor
                                label="Move Right"
                                keys={options.inputBindings.right}
                                onKeysChange={(keys) => setInputBinding('right', keys)}
                            />
                            <KeybindEditor
                                label="Jump"
                                keys={options.inputBindings.jump}
                                onKeysChange={(keys) => setInputBinding('jump', keys)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Info Screen
const InfoScreen: React.FC = () => {
    const { setGameState } = useGameStore();

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 backdrop-blur-sm overflow-y-auto py-8">
            <BackButton onClick={() => setGameState(GameState.MENU)} />

            <div className="text-center max-w-lg w-full min-h-0 p-8 border border-blue-500/30 rounded-2xl bg-black/50 my-auto">
                <h2 className="text-4xl font-bold text-blue-400 mb-6">HOW TO PLAY</h2>

                <div className="space-y-6 text-left">
                    {/* Controls */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">CONTROLS</h3>
                        <div className="space-y-2 text-gray-300">
                            <p><span className="text-cyan-400 font-mono">A/Left Arrow</span> - Move Left</p>
                            <p><span className="text-cyan-400 font-mono">D /Right Arrow</span> - Move Right</p>
                            <p><span className="text-cyan-400 font-mono">Space</span> - Jump</p>
                        </div>
                    </div>

                    {/* Scoring */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">SCORING</h3>
                        <div className="space-y-2 text-gray-300">
                            <p><span className="text-green-400">+1 point</span> for each platform cleared</p>
                            <p><span className="text-yellow-400">Coins</span> can be collected on platforms</p>
                            <p>Use coins to buy skins in the <span className="text-yellow-400">Shop</span></p>
                        </div>
                    </div>

                    {/* Lives */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">LIVES</h3>
                        <div className="space-y-2 text-gray-300">
                            <p>You start with <span className="text-red-400">1 life</span></p>
                            <p><span className="text-red-400">Hearts</span> spawn every 20 platforms</p>
                            <p>Maximum of <span className="text-red-400">3 lives</span></p>
                        </div>
                    </div>

                    {/* Tips */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">TIPS</h3>
                        <div className="space-y-2 text-gray-300">
                            <p>• Avoid <span className="text-red-500">red obstacles</span></p>
                            <p>• Don't fall off the edges</p>
                            <p>• Speed increases over time</p>
                            <p>• Watch for pattern changes!</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Main UI Component
export const UI: React.FC = () => {
    const { gameState } = useGameStore();

    switch (gameState) {
        case GameState.MENU:
            return <MainMenu />;
        case GameState.PLAYING:
            return <PlayingHUD />;
        case GameState.PAUSED:
            return (
                <>
                    <PlayingHUD />
                    <PauseScreen />
                </>
            );
        case GameState.GAME_OVER:
            return <GameOverScreen />;
        case GameState.LEADERBOARD:
            return <LeaderboardScreen />;
        case GameState.SHOP:
            return <ShopScreen />;
        case GameState.OPTIONS:
            return <OptionsScreen />;
        case GameState.INFO:
            return <InfoScreen />;
        default:
            return null;
    }
};
