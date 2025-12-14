import * as Phaser from 'phaser';
import { Difficulty, Mood, MOTIVATIONAL_QUOTES } from '@/lib/types';
import { CozyTheme, CozyHUD, CozyParticles, CozyAudio, CozyTransitions, CozyTrail } from '@/game/shared';

interface Lantern {
  container: Phaser.GameObjects.Container;
  core: Phaser.GameObjects.Arc;
  glow: Phaser.GameObjects.Arc;
  halo: Phaser.GameObjects.Arc;
}

interface Cloud {
  container: Phaser.GameObjects.Container;
  layers: Phaser.GameObjects.Arc[];
}

interface GlideDifficultyConfig {
  worldSpeed: number;
  playerSpeed: number;
  lanternSize: number;
  cloudSize: number;
  spawnRate: number;
  cloudSpawnRate: number;
  duration: number;
}

export class GlideScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Arc;
  private playerGlow!: Phaser.GameObjects.Arc;
  private playerTrail?: CozyTrail;
  private targetPlayerY = 300;
  private lanterns: Lantern[] = [];
  private clouds: Cloud[] = [];
  private score = 0;
  private timeLeft = 60;
  private config!: GlideDifficultyConfig;
  private gameEnded = false;
  private startTime = 0;
  private difficulty: Difficulty = 'normal';
  private mood: Mood = 'neutral';
  
  // Cozy additions
  private hud!: CozyHUD;
  private stars: Phaser.GameObjects.Arc[] = [];
  private parallaxLayers: { graphics: Phaser.GameObjects.Graphics; speed: number }[] = [];
  private isPaused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private lanternTimer!: Phaser.Time.TimerEvent;
  private cloudTimer!: Phaser.Time.TimerEvent;
  private gameTimer!: Phaser.Time.TimerEvent;
  
  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private pointerY = 300;

  constructor() {
    super({ key: 'GlideScene' });
  }

  preload() {
    // Preload sound effects
    CozyAudio.preloadSounds(this);
  }

  create() {
    // Get difficulty from window
    this.difficulty = ((window as any).gameDifficulty || 'normal') as Difficulty;
    this.mood = ((window as any).gameMood || 'neutral') as Mood;
    this.config = this.getDifficultyConfig(this.difficulty);
    this.timeLeft = this.config.duration;
    this.score = 0;
    this.gameEnded = false;
    this.startTime = Date.now();
    this.isPaused = false;
    this.targetPlayerY = 300;

    // Apply cozy background
    CozyTheme.applyBackground(this, 800, 600);
    
    // Add moon glow
    CozyTheme.addMoonGlow(this, 700, 100, 60);
    
    // Create parallax layers (3 depth layers for mountains/hills)
    this.parallaxLayers = CozyTheme.createParallaxLayers(this, 800, 600);
    
    // Add nebula fog atmosphere
    CozyParticles.createNebulaFog(this, 800, 600);
    
    // Schedule shooting stars
    CozyParticles.scheduleShootingStars(this, 800, 600);
    
    // Create starfield (will scroll)
    this.stars = CozyParticles.createStarfield(this, 800, 600, 80);
    
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

    // Create player (left side, vertical center)
    const playerX = 100;
    const playerY = 300;
    
    this.playerGlow = this.add.circle(playerX, playerY, 25, 0xffffff, 0.3);
    this.player = this.add.circle(playerX, playerY, 15, 0xffffff, 1);
    
    // Create player trail
    this.playerTrail = CozyTrail.create(this, 800, 600);

    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys();
    
    // Track pointer Y position
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      this.pointerY = Phaser.Math.Clamp(pointer.y, 100, 550);
    });

    // Setup pause key
    this.input.keyboard?.on('keydown-P', () => {
      this.togglePause();
    });

    // Fade in
    CozyTransitions.sceneFadeIn(this);

    // Spawn timers
    this.lanternTimer = this.time.addEvent({
      delay: this.config.spawnRate,
      callback: this.spawnLantern,
      callbackScope: this,
      loop: true,
    });

    this.cloudTimer = this.time.addEvent({
      delay: this.config.cloudSpawnRate,
      callback: this.spawnCloud,
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

    // Spawn initial lanterns
    for (let i = 0; i < 3; i++) {
      this.time.delayedCall(i * 1000, () => this.spawnLantern());
    }

    // Show motivational quotes every 15 seconds
    this.time.addEvent({
      delay: 15000,
      callback: this.showMotivationalQuote,
      callbackScope: this,
      loop: true,
    });

    // Show first quote after 5 seconds
    this.time.delayedCall(5000, () => this.showMotivationalQuote());
  }

  getDifficultyConfig(difficulty: Difficulty): GlideDifficultyConfig {
    switch (difficulty) {
      case 'calm':
        return {
          worldSpeed: 120,
          playerSpeed: 200,
          lanternSize: 18,
          cloudSize: 35,
          spawnRate: 2000,
          cloudSpawnRate: 4000,
          duration: 60,
        };
      case 'focus':
        return {
          worldSpeed: 200,
          playerSpeed: 280,
          lanternSize: 14,
          cloudSize: 30,
          spawnRate: 1400,
          cloudSpawnRate: 2500,
          duration: 45,
        };
      case 'normal':
      default:
        return {
          worldSpeed: 160,
          playerSpeed: 240,
          lanternSize: 16,
          cloudSize: 32,
          spawnRate: 1700,
          cloudSpawnRate: 3000,
          duration: 50,
        };
    }
  }

  showMotivationalQuote() {
    if (this.gameEnded || this.isPaused) return;

    // Get mood-specific quotes
    const quotes = MOTIVATIONAL_QUOTES[this.mood];
    const randomQuote = Phaser.Utils.Array.GetRandom(quotes);

    // Show as centered text with fade effect
    const quoteText = this.add.text(400, 150, randomQuote, {
      fontSize: '20px',
      color: '#ffee88',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'italic',
      align: 'center',
      wordWrap: { width: 600 },
      stroke: '#000000',
      strokeThickness: 3,
    });
    quoteText.setOrigin(0.5);
    quoteText.setAlpha(0);
    quoteText.setDepth(1001);

    // Fade in
    this.tweens.add({
      targets: quoteText,
      alpha: 1,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

    // Fade out and remove after 4 seconds
    this.time.delayedCall(4000, () => {
      this.tweens.add({
        targets: quoteText,
        alpha: 0,
        duration: 1000,
        ease: 'Sine.easeInOut',
        onComplete: () => quoteText.destroy(),
      });
    });
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      // Pause timers
      this.lanternTimer.paused = true;
      this.cloudTimer.paused = true;
      this.gameTimer.paused = true;
      
      // Show pause overlay
      this.pauseOverlay = CozyTransitions.createPauseOverlay(this);
      
      // Notify React
      (window as any).onGamePause?.(true);
    } else {
      // Resume timers
      this.lanternTimer.paused = false;
      this.cloudTimer.paused = false;
      this.gameTimer.paused = false;
      
      // Hide pause overlay
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
      
      // Notify React
      (window as any).onGamePause?.(false);
    }
  }

  spawnLantern() {
    if (this.gameEnded || this.isPaused) return;

    const x = 850; // Start off-screen right
    const y = Phaser.Math.Between(120, 520);
    const size = this.config.lanternSize;

    // Create container for layered lantern
    const container = this.add.container(x, y);

    // Halo (outermost, subtle)
    const halo = this.add.circle(0, 0, size * 3, 0xffd700, 0.05);
    
    // Glow (middle layer with ADD blend)
    const glow = this.add.circle(0, 0, size * 1.8, 0xffd700, 0.3);
    glow.setBlendMode(Phaser.BlendModes.ADD);
    
    // Core (bright center with ADD blend)
    const core = this.add.circle(0, 0, size, 0xffee88, 1);
    core.setBlendMode(Phaser.BlendModes.ADD);

    container.add([halo, glow, core]);

    // Add gentle pulsing
    this.tweens.add({
      targets: core,
      scale: 1.15,
      alpha: 0.85,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    this.tweens.add({
      targets: glow,
      scale: 1.1,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.lanterns.push({ container, core, glow, halo });
  }

  spawnCloud() {
    if (this.gameEnded || this.isPaused) return;

    const x = 850;
    const y = Phaser.Math.Between(120, 520);
    const size = this.config.cloudSize;

    // Create container for multi-layered soft cloud
    const container = this.add.container(x, y);

    // 3 overlapping circles for soft appearance
    const layer1 = this.add.circle(-size * 0.4, 0, size * 0.8, 0x888888, 0.25);
    const layer2 = this.add.circle(0, 0, size, 0x999999, 0.3);
    const layer3 = this.add.circle(size * 0.4, 0, size * 0.8, 0x888888, 0.25);

    container.add([layer1, layer2, layer3]);

    // Gentle drift animation
    this.tweens.add({
      targets: container,
      y: y + 10,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.clouds.push({ container, layers: [layer1, layer2, layer3] });
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

    // Update parallax layers (scroll at different speeds)
    CozyTheme.updateParallax(this.parallaxLayers, this.config.worldSpeed, delta);

    // Smooth lerp player movement toward target
    const moveSpeed = (this.config.playerSpeed * delta) / 1000;
    
    if (this.cursors.up.isDown) {
      this.targetPlayerY = Math.max(100, this.targetPlayerY - moveSpeed);
    } else if (this.cursors.down.isDown) {
      this.targetPlayerY = Math.min(550, this.targetPlayerY + moveSpeed);
    }

    // Smooth move toward pointer Y (if pointer active)
    if (this.input.activePointer.isDown) {
      const diff = this.pointerY - this.targetPlayerY;
      const movement = Math.sign(diff) * Math.min(Math.abs(diff), moveSpeed);
      this.targetPlayerY = Phaser.Math.Clamp(this.targetPlayerY + movement, 100, 550);
    }

    // Lerp player Y for smooth floaty movement (0.15 = moderate smoothness)
    const lerpFactor = 0.15;
    this.player.y += (this.targetPlayerY - this.player.y) * lerpFactor;
    this.playerGlow.y = this.player.y;
    
    // Draw player trail
    if (this.playerTrail) {
      this.playerTrail.draw(this.player.x, this.player.y);
      this.playerTrail.fade();
    }

    // Scroll stars slowly
    const starScrollSpeed = (this.config.worldSpeed * 0.3 * delta) / 1000;
    this.stars.forEach((star) => {
      star.x -= starScrollSpeed;
      if (star.x < -10) {
        star.x = 810;
      }
    });

    // Move and check lanterns
    const worldDelta = (this.config.worldSpeed * delta) / 1000;
    
    for (let i = this.lanterns.length - 1; i >= 0; i--) {
      const lantern = this.lanterns[i];
      lantern.container.x -= worldDelta;

      // Check collision with player
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        lantern.container.x,
        lantern.container.y
      );

      if (dist < this.player.radius + this.config.lanternSize) {
        // Collect!
        this.score++;
        CozyAudio.playSuccess(this);
        
        // Show floating text
        this.hud.showFloatingText(lantern.container.x, lantern.container.y, '+1', '#ffd700');
        
        // Ripple ring effect (like fireflies)
        const ring = this.add.circle(lantern.container.x, lantern.container.y, this.config.lanternSize, 0xffd700, 0);
        ring.setStrokeStyle(2, 0xffd700, 1);
        ring.setBlendMode(Phaser.BlendModes.ADD);
        this.tweens.add({
          targets: ring,
          scale: 4,
          alpha: 0,
          duration: 600,
          ease: 'Quad.easeOut',
          onComplete: () => ring.destroy(),
        });
        
        // Sparkle burst
        CozyTheme.createSparkles(this, lantern.container.x, lantern.container.y, 8);
        
        // Warm flash
        CozyTransitions.flashScreen(this, 0xffee88, 0.15, 300);
        
        // Fade out and destroy
        this.tweens.add({
          targets: lantern.container,
          scale: 1.5,
          alpha: 0,
          duration: 400,
          ease: 'Quad.easeOut',
          onComplete: () => lantern.container.destroy(),
        });
        
        this.lanterns.splice(i, 1);
        continue;
      }

      // Remove if off-screen
      if (lantern.container.x < -50) {
        lantern.container.destroy();
        this.lanterns.splice(i, 1);
      }
    }

    // Move and check clouds
    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const cloud = this.clouds[i];
      cloud.container.x -= worldDelta;

      // Check collision with player
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        cloud.container.x,
        cloud.container.y
      );

      if (dist < this.player.radius + this.config.cloudSize) {
        // Soft gentle collision
        CozyAudio.playSoftFail(this);
        
        // Show gentle feedback
        this.hud.showFloatingText(cloud.container.x, cloud.container.y, 'Oops', '#aabbff');
        
        // Small penalty
        this.score = Math.max(0, this.score - 1);
        
        // Gentle dim overlay (no harsh flash)
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x888888, 0.15);
        this.tweens.add({
          targets: overlay,
          alpha: 0,
          duration: 700,
          ease: 'Sine.easeOut',
          onComplete: () => overlay.destroy(),
        });
        
        // Gentle slow-down effect (temporary speed reduction)
        const originalSpeed = this.config.worldSpeed;
        this.config.worldSpeed *= 0.7;
        this.time.delayedCall(700, () => {
          this.config.worldSpeed = originalSpeed;
        });
        
        // Dust poof
        CozyParticles.createPoof(this, cloud.container.x, cloud.container.y);
        
        // Remove cloud
        cloud.container.destroy();
        this.clouds.splice(i, 1);
        continue;
      }

      // Remove if off-screen
      if (cloud.container.x < -50) {
        cloud.container.destroy();
        this.clouds.splice(i, 1);
      }
    }
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;

    // Stop timers
    this.lanternTimer?.destroy();
    this.cloudTimer?.destroy();
    this.gameTimer?.destroy();

    // Calculate calm score using difficulty-based targets
    const durationSec = Math.floor((Date.now() - this.startTime) / 1000);
    const targetLanterns: Record<string, number> = { calm: 6, normal: 10, focus: 15 };
    const target = targetLanterns[this.difficulty] || 10;
    
    // Clamp helper
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const calmScore = clamp(Math.round((this.score / target) * 100), 0, 100);

    // Build payload with REAL values
    const payload = {
      type: 'glide' as const,
      score: this.score,
      calmScore,
      durationSec,
    };

    // Debug log - VERBOSE
    console.log('============================================');
    console.log('[GlideScene] END GAME - FINAL VALUES');
    console.log('[GlideScene] this.score =', this.score);
    console.log('[GlideScene] target =', target, '(difficulty:', this.difficulty, ')');
    console.log('[GlideScene] calmScore =', calmScore);
    console.log('[GlideScene] duration =', durationSec);
    console.log('[GlideScene] PAYLOAD:', JSON.stringify(payload));
    console.log('============================================');

    // Cleanup
    this.hud.destroy();
    CozyParticles.destroyParticles(this.stars);
    this.playerTrail?.destroy();

    // Fade out
    CozyTransitions.sceneFadeOut(this, 800, () => {
      // Emit game completion event to the page
      console.log('[GlideScene] Emitting mission:complete with payload');
      this.game.events.emit('mission:complete', payload);
      
      // Legacy callback support
      (window as any).onGameEnd?.(payload.score, payload.calmScore, payload.durationSec);
    });
  }
}
