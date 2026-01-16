import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store';
import { GameState, Difficulty, BallSkin, BackgroundSkin } from '../types';
import { generateGameCommentary } from '../services/geminiService';

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
    const baseClasses = "px-8 py-3 font-bold text-lg rounded-full transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed";
    const variantClasses = {
        primary: "bg-green-500 hover:bg-green-400 text-black hover:shadow-[0_0_20px_rgba(74,222,128,0.6)]",
        secondary: "bg-gray-700 hover:bg-gray-600 text-white border border-gray-500",
        danger: "bg-red-600 hover:bg-red-500 text-white"
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
        className="absolute top-4 left-4 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-600 transition-colors"
    >
        ← Back
    </button>
);

// Main Menu Screen
const MainMenu: React.FC = () => {
    const { setGameState, resetGame, coins, highScore } = useGameStore();

    const handleStart = () => {
        resetGame();
        setGameState(GameState.PLAYING);
    };

    return (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20 backdrop-blur-sm">
            {/* Info Button - Top Right */}
            <button
                onClick={() => setGameState(GameState.INFO)}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 text-white border border-gray-600 flex items-center justify-center text-xl font-bold transition-colors"
            >
                ?
            </button>

            {/* Coins Display - Top Left */}
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-lg border border-gray-600">
                <CoinIcon />
                <span className="text-yellow-400 font-bold">{coins}</span>
            </div>

            <div className="text-center space-y-8 p-12 border border-green-500/30 rounded-2xl bg-black/50 shadow-[0_0_50px_rgba(0,255,100,0.1)]">
                <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 italic tracking-tighter drop-shadow-sm">
                    NEON SLOPE
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

// Game Over Screen
const GameOverScreen: React.FC = () => {
    const { score, highScore, resetGame, setGameState, addToLeaderboard, totalCoinsCollected } = useGameStore();
    const [commentary, setCommentary] = useState<string>("");
    const [loadingCommentary, setLoadingCommentary] = useState(true);

    useEffect(() => {
        addToLeaderboard(score);
        generateGameCommentary(score, highScore).then(text => {
            setCommentary(text);
            setLoadingCommentary(false);
        });
    }, []);

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

                <div className="mb-8 p-4 bg-gray-900 rounded-lg border border-gray-700 min-h-[80px] flex items-center justify-center">
                    {loadingCommentary ? (
                        <span className="animate-pulse text-gray-500">Analysing run data...</span>
                    ) : (
                        <p className="text-green-300 italic text-lg">"{commentary}"</p>
                    )}
                </div>

                <div className="flex flex-col gap-3">
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
                            className="px-4 py-1 bg-gray-600 hover:bg-gray-500 text-white text-sm rounded-full transition-colors"
                        >
                            EQUIP
                        </button>
                    )
                ) : (
                    <button
                        onClick={() => type === 'ball' ? purchaseBallSkin(skin.id) : purchaseBackgroundSkin(skin.id)}
                        disabled={coins < skin.price}
                        className={`px-4 py-1 text-sm rounded-full transition-colors flex items-center gap-1 mx-auto ${coins >= skin.price
                                ? 'bg-yellow-500 hover:bg-yellow-400 text-black'
                                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
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
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-gray-800/80 px-4 py-2 rounded-lg border border-gray-600">
                <CoinIcon />
                <span className="text-yellow-400 font-bold">{coins}</span>
            </div>

            <div className="text-center max-w-2xl w-full p-8 border border-yellow-500/30 rounded-2xl bg-black/50">
                <h2 className="text-4xl font-bold text-yellow-400 mb-6">SHOP</h2>

                {/* Tabs */}
                <div className="flex justify-center gap-4 mb-6">
                    <button
                        onClick={() => setActiveTab('balls')}
                        className={`px-6 py-2 rounded-full font-bold transition-colors ${activeTab === 'balls'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
                            }`}
                    >
                        BALL SKINS
                    </button>
                    <button
                        onClick={() => setActiveTab('backgrounds')}
                        className={`px-6 py-2 rounded-full font-bold transition-colors ${activeTab === 'backgrounds'
                                ? 'bg-yellow-500 text-black'
                                : 'bg-gray-700 text-white hover:bg-gray-600'
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
        setMusicVolume,
        setSfxVolume,
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
                                    className={`flex-1 py-2 px-3 rounded-lg font-bold text-sm transition-colors ${options.difficulty === diff
                                            ? 'bg-purple-500 text-white'
                                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
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

                    {/* Music Volume */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">
                            MUSIC VOLUME: {Math.round(options.musicVolume * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={options.musicVolume}
                            onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* SFX Volume */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">
                            SFX VOLUME: {Math.round(options.sfxVolume * 100)}%
                        </label>
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={options.sfxVolume}
                            onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                    </div>

                    {/* Input Bindings */}
                    <div>
                        <label className="text-gray-400 text-sm block mb-2">CONTROLS</label>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                                <span className="text-white">Move Left</span>
                                <span className="text-gray-400 text-sm">A / ←</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                                <span className="text-white">Move Right</span>
                                <span className="text-gray-400 text-sm">D / →</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg">
                                <span className="text-white">Jump</span>
                                <span className="text-gray-400 text-sm">Space / W / ↑</span>
                            </div>
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
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 z-20 backdrop-blur-sm">
            <BackButton onClick={() => setGameState(GameState.MENU)} />

            <div className="text-center max-w-lg w-full p-8 border border-blue-500/30 rounded-2xl bg-black/50">
                <h2 className="text-4xl font-bold text-blue-400 mb-6">HOW TO PLAY</h2>

                <div className="space-y-6 text-left">
                    {/* Controls */}
                    <div>
                        <h3 className="text-xl font-bold text-white mb-3">CONTROLS</h3>
                        <div className="space-y-2 text-gray-300">
                            <p><span className="text-cyan-400 font-mono">A / ←</span> - Move Left</p>
                            <p><span className="text-cyan-400 font-mono">D / →</span> - Move Right</p>
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
