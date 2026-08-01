import { inputManager } from './InputManager';
import { audioManager } from './AudioManager';

export interface Vector2 { x: number; y: number; }
export interface Rect { x: number; y: number; w: number; h: number; }

export type ItemType = 'tomato' | 'tomato_slices' | 'cabbage' | 'cabbage_slices' | 'meat' | 'cooked_meat' | 'burnt_meat' | 'bread' | 'burger' | 'salad' | 'cheese' | 'potato' | 'chopped_potato' | 'fries' | 'burnt_fries' | 'meat_on_bread' | 'cheese_on_bread';

export interface Item {
  type: ItemType;
}

export type CounterType = 'clear' | 'container' | 'cutting' | 'stove' | 'delivery' | 'fryer' | 'trash';

export interface Counter {
  id: string;
  type: CounterType;
  rect: Rect;
  item: Item | null;
  containerItem?: ItemType;
  progress?: number; // 0-100 for cutting/cooking
}

export interface Player {
  rect: Rect;
  speed: number;
  direction: { x: number, y: number };
  item: Item | null;
  isMoving: boolean;
}

export interface GameState {
  player: Player;
  counters: Counter[];
  orders: { id: string, type: 'burger' | 'salad', timer: number }[];
  score: number;
  timeLeft: number;
  status: 'playing' | 'paused' | 'won' | 'lost';
  mode: 'challenge' | 'endless';
  difficulty: 'easy' | 'normal' | 'hard';
}

export class GameEngine {
  public state: GameState;
  private lastTime: number = 0;
  private animationFrameId: number = 0;
  private subscribers: ((state: GameState) => void)[] = [];

  constructor() {
    this.state = {
      player: {
        rect: { x: 400, y: 225, w: 40, h: 40 },
        speed: 200, // px per sec
        direction: { x: 0, y: 1 },
        item: null,
        isMoving: false,
      },
      counters: this.initializeCounters(),
      orders: [],
      score: 0,
      timeLeft: 120,
      status: 'playing',
      mode: 'challenge',
      difficulty: 'normal',
    };
  }

  public reset(mode: 'challenge' | 'endless' = 'challenge', difficulty: 'easy' | 'normal' | 'hard' = 'normal') {
    this.state = {
      player: {
        rect: { x: 400, y: 225, w: 40, h: 40 },
        speed: 200,
        direction: { x: 0, y: 1 },
        item: null,
        isMoving: false,
      },
      counters: this.initializeCounters(),
      orders: [],
      score: 0,
      timeLeft: 120,
      status: 'playing',
      mode: mode,
      difficulty: difficulty,
    };
    this.spawnOrderTimer = 0;
  }

  private initializeCounters(): Counter[] {
    const counters: Counter[] = [];
    const tileSize = 50;
    
    // Top wall
    for (let i = 0; i < 16; i++) {
      if (i === 2) counters.push({ id: `top_${i}`, type: 'container', rect: { x: i * tileSize, y: 0, w: tileSize, h: tileSize }, item: null, containerItem: 'tomato' });
      else if (i === 4) counters.push({ id: `top_${i}`, type: 'container', rect: { x: i * tileSize, y: 0, w: tileSize, h: tileSize }, item: null, containerItem: 'cabbage' });
      else if (i === 6) counters.push({ id: `top_${i}`, type: 'container', rect: { x: i * tileSize, y: 0, w: tileSize, h: tileSize }, item: null, containerItem: 'potato' });
      else if (i === 12) counters.push({ id: `top_${i}`, type: 'container', rect: { x: i * tileSize, y: 0, w: tileSize, h: tileSize }, item: null, containerItem: 'cheese' });
      else if (i === 8) counters.push({ id: `top_${i}`, type: 'delivery', rect: { x: i * tileSize, y: 0, w: tileSize, h: tileSize }, item: null });
      else counters.push({ id: `top_${i}`, type: 'clear', rect: { x: i * tileSize, y: 0, w: tileSize, h: tileSize }, item: null });
    }
    
    // Bottom wall
    for (let i = 0; i < 16; i++) {
      if (i === 3) counters.push({ id: `bot_${i}`, type: 'cutting', rect: { x: i * tileSize, y: 8 * tileSize, w: tileSize, h: tileSize }, item: null, progress: 0 });
      else if (i === 5) counters.push({ id: `bot_${i}`, type: 'cutting', rect: { x: i * tileSize, y: 8 * tileSize, w: tileSize, h: tileSize }, item: null, progress: 0 });
      else if (i === 10) counters.push({ id: `bot_${i}`, type: 'stove', rect: { x: i * tileSize, y: 8 * tileSize, w: tileSize, h: tileSize }, item: null, progress: 0 });
      else if (i === 12) counters.push({ id: `bot_${i}`, type: 'fryer', rect: { x: i * tileSize, y: 8 * tileSize, w: tileSize, h: tileSize }, item: null, progress: 0 });
      else if (i === 13) counters.push({ id: `bot_${i}`, type: 'trash', rect: { x: i * tileSize, y: 8 * tileSize, w: tileSize, h: tileSize }, item: null });
      else counters.push({ id: `bot_${i}`, type: 'clear', rect: { x: i * tileSize, y: 8 * tileSize, w: tileSize, h: tileSize }, item: null });
    }
    
    // Left and Right walls
    for (let j = 1; j < 8; j++) {
      if (j === 4) {
        counters.push({ id: `left_${j}`, type: 'container', rect: { x: 0, y: j * tileSize, w: tileSize, h: tileSize }, item: null, containerItem: 'meat' });
        counters.push({ id: `right_${j}`, type: 'container', rect: { x: 15 * tileSize, y: j * tileSize, w: tileSize, h: tileSize }, item: null, containerItem: 'bread' });
      } else {
        counters.push({ id: `left_${j}`, type: 'clear', rect: { x: 0, y: j * tileSize, w: tileSize, h: tileSize }, item: null });
        counters.push({ id: `right_${j}`, type: 'clear', rect: { x: 15 * tileSize, y: j * tileSize, w: tileSize, h: tileSize }, item: null });
      }
    }

    return counters;
  }

