import { create } from 'zustand';
import {
    GameState,
    Difficulty,
    BallSkin,
    BackgroundSkin,
    LeaderboardEntry,
    GameOptions,
    GamePattern,
    DEFAULT_BALL_SKINS,
    DEFAULT_BACKGROUND_SKINS,
    DEFAULT_INPUT_BINDINGS,
    DIFFICULTY_MULTIPLIERS
} from './types';

interface GameStore {
    // Game State
    gameState: GameState;
    score: number;
    highScore: number;
    platformsCleared: number;
    currentSpeed: number;
    baseSpeed: number;

    // Lives System
    lives: number;
    maxLives: number;

    // Currency
    coins: number;
    totalCoinsCollected: number;

    // Game Pattern
    currentPattern: GamePattern;
    patternPlatformCount: number;

    // Leaderboard
    leaderboard: LeaderboardEntry[];

    // Shop
    ballSkins: BallSkin[];
    backgroundSkins: BackgroundSkin[];

    // Options
    options: GameOptions;

    // Actions
    setGameState: (state: GameState) => void;
    setScore: (score: number) => void;
    incrementScore: (amount: number) => void;
    incrementPlatformsCleared: () => void;
    resetGame: () => void;

    // Lives
    addLife: () => void;
    loseLife: () => boolean; // Returns true if game over

    // Coins
    collectCoin: () => void;
    spendCoins: (amount: number) => boolean;

    // Speed
    updateSpeed: () => void;
    getSpeedMultiplier: () => number;

    // Pattern
    switchPattern: () => void;

    // Shop
    purchaseBallSkin: (skinId: string) => boolean;
    purchaseBackgroundSkin: (skinId: string) => boolean;
    selectBallSkin: (skinId: string) => void;
    selectBackgroundSkin: (skinId: string) => void;
    getCurrentBallSkin: () => BallSkin;
    getCurrentBackgroundSkin: () => BackgroundSkin;

    // Options
    setDifficulty: (difficulty: Difficulty) => void;
    setMusicVolume: (volume: number) => void;
    setSfxVolume: (volume: number) => void;
    setInputBinding: (action: 'left' | 'right' | 'jump', keys: string[]) => void;

    // Leaderboard
    addToLeaderboard: (score: number) => void;
}

// Load saved data from localStorage
const loadSavedData = () => {
    const savedCoins = parseInt(localStorage.getItem('slope-coins') || '0', 10);
    const savedHighScore = parseInt(localStorage.getItem('slope-highscore') || '0', 10);
    const savedLeaderboard: LeaderboardEntry[] = JSON.parse(localStorage.getItem('slope-leaderboard') || '[]');
    const savedBallSkins: BallSkin[] = JSON.parse(localStorage.getItem('slope-ballskins') || 'null') || DEFAULT_BALL_SKINS;
    const savedBackgroundSkins: BackgroundSkin[] = JSON.parse(localStorage.getItem('slope-backgroundskins') || 'null') || DEFAULT_BACKGROUND_SKINS;
    const savedOptions: GameOptions = JSON.parse(localStorage.getItem('slope-options') || 'null') || {
        difficulty: Difficulty.NORMAL,
        ballSkinId: 'default',
        backgroundSkinId: 'default',
        musicVolume: 0.7,
        sfxVolume: 0.8,
        inputBindings: DEFAULT_INPUT_BINDINGS
    };

    return {
        coins: savedCoins,
        highScore: savedHighScore,
        leaderboard: savedLeaderboard,
        ballSkins: savedBallSkins,
        backgroundSkins: savedBackgroundSkins,
        options: savedOptions
    };
};

const savedData = loadSavedData();

