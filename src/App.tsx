import React, { useState, useEffect } from 'react';
import { audioManager } from './game/AudioManager';
import './index.css';

interface SpawnedFood {
  id: number;
  x: number;
  y: number;
  emoji: string;
  vx: number;
  vy: number;
}

const FOODS = ['🍔', '🍟', '🥗', '🍅', '🥔', '🧀', '🥩', '🍞'];

const MainMenu = ({ onPlay }: { onPlay: (mode: 'challenge' | 'endless', difficulty: 'easy' | 'normal' | 'hard') => void }) => {
  const [showHowTo, setShowHowTo] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [difficulty, setDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');
  const [spawnedFoods, setSpawnedFoods] = useState<SpawnedFood[]>([]);

  useEffect(() => {
    let animationFrameId: number;
    
    const updatePhysics = () => {
      setSpawnedFoods(foods => foods.map(food => {
        // Apply gravity and velocity
        const newVy = food.vy + 0.5; // gravity
        return {
          ...food,
          x: food.x + food.vx,
          y: food.y + newVy,
          vy: newVy
        };
      }).filter(food => food.y < window.innerHeight + 100)); // Remove when off screen
      
      animationFrameId = requestAnimationFrame(updatePhysics);
    };
    
    animationFrameId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  const handleSpawnFood = (e: React.MouseEvent) => {
    // Don't spawn if clicking on a button or panel
    if ((e.target as HTMLElement).closest('.btn') || (e.target as HTMLElement).closest('.hud-panel')) {
      return;
    }
    
    audioManager.playPickup(); // A nice pop sound
    
    const newFood: SpawnedFood = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      emoji: FOODS[Math.floor(Math.random() * FOODS.length)],
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 1) * 15 // Pop upwards
    };
    
    setSpawnedFoods(prev => [...prev, newFood]);
  };

  return (
    <div 
      onClick={handleSpawnFood}
      style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      width: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      overflow: 'hidden',
      background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)' // Sky background
    }}>
      {spawnedFoods.map(food => (
        <div key={food.id} style={{
          position: 'absolute',
          left: food.x - 20,
          top: food.y - 20,
          fontSize: '40px',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 5
        }}>
          {food.emoji}
        </div>
      ))}
      {/* Floating decorative elements */}
      <div style={{ position: 'absolute', top: '20%', left: '15%', fontSize: '5rem', animation: 'float 4s ease-in-out infinite', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))' }}>🍔</div>
      <div style={{ position: 'absolute', top: '15%', right: '20%', fontSize: '5rem', animation: 'float 5s ease-in-out infinite 1s', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))' }}>🥗</div>
      <div style={{ position: 'absolute', bottom: '25%', left: '25%', fontSize: '5rem', animation: 'float 4.5s ease-in-out infinite 0.5s', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))' }}>🍅</div>
      <div style={{ position: 'absolute', bottom: '20%', right: '15%', fontSize: '5rem', animation: 'float 6s ease-in-out infinite 1.5s', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.2))' }}>👨‍🍳</div>

      <h1 style={{
        fontSize: '5.5rem',
        color: 'var(--color-primary)',
        textShadow: '5px 8px 0 var(--color-primary-dark), -3px -3px 0 white, 3px -3px 0 white, -3px 3px 0 white, 3px 3px 0 white',
        marginBottom: '3rem',
        zIndex: 10,
        textAlign: 'center',
        lineHeight: 1.1
      }}>
        Cooking<br/>Chaos
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '300px', zIndex: 10 }}>
        <button className="btn" style={{ fontSize: '1.5rem', padding: '16px' }} onClick={() => setShowModeSelect(true)}>▶ Play</button>
        <button className="btn btn-secondary" onClick={() => {
          const next = difficulty === 'easy' ? 'normal' : difficulty === 'normal' ? 'hard' : 'easy';
          setDifficulty(next);
        }}>
          🔥 Difficulty: {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </button>
        <button className="btn btn-secondary" onClick={() => setShowHowTo(true)}>📖 How To Play</button>
        <button className="btn btn-secondary" onClick={() => setShowSettings(true)}>⚙ Settings</button>
      </div>

      {showModeSelect && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="hud-panel" style={{ width: '600px', backgroundColor: 'var(--color-background)', padding: '2rem', color: 'var(--color-text)', position: 'relative', textAlign: 'center' }}>
            <button onClick={() => setShowModeSelect(false)} className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '8px 16px' }}>X</button>
            <h2 style={{ marginBottom: '2rem', color: 'var(--color-primary)' }}>Select Game Mode</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <button className="btn" onClick={() => onPlay('challenge', difficulty)} style={{ padding: '20px' }}>
                <strong style={{ fontSize: '1.5rem' }}>🏆 Challenge Mode</strong>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'normal', fontSize: '1rem' }}>Score 500 points before time runs out!</p>
              </button>
              <button className="btn" onClick={() => onPlay('endless', difficulty)} style={{ padding: '20px', backgroundColor: 'var(--color-secondary)' }}>
                <strong style={{ fontSize: '1.5rem' }}>♾️ Endless Mode</strong>
                <p style={{ margin: '5px 0 0 0', fontWeight: 'normal', fontSize: '1rem' }}>No timer. Cook forever and get a high score!</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {showHowTo && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="hud-panel" style={{ width: '600px', backgroundColor: 'var(--color-background)', padding: '2rem', color: 'var(--color-text)', position: 'relative' }}>
            <button onClick={() => setShowHowTo(false)} className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '8px 16px' }}>X</button>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>📖 How to Play</h2>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2rem', lineHeight: '1.8' }}>
              <li><strong>🎮 Controls:</strong> <code>WASD</code> / <code>Arrows</code> to Move | <code>E</code> to Pick up / Drop / Deliver | Hold <code>F</code> to Chop</li>
              <hr style={{ margin: '1rem 0', borderColor: '#ddd' }}/>
              <li>🥩 <strong>Cooking Meat:</strong> Grab Meat (left wall), place on Stove (bottom right). Wait for it to cook (🍖). Don't burn it (🍖🔥)!</li>
              <li>🔪 <strong>Chopping:</strong> Grab Tomato, Cabbage, or Potato, place on Cutting Board (bottom left), hold <code>F</code> to chop into 🥣🍅, 🥣🥬, or 🔪🥔.</li>
              <li>🍳 <strong>Frying:</strong> Grab Chopped Potato (🔪🥔), place in Fryer (bottom right). Wait for it to fry (🍟). Don't burn it (🍟🔥)!</li>
              <li>🗑️ <strong>Trash:</strong> Throw ruined food in the bin (bottom right corner).</li>
              <li>🛎️ <strong>Delivery:</strong> Take the final dish to the Delivery Window (top center).</li>
            </ul>
          </div>
        </div>
      )}

      {showSettings && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="hud-panel" style={{ width: '400px', backgroundColor: 'var(--color-background)', padding: '2rem', color: 'var(--color-text)', position: 'relative', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)' }}>⚙ Settings</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem', alignItems: 'center', width: '100%' }}>
              <div style={{ width: '80%' }}>
                <label htmlFor="bgmVolume" style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>Music Volume</label>
                <input 
                  type="range" 
                  id="bgmVolume" 
                  name="bgmVolume" 
                  min="0" 
                  max="100" 
                  defaultValue={audioManager.bgmVolume * 100}
                  style={{ width: '100%' }}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value, 10) / 100;
                    audioManager.setBGMVolume(vol);
                  }}
                />
              </div>
              <div style={{ width: '80%' }}>
                <label htmlFor="sfxVolume" style={{ fontSize: '1.2rem', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>SFX Volume</label>
                <input 
                  type="range" 
                  id="sfxVolume" 
                  name="sfxVolume" 
                  min="0" 
                  max="100" 
                  defaultValue={audioManager.sfxVolume * 100}
                  style={{ width: '100%' }}
                  onChange={(e) => {
                    const vol = parseInt(e.target.value, 10) / 100;
                    audioManager.setSFXVolume(vol);
                  }}
                />
              </div>
            </div>

            <button onClick={() => setShowSettings(false)} className="btn btn-secondary">Close</button>
          </div>
        </div>
      )}

      {/* Developer Credit */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        color: 'var(--color-primary-dark)',
        fontSize: '1rem',
        fontWeight: 'bold',
        zIndex: 10,
        textShadow: '1px 1px 0 white, -1px -1px 0 white, 1px -1px 0 white, -1px 1px 0 white'
      }}>
        developed by Rajivdevx
      </div>
    </div>
  );
};

import KitchenGame from './components/KitchenGame';

function App() {
  const [gameState, setGameState] = useState<'menu' | 'playing'>('menu');
  const [gameMode, setGameMode] = useState<'challenge' | 'endless'>('challenge');
  const [gameDifficulty, setGameDifficulty] = useState<'easy' | 'normal' | 'hard'>('normal');

  useEffect(() => {
    // Global click listener for button sounds
    const handleGlobalClick = (e: globalThis.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName.toLowerCase() === 'button' || target.closest('button') || target.classList.contains('btn')) {
        audioManager.playClick();
      }
    };
    
    // Initialize audio context on first interaction
    const initAudio = () => {
      audioManager.init();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };

    window.addEventListener('click', handleGlobalClick);
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
    };
  }, []);

  return (
    <>
      {gameState === 'menu' && <MainMenu onPlay={(mode, difficulty) => {
        setGameMode(mode);
        setGameDifficulty(difficulty);
        setGameState('playing');
      }} />}
      {gameState === 'playing' && <KitchenGame mode={gameMode} difficulty={gameDifficulty} onBack={() => setGameState('menu')} />}
    </>
  );
}

export default App;