  public start() {
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    cancelAnimationFrame(this.animationFrameId);
  }

  public subscribe(callback: (state: GameState) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(c => c !== callback);
    };
  }

  public togglePause() {
    if (this.state.status === 'playing') {
      this.state.status = 'paused';
    } else if (this.state.status === 'paused') {
      this.state.status = 'playing';
      this.lastTime = performance.now(); // prevent huge dt jump
    }
    this.notify();
  }

  private notify() {
    // We pass a shallow copy so React detects changes if we want, but typically we just force update.
    this.subscribers.forEach(cb => cb(this.state));
  }

  private loop = (time: number) => {
    const dt = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.update(dt);
    this.notify();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private checkCollision(rect1: Rect, rect2: Rect): boolean {
    return (
      rect1.x < rect2.x + rect2.w &&
      rect1.x + rect1.w > rect2.x &&
      rect1.y < rect2.y + rect2.h &&
      rect1.y + rect1.h > rect2.y
    );
  }

  private spawnOrderTimer: number = 0;

  private update(dt: number) {
    if (this.state.status !== 'playing') return;

    if (this.state.mode === 'challenge') {
      const prevTime = this.state.timeLeft;
      this.state.timeLeft -= dt;
      
      // Play a ticking sound when time is 10 seconds or lower
      if (this.state.timeLeft <= 10 && this.state.timeLeft > 0) {
        if (Math.floor(prevTime) !== Math.floor(this.state.timeLeft)) {
          audioManager.playTick();
        }
      }

      if (this.state.score >= 500) {
        this.state.status = 'won';
        audioManager.playDeliver(); // Play a nice sound for winning
      } else if (this.state.timeLeft <= 0) {
        this.state.timeLeft = 0;
        this.state.status = 'lost';
        audioManager.playGameOver(); // Play specific game over sound
      }
    }

    if (this.state.status !== 'playing') return;

    // Stove & Fryer logic
    let isCookingAny = false;
    for (const counter of this.state.counters) {
      if (counter.type === 'stove' && counter.item) {
        if (counter.item.type === 'meat') {
          counter.progress = (counter.progress || 0) + 15 * dt;
          isCookingAny = true;
          if (counter.progress >= 100) {
            counter.item.type = 'cooked_meat';
            counter.progress = 0;
          }
        } else if (counter.item.type === 'cooked_meat') {
          counter.progress = (counter.progress || 0) + 10 * dt;
          isCookingAny = true;
          if (counter.progress >= 100) {
            counter.item.type = 'burnt_meat';
            counter.progress = 0;
          }
        }
      }
      if (counter.type === 'fryer' && counter.item) {
        if (counter.item.type === 'chopped_potato') {
          counter.progress = (counter.progress || 0) + 20 * dt;
          isCookingAny = true;
          if (counter.progress >= 100) {
            counter.item.type = 'fries';
            counter.progress = 0;
          }
        } else if (counter.item.type === 'fries') {
          counter.progress = (counter.progress || 0) + 10 * dt;
          isCookingAny = true;
          if (counter.progress >= 100) {
            counter.item.type = 'burnt_fries';
            counter.progress = 0;
          }
        }
      }
    }
    audioManager.setCooking(isCookingAny);

    // Order logic
    this.spawnOrderTimer -= dt;
    if (this.spawnOrderTimer <= 0) {
      const spawnInterval = this.state.difficulty === 'easy' ? 20 : this.state.difficulty === 'hard' ? 10 : 15;
      const orderDuration = this.state.difficulty === 'easy' ? 90 : this.state.difficulty === 'hard' ? 40 : 60;
      this.spawnOrderTimer = spawnInterval;
      if (this.state.orders.length < 4) {
        const types: ItemType[] = ['burger', 'salad', 'fries'];
        const type = types[Math.floor(Math.random() * types.length)] as 'burger' | 'salad' | 'fries';
        this.state.orders.push({
          id: Math.random().toString(36).substring(7),
          type: type as any, // keeping the type string simple in state for now
          timer: orderDuration,
        });
      }
    }

    // Update order timers
    for (let i = this.state.orders.length - 1; i >= 0; i--) {
      this.state.orders[i].timer -= dt;
      if (this.state.orders[i].timer <= 0) {
        // Expired
        this.state.score -= 50;
        this.state.orders.splice(i, 1);
        audioManager.playError();
      }
    }

    // Chopping logic (hold F)
    if (inputManager.isKeyDown('f')) {
      const counter = this.getFacingCounter();
      if (counter && counter.type === 'cutting' && counter.item) {
        if (counter.item.type === 'tomato' || counter.item.type === 'cabbage' || counter.item.type === 'potato') {
          counter.progress = (counter.progress || 0) + 50 * dt; // takes 2 seconds to chop
          if (Math.random() < 0.1) audioManager.playChop(); // play sound randomly while holding
          if (counter.progress >= 100) {
            counter.item.type = counter.item.type === 'tomato' ? 'tomato_slices' 
                              : counter.item.type === 'cabbage' ? 'cabbage_slices' 
                              : 'chopped_potato';
            counter.progress = 0;
          }
        }
      }
    }

    // Movement
    let dx = 0;
    let dy = 0;
    if (inputManager.isKeyDown('w') || inputManager.isKeyDown('arrowup')) dy -= 1;
    if (inputManager.isKeyDown('s') || inputManager.isKeyDown('arrowdown')) dy += 1;
    if (inputManager.isKeyDown('a') || inputManager.isKeyDown('arrowleft')) dx -= 1;
    if (inputManager.isKeyDown('d') || inputManager.isKeyDown('arrowright')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      audioManager.playWalk();
    }

    // Normalize
    if (dx !== 0 && dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }

    if (dx !== 0 || dy !== 0) {
      this.state.player.direction = { x: dx, y: dy };
      this.state.player.isMoving = true;
    } else {
      this.state.player.isMoving = false;
    }

    const nextX = this.state.player.rect.x + dx * this.state.player.speed * dt;
    const nextY = this.state.player.rect.y + dy * this.state.player.speed * dt;

    // Collision check X
    let collisionX = false;
    const rectX = { ...this.state.player.rect, x: nextX };
    for (const counter of this.state.counters) {
      if (this.checkCollision(rectX, counter.rect)) {
        collisionX = true;
        break;
      }
    }
    if (!collisionX) {
      this.state.player.rect.x = nextX;
    }

    // Collision check Y
    let collisionY = false;
    const rectY = { ...this.state.player.rect, y: nextY };
    for (const counter of this.state.counters) {
      if (this.checkCollision(rectY, counter.rect)) {
        collisionY = true;
        break;
      }
    }
    if (!collisionY) {
      this.state.player.rect.y = nextY;
    }
    
    // Bounds check
    if (this.state.player.rect.x < 0) this.state.player.rect.x = 0;
    if (this.state.player.rect.y < 0) this.state.player.rect.y = 0;
    if (this.state.player.rect.x > 800 - this.state.player.rect.w) this.state.player.rect.x = 800 - this.state.player.rect.w;
    if (this.state.player.rect.y > 450 - this.state.player.rect.h) this.state.player.rect.y = 450 - this.state.player.rect.h;
  }

  public getFacingCounter(): Counter | null {
    const { rect, direction } = this.state.player;
    // Look ahead a bit
    const interactRect = {
      x: rect.x + direction.x * 20,
      y: rect.y + direction.y * 20,
      w: rect.w,
      h: rect.h
    };

    let closest: Counter | null = null;
    let minDist = Infinity;

    for (const counter of this.state.counters) {
      if (this.checkCollision(interactRect, counter.rect)) {
        const cx = counter.rect.x + counter.rect.w / 2;
        const cy = counter.rect.y + counter.rect.h / 2;
        const px = rect.x + rect.w / 2;
        const py = rect.y + rect.h / 2;
        const dist = (cx - px) ** 2 + (cy - py) ** 2;
        if (dist < minDist) {
          minDist = dist;
          closest = counter;
        }
      }
    }
    return closest;
  }

  public interact() {
    const counter = this.getFacingCounter();
    if (!counter) return;

    const pItem = this.state.player.item;
    const cItem = counter.item;

    if (counter.type === 'container') {
      if (!pItem) {
        this.state.player.item = { type: counter.containerItem! };
        audioManager.playPickup();
      }
    } else if (counter.type === 'delivery') {
      if (pItem) {
        // Deliver! Check order
        const orderIndex = this.state.orders.findIndex(o => o.type === pItem.type);
        if (orderIndex !== -1) {
          this.state.score += 100;
          this.state.orders.splice(orderIndex, 1);
          audioManager.playDeliver();
        } else {
          this.state.score -= 20; // wrong item
          audioManager.playError();
        }
        this.state.player.item = null;
      }
    } else if (counter.type === 'trash') {
      if (pItem) {
        // Discard item
        this.state.player.item = null;
        audioManager.playTrash();
      }
    } else {
      if (pItem && !cItem) {
        // Drop item
        counter.item = pItem;
        this.state.player.item = null;
        if (counter.type === 'cutting') counter.progress = 0;
        if (counter.type === 'stove') counter.progress = 0;
        if (counter.type === 'fryer') counter.progress = 0;
        audioManager.playDrop();
      } else if (!pItem && cItem) {
        // Pick up item
        this.state.player.item = cItem;
        counter.item = null;
        counter.progress = 0;
        audioManager.playPickup();
      } else if (pItem && cItem) {
        // Combine items
        if (counter.type === 'clear') {
          // Tomato Slices + Cabbage Slices = Salad
          if ((pItem.type === 'tomato_slices' && cItem.type === 'cabbage_slices') ||
              (pItem.type === 'cabbage_slices' && cItem.type === 'tomato_slices')) {
             counter.item = { type: 'salad' };
             this.state.player.item = null;
             audioManager.playDrop();
          }
          // Bread + Meat = Meat on Bread
          else if ((pItem.type === 'bread' && cItem.type === 'cooked_meat') || 
                   (pItem.type === 'cooked_meat' && cItem.type === 'bread')) {
             counter.item = { type: 'meat_on_bread' };
             this.state.player.item = null;
             audioManager.playDrop();
          }
          // Bread + Cheese = Cheese on Bread
          else if ((pItem.type === 'bread' && cItem.type === 'cheese') || 
                   (pItem.type === 'cheese' && cItem.type === 'bread')) {
             counter.item = { type: 'cheese_on_bread' };
             this.state.player.item = null;
             audioManager.playDrop();
          }
          // Meat on Bread + Cheese = Burger
          else if ((pItem.type === 'meat_on_bread' && cItem.type === 'cheese') || 
                   (pItem.type === 'cheese' && cItem.type === 'meat_on_bread')) {
             counter.item = { type: 'burger' };
             this.state.player.item = null;
             audioManager.playDrop();
          }
          // Cheese on Bread + Meat = Burger
          else if ((pItem.type === 'cheese_on_bread' && cItem.type === 'cooked_meat') || 
                   (pItem.type === 'cooked_meat' && cItem.type === 'cheese_on_bread')) {
             counter.item = { type: 'burger' };
             this.state.player.item = null;
             audioManager.playDrop();
          }
        }
      }
    }
  }

  // interactAlternate is no longer used since chopping is now hold-to-chop in update()
  public interactAlternate() {}
}

export const gameEngine = new GameEngine();
