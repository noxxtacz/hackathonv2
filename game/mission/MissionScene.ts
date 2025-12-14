import * as Phaser from 'phaser';
import { getDifficultyParams } from '@/lib/mapping';
import { Difficulty, Mood, MOTIVATIONAL_QUOTES } from '@/lib/types';
import { CozyTheme, CozyHUD, CozyParticles, CozyAudio, CozyTransitions } from '@/game/shared';

interface Firefly {
  container: Phaser.GameObjects.Container;
  core: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
  vx: number;
  vy: number;
  baseY: number;
  bobPhase: number;
}

export class MissionScene extends Phaser.Scene {
  private fireflies: Firefly[] = [];
  private score = 0;
  private timeLeft = 60;
  private params!: ReturnType<typeof getDifficultyParams>;
  private spawnTimer!: Phaser.Time.TimerEvent;
  private gameTimer!: Phaser.Time.TimerEvent;
  private gameEnded = false;
  private startTime = 0;
  private mood: Mood = 'neutral';
  private difficulty: Difficulty = 'normal';
  
  // Cozy additions
  private hud!: CozyHUD;
  private stars: Phaser.GameObjects.Arc[] = [];
  private fog: Phaser.GameObjects.Arc[] = [];
  private comboCount = 0;
  private lastCatchTime = 0;
  private comboTimeout = 2000;
  private isPaused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  
  // Flow meter
  private flowValue = 0;
  private flowBar!: Phaser.GameObjects.Graphics;
  private flowText!: Phaser.GameObjects.Text;
  private lastClickTime = 0;
  private flowDecayTimer = 0;
  
  // Anti-spam cooldown
  private catchCooldown = false;
  private catchCooldownTime = 150; // ms between catches

  constructor() {
    super({ key: 'MissionScene' });
  }

  preload() {
    CozyAudio.preloadSounds(this);
  }

