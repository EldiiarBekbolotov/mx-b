import React, { useEffect } from 'react';
import { GameScene } from './components/GameScene';
import { UI } from './components/UI';
import { useGameStore } from './store';
import { GameState } from './types';

const App: React.FC = () => {
    const { gameState, togglePause } = useGameStore();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Don't pause if we're in menu or other screens
            if (gameState !== GameState.PLAYING && gameState !== GameState.PAUSED) {
                return;
            }

            // Pause with P or ESCAPE
            if (e.code === 'KeyP' || e.code === 'Escape') {
                e.preventDefault();
                togglePause();
            }
        };

        const handleVisibilityChange = () => {
            // Pause when tab loses focus
            if (document.hidden && gameState === GameState.PLAYING) {
                togglePause();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [gameState, togglePause]);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            <GameScene />
            <UI />

            {/* Decorative Overlay for CRT effect */}
            <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: "100% 2px, 3px 100%" }}></div>
        </div>
    );
};

export default App;