export const useGameStore = create<GameStore>((set, get) => ({
    // Initial State
    gameState: GameState.MENU,
    score: 0,
    highScore: savedData.highScore,
    platformsCleared: 0,
    currentSpeed: 1.0,
    baseSpeed: 18,

    lives: 1,
    maxLives: 3,

    coins: savedData.coins,
    totalCoinsCollected: 0,

    currentPattern: GamePattern.FLAT_WITH_OBSTACLES,
    patternPlatformCount: 0,

    leaderboard: savedData.leaderboard,
    ballSkins: savedData.ballSkins,
    backgroundSkins: savedData.backgroundSkins,
    options: savedData.options,

    // Actions
    setGameState: (state) => set({ gameState: state }),

    setScore: (score) => set((state) => {
        const newHighScore = Math.max(state.highScore, score);
        if (newHighScore > state.highScore) {
            localStorage.setItem('slope-highscore', newHighScore.toString());
        }
        return { score, highScore: newHighScore };
    }),

    incrementScore: (amount) => set((state) => {
        const newScore = state.score + amount;
        const newHighScore = Math.max(state.highScore, newScore);
        if (newHighScore > state.highScore) {
            localStorage.setItem('slope-highscore', newHighScore.toString());
        }
        return { score: newScore, highScore: newHighScore };
    }),

    incrementPlatformsCleared: () => set((state) => {
        const newCount = state.platformsCleared + 1;
        const newPatternCount = state.patternPlatformCount + 1;

        // Check if we need to switch patterns (every 20 platforms)
        let newPattern = state.currentPattern;
        let resetPatternCount = newPatternCount;
        if (newPatternCount >= 20) {
            newPattern = state.currentPattern === GamePattern.FLAT_WITH_OBSTACLES
                ? GamePattern.NON_FLAT_NO_OBSTACLES
                : GamePattern.FLAT_WITH_OBSTACLES;
            resetPatternCount = 0;
        }

        // Calculate new speed based on platforms cleared
        const speedIncrease = Math.floor(newCount / 10) * 0.05;
        const newSpeed = Math.min(1.0 + speedIncrease, 2.0);

        // Update high score if needed
        const newScore = state.score + 1;
        const newHighScore = Math.max(state.highScore, newScore);
        if (newHighScore > state.highScore) {
            localStorage.setItem('slope-highscore', newHighScore.toString());
        }

        return {
            platformsCleared: newCount,
            patternPlatformCount: resetPatternCount,
            currentPattern: newPattern,
            score: newScore,
            highScore: newHighScore,
            currentSpeed: newSpeed
        };
    }),

    resetGame: () => set(() => ({
        score: 0,
        platformsCleared: 0,
        lives: 1,
        totalCoinsCollected: 0,
        currentSpeed: 1.0,
        currentPattern: GamePattern.FLAT_WITH_OBSTACLES,
        patternPlatformCount: 0
    })),

    // Lives
    addLife: () => set((state) => ({
        lives: Math.min(state.lives + 1, state.maxLives)
    })),

    loseLife: () => {
        const state = get();
        if (state.lives <= 1) {
            set({ lives: 0 });
            return true; // Game over
        }
        set({ lives: state.lives - 1 });
        return false; // Continue playing
    },

    // Coins
    collectCoin: () => set((state) => {
        const newCoins = state.coins + 1;
        localStorage.setItem('slope-coins', newCoins.toString());
        return {
            coins: newCoins,
            totalCoinsCollected: state.totalCoinsCollected + 1
        };
    }),

    spendCoins: (amount) => {
        const state = get();
        if (state.coins >= amount) {
            const newCoins = state.coins - amount;
            localStorage.setItem('slope-coins', newCoins.toString());
            set({ coins: newCoins });
            return true;
        }
        return false;
    },

    // Speed - only update if speed actually changed to avoid re-render loops
    updateSpeed: () => {
        const state = get();
        // Speed increases gradually based on platforms cleared
        const speedIncrease = Math.floor(state.platformsCleared / 10) * 0.05;
        const newSpeed = Math.min(1.0 + speedIncrease, 2.0); // Cap at 2x speed
        if (newSpeed !== state.currentSpeed) {
            set({ currentSpeed: newSpeed });
        }
    },

    getSpeedMultiplier: () => {
        const state = get();
        const difficultyMultiplier = DIFFICULTY_MULTIPLIERS[state.options.difficulty];
        return state.currentSpeed * difficultyMultiplier;
    },

    // Pattern
    switchPattern: () => set((state) => ({
        currentPattern: state.currentPattern === GamePattern.FLAT_WITH_OBSTACLES
            ? GamePattern.NON_FLAT_NO_OBSTACLES
            : GamePattern.FLAT_WITH_OBSTACLES,
        patternPlatformCount: 0
    })),

    // Shop
    purchaseBallSkin: (skinId) => {
        const state = get();
        const skin = state.ballSkins.find(s => s.id === skinId);
        if (!skin || skin.owned) return false;

        if (state.spendCoins(skin.price)) {
            const updatedSkins = state.ballSkins.map(s =>
                s.id === skinId ? { ...s, owned: true } : s
            );
            localStorage.setItem('slope-ballskins', JSON.stringify(updatedSkins));
            set({ ballSkins: updatedSkins });
            return true;
        }
        return false;
    },

    purchaseBackgroundSkin: (skinId) => {
        const state = get();
        const skin = state.backgroundSkins.find(s => s.id === skinId);
        if (!skin || skin.owned) return false;

        if (state.spendCoins(skin.price)) {
            const updatedSkins = state.backgroundSkins.map(s =>
                s.id === skinId ? { ...s, owned: true } : s
            );
            localStorage.setItem('slope-backgroundskins', JSON.stringify(updatedSkins));
            set({ backgroundSkins: updatedSkins });
            return true;
        }
        return false;
    },

    selectBallSkin: (skinId) => {
        const state = get();
        const skin = state.ballSkins.find(s => s.id === skinId);
        if (skin && skin.owned) {
            const newOptions = { ...state.options, ballSkinId: skinId };
            localStorage.setItem('slope-options', JSON.stringify(newOptions));
            set({ options: newOptions });
        }
    },

    selectBackgroundSkin: (skinId) => {
        const state = get();
        const skin = state.backgroundSkins.find(s => s.id === skinId);
        if (skin && skin.owned) {
            const newOptions = { ...state.options, backgroundSkinId: skinId };
            localStorage.setItem('slope-options', JSON.stringify(newOptions));
            set({ options: newOptions });
        }
    },

    getCurrentBallSkin: () => {
        const state = get();
        return state.ballSkins.find(s => s.id === state.options.ballSkinId) || state.ballSkins[0];
    },

    getCurrentBackgroundSkin: () => {
        const state = get();
        return state.backgroundSkins.find(s => s.id === state.options.backgroundSkinId) || state.backgroundSkins[0];
    },

    // Options
    setDifficulty: (difficulty) => set((state) => {
        const newOptions = { ...state.options, difficulty };
        localStorage.setItem('slope-options', JSON.stringify(newOptions));
        return { options: newOptions };
    }),

    setMusicVolume: (volume) => set((state) => {
        const newOptions = { ...state.options, musicVolume: volume };
        localStorage.setItem('slope-options', JSON.stringify(newOptions));
        return { options: newOptions };
    }),

    setSfxVolume: (volume) => set((state) => {
        const newOptions = { ...state.options, sfxVolume: volume };
        localStorage.setItem('slope-options', JSON.stringify(newOptions));
        return { options: newOptions };
    }),

    setInputBinding: (action, keys) => set((state) => {
        const newBindings = { ...state.options.inputBindings, [action]: keys };
        const newOptions = { ...state.options, inputBindings: newBindings };
        localStorage.setItem('slope-options', JSON.stringify(newOptions));
        return { options: newOptions };
    }),

    // Leaderboard
    addToLeaderboard: (score) => set((state) => {
        const newEntry: LeaderboardEntry = {
            rank: 0,
            score,
            date: new Date().toISOString().split('T')[0]
        };

        const updatedLeaderboard = [...state.leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 10)
            .map((entry, index) => ({ ...entry, rank: index + 1 }));

        localStorage.setItem('slope-leaderboard', JSON.stringify(updatedLeaderboard));
        return { leaderboard: updatedLeaderboard };
    })
}));