  create() {
    // Get difficulty from window
    this.difficulty = ((window as any).gameDifficulty || 'normal') as Difficulty;
    this.mood = ((window as any).gameMood || 'neutral') as Mood;
    this.params = getDifficultyParams(this.difficulty);
    this.timeLeft = this.params.duration;
    this.score = 0;
    this.gameEnded = false;
    this.startTime = Date.now();
    this.comboCount = 0;
    this.isPaused = false;
    this.flowValue = 0;

    // Apply cozy background
    CozyTheme.applyBackground(this, 800, 600);
    
    // Add moon glow
    CozyTheme.addMoonGlow(this, 700, 100, 60);
    
    // Create starfield
    this.stars = CozyParticles.createStarfield(this, 800, 600, 120);
    
    // Add nebula fog
    this.fog = CozyParticles.createNebulaFog(this, 800, 600, 8);
    
    // Schedule shooting stars
    CozyParticles.scheduleShootingStars(this, 800, 600);
    
    // Add vignette
    CozyTransitions.createVignette(this, 0.3);
    
    // Add rounded frame
    CozyTheme.addRoundedFrame(this, 10, 50, 780, 540, 20, 0x9b59b6, 0.3);

    // Create cozy HUD
    this.hud = CozyHUD.create(this, {
      mode: this.difficulty.toUpperCase() as 'CALM' | 'NORMAL' | 'FOCUS',
      getScore: () => this.score,
      getTimeLeft: () => this.timeLeft,
    });

    // Create flow meter
    this.createFlowMeter();

    // Fade in
    CozyTransitions.sceneFadeIn(this);

    // Setup pause key
    this.input.keyboard?.on('keydown-P', () => {
      this.togglePause();
    });
    
    // Setup click handler for magnetism
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleClick(pointer.x, pointer.y);
    });

    // Spawn timer
    this.spawnTimer = this.time.addEvent({
      delay: this.params.spawnRate,
      callback: this.spawnFirefly,
      callbackScope: this,
      loop: true,
    });

    // Game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

    // Spawn initial fireflies
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 800, () => this.spawnFirefly());
    }
  }

  createFlowMeter() {
    // Flow bar background
    const barWidth = 200;
    const barHeight = 8;
    const barX = 400 - barWidth / 2;
    const barY = 560;
    
    this.flowBar = this.add.graphics();
    this.flowBar.setDepth(1000);
    
    // Flow text
    this.flowText = this.add.text(400, barY - 20, '', {
      fontSize: '14px',
      color: '#ffd700',
      fontFamily: 'Arial',
      fontStyle: 'italic',
    });
    this.flowText.setOrigin(0.5);
    this.flowText.setDepth(1000);
    this.flowText.setAlpha(0);
  }

  updateFlowMeter() {
    const barWidth = 200;
    const barHeight = 8;
    const barX = 400 - barWidth / 2;
    const barY = 560;
    
    this.flowBar.clear();
    
    // Background
    this.flowBar.fillStyle(0x000000, 0.3);
    this.flowBar.fillRoundedRect(barX, barY, barWidth, barHeight, 4);
    
    // Flow fill
    if (this.flowValue > 0) {
      const fillWidth = (this.flowValue / 100) * barWidth;
      const color = this.flowValue > 75 ? 0x9b59b6 : this.flowValue > 50 ? 0xffd700 : 0x87ceeb;
      this.flowBar.fillStyle(color, 0.8);
      this.flowBar.fillRoundedRect(barX, barY, fillWidth, barHeight, 4);
    }
    
    // Update flow text
    if (this.flowValue > 75) {
      this.flowText.setText('In the zone 🌙');
      this.flowText.setAlpha(1);
    } else if (this.flowValue > 50) {
      this.flowText.setText('Smooth ✨');
      this.flowText.setAlpha(1);
    } else if (this.flowValue > 25) {
      this.flowText.setText('Nice rhythm ✨');
      this.flowText.setAlpha(1);
    } else {
      this.flowText.setAlpha(0);
    }
  }

  getAssistRadius(): number {
    switch (this.difficulty) {
      case 'calm': return 50;
      case 'normal': return 30;
      case 'focus': return 15;
      default: return 30;
    }
  }

  handleClick(x: number, y: number) {
    if (this.gameEnded || this.isPaused) return;
    
    // Find nearest firefly within assist radius
    let nearest: Firefly | null = null;
    let minDist = this.getAssistRadius();
    
    this.fireflies.forEach(firefly => {
      const dist = Phaser.Math.Distance.Between(x, y, firefly.container.x, firefly.container.y);
      if (dist < minDist) {
        minDist = dist;
        nearest = firefly;
      }
    });
    
    if (nearest) {
      // Update flow meter on successful catch
      const now = Date.now();
      if (this.lastClickTime > 0 && now - this.lastClickTime < 1500) {
        // Quick succession - build flow
        this.flowValue = Math.min(100, this.flowValue + 10);
      } else if (this.lastClickTime === 0) {
        // First catch - start building flow
        this.flowValue = Math.min(100, this.flowValue + 5);
      }
      this.lastClickTime = now;
      this.flowDecayTimer = 0;
      
      this.catchFirefly(nearest);
    } else {
      // Miss - show dust poof (no flow reward)
      CozyParticles.createPoof(this, x, y);
      CozyAudio.playClick(this);
    }
  }


  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.spawnTimer.paused = true;
      this.gameTimer.paused = true;
      this.pauseOverlay = CozyTransitions.createPauseOverlay(this);
      (window as any).onGamePause?.(true);
    } else {
      this.spawnTimer.paused = false;
      this.gameTimer.paused = false;
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
      (window as any).onGamePause?.(false);
    }
  }

  spawnFirefly() {
    if (this.gameEnded || this.fireflies.length >= this.params.maxFireflies || this.isPaused) return;

    const x = Phaser.Math.Between(80, 720);
    const y = Phaser.Math.Between(100, 500);
    const size = this.params.size;

    // Create container for layered firefly
    const container = this.add.container(x, y);
    container.setDepth(10);

    // Outer halo (lowest layer)
    const halo = this.add.circle(0, 0, size * 3, 0xffee88, 0.08);
    
    // Glow layer with ADD blend
    const glow = this.add.circle(0, 0, size * 1.8, 0xffff88, 0.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);

    // Core (brightest)
    const core = this.add.circle(0, 0, size, 0xffffff, 1);
    core.setBlendMode(Phaser.BlendModes.ADD);

    container.add([halo, glow, core]);
    container.setSize(size * 6, size * 6);
    container.setInteractive({ useHandCursor: true });

    // Random velocity for gentle wandering
    const speed = this.params.speed * 0.7; // Slower, more graceful
    const vx = Phaser.Math.FloatBetween(-speed, speed);
    const vy = Phaser.Math.FloatBetween(-speed, speed);

    // Random bobbing phase
    const bobPhase = Phaser.Math.FloatBetween(0, Math.PI * 2);

    const firefly: Firefly = { container, core, glow, halo, vx, vy, baseY: y, bobPhase };
    this.fireflies.push(firefly);

    // Spawn bloom animation
    container.setScale(0);
    container.setAlpha(0);
    this.tweens.add({
      targets: container,
      scale: 1,
      alpha: 1,
      duration: 600,
      ease: 'Back.easeOut',
    });

    // Glow pulse with random phase
    this.tweens.add({
      targets: [glow, halo],
      alpha: `+=0.15`,
      duration: Phaser.Math.Between(1000, 1500),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: Phaser.Math.Between(0, 500),
    });

    // Click handler
    container.on('pointerdown', () => {
      if (!this.catchCooldown) {
        this.catchFirefly(firefly);
      }
    });
  }

  catchFirefly(firefly: Firefly) {
    if (this.gameEnded || this.isPaused || this.catchCooldown) return;
    
    // Set cooldown to prevent spam
    this.catchCooldown = true;
    this.time.delayedCall(this.catchCooldownTime, () => {
      this.catchCooldown = false;
    });

    const index = this.fireflies.indexOf(firefly);
    if (index > -1) {
      this.fireflies.splice(index, 1);
    } else {
      return; // Already caught
    }

    const x = firefly.container.x;
    const y = firefly.container.y;

    // Combo tracking
    const now = Date.now();
    if (now - this.lastCatchTime < this.comboTimeout) {
      this.comboCount++;
    } else {
      this.comboCount = 1;
    }
    this.lastCatchTime = now;

    // Ripple ring effect
    const ripple = this.add.circle(x, y, firefly.core.radius, 0xffff88, 0.6);
    ripple.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ripple,
      scale: 4,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => ripple.destroy(),
    });

    // Sparkle burst
    CozyTheme.createSparkles(this, x, y, 12);
    
    // Warm flash
    CozyTransitions.flashScreen(this, 0xffee88, 0.15, 150);
    
    // Play success sound
    CozyAudio.playSuccess(this, 0.25);

    // Destroy firefly with fade
    this.tweens.add({
      targets: firefly.container,
      scale: 1.5,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => firefly.container.destroy(),
    });

    // Update score
    const points = 10 + (this.comboCount > 1 ? (this.comboCount - 1) * 5 : 0);
    this.score += points;

    // Show floating text
    this.hud.showFloatingText(x, y, `+${points}`, '#90ee90');

    // Show combo feedback
    if (this.comboCount === 3) {
      this.hud.showFeedback('Nice!', '#87ceeb', 1200);
    } else if (this.comboCount === 5) {
      this.hud.showFeedback('Great!', '#ffd700', 1200);
    } else if (this.comboCount === 8) {
      this.hud.showFeedback('Amazing!', '#ff69b4', 1200);
    } else if (this.comboCount >= 10) {
      this.hud.showFeedback('Incredible!', '#9b59b6', 1500);
    }
  }

  updateTimer() {
    if (this.gameEnded || this.isPaused) return;
    this.timeLeft--;
    if (this.timeLeft <= 0) {
      this.endGame();
    }
  }

  update(time: number, delta: number) {
    if (this.gameEnded || this.isPaused) return;

    // Update HUD
    this.hud.update(time, delta);

    // Flow decay
    this.flowDecayTimer += delta;
    if (this.flowDecayTimer > 100) {
      this.flowValue = Math.max(0, this.flowValue - 0.5);
      this.flowDecayTimer = 0;
    }
    this.updateFlowMeter();

    // Move fireflies with organic motion
    this.fireflies.forEach((firefly) => {
      // Wandering movement
      firefly.container.x += firefly.vx * (delta / 16);
      firefly.container.y += firefly.vy * (delta / 16);

      // Organic bobbing
      firefly.bobPhase += delta * 0.001;
      const bobOffset = Math.sin(firefly.bobPhase) * 3;
      firefly.container.y = firefly.baseY + bobOffset;

      // Gentle direction changes
      if (Math.random() < 0.01) {
        firefly.vx += Phaser.Math.FloatBetween(-0.2, 0.2);
        firefly.vy += Phaser.Math.FloatBetween(-0.2, 0.2);
        firefly.vx = Phaser.Math.Clamp(firefly.vx, -this.params.speed, this.params.speed);
        firefly.vy = Phaser.Math.Clamp(firefly.vy, -this.params.speed, this.params.speed);
      }

      // Bounce off walls softly
      if (firefly.container.x <= 80 || firefly.container.x >= 720) {
        firefly.vx *= -0.8;
        firefly.container.x = Phaser.Math.Clamp(firefly.container.x, 80, 720);
      }
      if (firefly.container.y <= 100 || firefly.container.y >= 500) {
        firefly.vy *= -0.8;
        firefly.baseY = Phaser.Math.Clamp(firefly.container.y, 100, 500);
      }
    });
  }

  endGame() {
    this.gameEnded = true;
    this.spawnTimer.destroy();
    this.gameTimer.destroy();

    // Clean up
    this.hud.destroy();
    this.flowBar.destroy();
    this.flowText.destroy();
    CozyParticles.destroyParticles(this.stars);
    CozyParticles.destroyParticles(this.fog);

    // Calculate calm score using difficulty-based targets
    // Target scores: calm=8, normal=12, focus=16 catches (at 10 points each = 80/120/160)
    const targetScores: Record<string, number> = { calm: 80, normal: 120, focus: 160 };
    const target = targetScores[this.difficulty] || 120;
    
    // Clamp helper
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    
    // Calm score = percentage of target achieved, capped at 100
    const calmScore = clamp(Math.round((this.score / target) * 100), 0, 100);
    const duration = Math.floor((Date.now() - this.startTime) / 1000);

    // Build payload with REAL values
    const payload = {
      type: 'fireflies' as const,
      score: this.score,
      calmScore: calmScore,
      durationSec: duration,
    };

    // Debug log - VERBOSE
    console.log('============================================');
    console.log('[MissionScene] END GAME - FINAL VALUES');
    console.log('[MissionScene] this.score =', this.score);
    console.log('[MissionScene] target =', target, '(difficulty:', this.difficulty, ')');
    console.log('[MissionScene] calmScore =', calmScore);
    console.log('[MissionScene] duration =', duration);
    console.log('[MissionScene] PAYLOAD:', JSON.stringify(payload));
    console.log('============================================');

    // Show game over overlay
    CozyTransitions.createGameOverOverlay(this, '🌟 Well Done! 🌟');

    // Fade out and emit completion event
    CozyTransitions.sceneFadeOut(this, 800, () => {
      // Emit game completion event to the page
      console.log('[MissionScene] Emitting mission:complete with payload');
      this.game.events.emit('mission:complete', payload);
      
      // Legacy callback support
      (window as any).onGameEnd?.(payload.score, payload.calmScore, payload.durationSec);
    });
  }
}

