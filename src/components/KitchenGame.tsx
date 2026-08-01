import React, { useEffect, useState } from 'react';
import { gameEngine } from '../game/GameEngine';
import type { GameState, ItemType } from '../game/GameEngine';

import { audioManager } from '../game/AudioManager';

const KitchenGame: React.FC<{ mode: 'challenge' | 'endless', difficulty: 'easy' | 'normal' | 'hard', onBack: () => void }> = ({ mode, difficulty, onBack }) => {
  const [gameState, setGameState] = useState<GameState>(gameEngine.state);
  const [showRecipes, setShowRecipes] = useState(false);

  useEffect(() => {
    // Start engine and subscribe
    gameEngine.reset(mode, difficulty);
    gameEngine.start();
    const unsubscribe = gameEngine.subscribe((state) => {
      setGameState({ ...state }); // shallow copy to trigger re-render
    });

    // Keyboard handlers for E
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e' && gameEngine.state.status === 'playing') {
        gameEngine.interact();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Play BGM
    audioManager.playBGM();

    return () => {
      gameEngine.stop();
      unsubscribe();
      window.removeEventListener('keydown', handleKeyDown);
      audioManager.stopBGM();
    };
  }, []);

  const renderItem = (itemType: ItemType, x: number, y: number, key: string) => {
    let emoji = '❓';
    if (itemType === 'tomato') emoji = '🍅';
    if (itemType === 'tomato_slices') emoji = '🥣🍅';
    if (itemType === 'cabbage') emoji = '🥬';
    if (itemType === 'cabbage_slices') emoji = '🥣🥬';
    if (itemType === 'meat') emoji = '🥩';
    if (itemType === 'cooked_meat') emoji = '🍖';
    if (itemType === 'burnt_meat') emoji = '🍖🔥';
    if (itemType === 'bread') emoji = '🍞';
    if (itemType === 'meat_on_bread') emoji = '🍞🍖';
    if (itemType === 'burger') emoji = '🍔';
    if (itemType === 'salad') emoji = '🥗';
    if (itemType === 'cheese') emoji = '🧀';
    if (itemType === 'potato') emoji = '🥔';
    if (itemType === 'chopped_potato') emoji = '🔪🥔';
    if (itemType === 'fries') emoji = '🍟';
    if (itemType === 'burnt_fries') emoji = '🍟🔥';
    if (itemType === 'cheese_on_bread') emoji = '🍞🧀';
    
    const isCombo = emoji.length > 2; // Emojis are usually length 2

    return (
      <div key={key} className="item-emoji" style={{
        position: 'absolute',
        left: x, top: y,
        fontSize: isCombo ? '24px' : '30px', // slightly smaller for combos
        letterSpacing: isCombo ? '-4px' : 'normal',
        width: '40px', height: '40px',
        display: 'flex', justifyContent: 'center', alignItems: 'center',
        whiteSpace: 'nowrap', // prevent wrapping
        zIndex: 10
      }}>
        {emoji}
      </div>
    );
  };

  const renderCounter = (counter: any) => {
    const isFacing = gameEngine.getFacingCounter()?.id === counter.id;
    const baseClass = `counter-base counter-${counter.type}`;
    const facingClass = isFacing ? ' counter-facing' : '';
    const fullClass = baseClass + facingClass;

    return (
      <div key={counter.id} className={fullClass} style={{
        position: 'absolute',
        left: counter.rect.x,
        top: counter.rect.y,
        width: counter.rect.w,
        height: counter.rect.h,
        boxSizing: 'border-box',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '24px'
      }}>
        {counter.type === 'container' && counter.containerItem && renderItem(counter.containerItem, 0, 0, `${counter.id}_ci`)}
        {counter.type === 'fryer' && <div style={{ position: 'absolute', fontSize: '30px' }}>🍳</div>}
        {counter.type === 'trash' && <div style={{ position: 'absolute', fontSize: '30px' }}>🗑️</div>}
        {counter.item && renderItem(counter.item.type, 0, -10, `${counter.id}_i`)}
        {counter.progress !== undefined && counter.progress > 0 && (
          <div style={{ position: 'absolute', top: 5, width: '90%', zIndex: 30 }}>
            <div className="progress-bar-bg" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ 
                width: `${Math.min(counter.progress, 100)}%`, 
                backgroundColor: counter.progress >= 100 ? 'var(--color-success)' : 'var(--color-primary)' 
              }} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', paddingTop: '20px',
      background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)' // Sky background
    }}>
      {/* Top Right Floating Replay Button */}
      <button 
        className="btn btn-secondary" 
        onClick={() => {
          gameEngine.reset(mode, difficulty);
          gameEngine.start();
          audioManager.playBGM();
        }} 
        style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px 20px', fontSize: '1.1rem', zIndex: 50, border: '4px solid rgba(0,0,0,0.2)' }}
        title="Restart Game"
      >
        🔄 Replay
      </button>

      {/* Top HUD */}
      <div className="hud-panel" style={{ 
        display: 'flex', 
        width: '800px', 
        height: '70px',
        justifyContent: 'space-between', 
        color: 'white', 
        marginBottom: '20px', 
        padding: '0 25px', 
        alignItems: 'center',
        flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', whiteSpace: 'nowrap' }}>
          <h2 style={{ margin: 0, fontSize: '2rem', minWidth: '150px' }}>Score: {gameState.score}</h2>
          
          {mode === 'challenge' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.5))' }}>
                <svg width="40" height="40" viewBox="0 0 40 40">
                  <circle cx="20" cy="20" r="16" fill="var(--color-background)" stroke="rgba(255,255,255,0.2)" strokeWidth="4" />
                  <circle cx="20" cy="20" r="16" fill="none" 
                    stroke={gameState.timeLeft <= 30 ? 'var(--color-danger)' : 'white'} 
                    strokeWidth="4" 
                    strokeDasharray="100.53" 
                    strokeDashoffset={100.53 * (1 - gameState.timeLeft / 120)}
                    transform="rotate(-90 20 20)" 
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s' }}
                  />
                </svg>
              </div>
              <span style={{ fontSize: '1.2rem', color: gameState.timeLeft <= 30 ? 'var(--color-danger)' : 'white' }}>
                {Math.floor(gameState.timeLeft / 60)}:{(Math.floor(gameState.timeLeft % 60)).toString().padStart(2, '0')}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: '2rem', color: 'var(--color-secondary)' }}>♾️</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', margin: '0 10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => gameEngine.togglePause()} 
            style={{ padding: '8px 20px', fontSize: '1rem', flexShrink: 0 }}
          >
            {gameState.status === 'paused' ? '▶ Resume' : '⏸ Pause'}
          </button>
          <button 
            className="btn btn-secondary" 
            onClick={() => audioManager.toggleMusic()} 
            style={{ padding: '8px 20px', fontSize: '1rem', flexShrink: 0 }}
          >
            🎵 Music
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={() => setShowRecipes(true)} style={{ padding: '8px 20px', fontSize: '1rem', flexShrink: 0 }}>Recipes</button>
          <button className="btn btn-secondary" onClick={onBack} style={{ padding: '8px 20px', fontSize: '1rem', flexShrink: 0 }}>Menu</button>
        </div>
      </div>

      {/* Orders */}
      <div style={{ display: 'flex', width: '800px', gap: '15px', marginBottom: '20px', height: '110px' }}>
        {gameState.orders.map(order => {
          const isUrgent = order.timer < 15;
          return (
          <div key={order.id} className={`order-card ${isUrgent ? 'urgent' : ''}`} style={{ flex: 1 }}>
            <strong style={{ fontSize: '1.2rem', color: 'var(--color-text)' }}>{order.type.toUpperCase()}</strong>
            <div style={{ fontSize: '36px', margin: '4px 0' }}>
              {order.type === 'burger' ? '🍔' : 
               order.type === 'salad' ? '🥗' :
               order.type === 'fries' ? '🍟' : '❓'}
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ 
                width: `${(order.timer / 60) * 100}%`, 
                backgroundColor: isUrgent ? 'var(--color-danger)' : 'var(--color-success)' 
              }} />
            </div>
          </div>
        )})}
      </div>

      {/* Game View */}
      <div className="kitchen-floor" style={{ 
        position: 'relative', 
        width: 800, 
        height: 450, 
        overflow: 'hidden'
      }}>
        {/* Render Counters */}
        {gameState.counters.map(renderCounter)}
        
        {/* Render Player */}
        <div className="player-character" style={{
          position: 'absolute',
          left: gameState.player.rect.x,
          top: gameState.player.rect.y,
          width: gameState.player.rect.w,
          height: gameState.player.rect.h,
          animation: gameState.player.isMoving ? 'bob 0.2s infinite ease-in-out' : 'none',
        }}>
          👨‍🍳
          {/* Player facing direction indicator */}
          <div style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 14, height: 14,
            backgroundColor: 'var(--color-primary)', 
            borderRadius: '50%',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            transform: `translate(calc(-50% + ${gameState.player.direction.x * 22}px), calc(-50% + ${gameState.player.direction.y * 22}px))`
          }} />
          
          {/* Player holding item */}
          {gameState.player.item && renderItem(gameState.player.item.type, 0, -24, 'player_item')}
        </div>
        {/* End Game Overlay */}
        {(gameState.status === 'won' || gameState.status === 'lost') && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100,
            display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center'
          }}>
            <h1 style={{
              fontSize: '4rem',
              color: gameState.status === 'won' ? 'var(--color-success)' : 'var(--color-danger)',
              textShadow: '2px 2px 0 black, -2px -2px 0 black, 2px -2px 0 black, -2px 2px 0 black',
              marginBottom: '1rem'
            }}>
              {gameState.status === 'won' ? 'Victory!' : 'Game Over'}
            </h1>
            <p style={{ fontSize: '2rem', color: 'white', marginBottom: '2rem' }}>Final Score: {gameState.score}</p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn" onClick={() => {
                gameEngine.reset(mode, difficulty);
                gameEngine.start();
                audioManager.playBGM();
              }}>Play Again</button>
              <button className="btn btn-secondary" onClick={onBack}>Main Menu</button>
            </div>
          </div>
        )}
      </div>

      {showRecipes && (
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="hud-panel" style={{ width: '700px', backgroundColor: 'var(--color-background)', padding: '2rem', color: 'var(--color-text)', position: 'relative' }}>
            <button onClick={() => setShowRecipes(false)} className="btn btn-secondary" style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '8px 16px' }}>X</button>
            <h2 style={{ marginBottom: '1rem', color: 'var(--color-primary)', borderBottom: '2px solid #ddd', paddingBottom: '0.5rem' }}>🍳 Recipe Book</h2>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '1.2rem', lineHeight: '1.8' }}>
              <li>🍔 <strong>Cheeseburger:</strong> 🍞 Bread + 🍖 Cooked Meat + 🧀 Cheese</li>
              <li>🥗 <strong>Salad:</strong> 🥣 Chopped Tomato + 🥣 Chopped Cabbage</li>
              <li>🍟 <strong>Fries:</strong> 🔪🥔 Chopped Potato cooked in Pan</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenGame;
