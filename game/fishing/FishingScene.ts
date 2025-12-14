import * as Phaser from 'phaser';
import { Difficulty, Mood, MOTIVATIONAL_QUOTES, getFishingConfig, FishingConfig } from '@/lib/types';
import { CozyTheme, CozyHUD, CozyParticles, CozyAudio, CozyTransitions } from '@/game/shared';

export class FishingScene extends Phaser.Scene {
  private fishCaught = 0;
  private timeLeft = 60;
  private config!: FishingConfig;
  private gameEnded = false;
  private startTime = 0;
  private difficulty: Difficulty = 'normal';
  private mood: Mood = 'neutral';
  
  // UI Elements
  private hud!: CozyHUD;
  private stars: Phaser.GameObjects.Arc[] = [];
  private isPaused = false;
  private pauseOverlay?: Phaser.GameObjects.Container;
  private gameTimer!: Phaser.Time.TimerEvent;
  
  // Fishing UI
  private fishingBar!: Phaser.GameObjects.Container;
  private bobber!: Phaser.GameObjects.Arc;
  private catchZone!: Phaser.GameObjects.Graphics;
  private barBackground!: Phaser.GameObjects.Graphics;
  private bobberY = 250;
  private bobberDirection = 1;
  private zoneY = 200;
  private zoneDriftDirection = 1;
  private canHook = true;
  private hookCooldown = 0;
  
  // Lake effects
  private ripples: Phaser.GameObjects.Arc[] = [];
  private waterShimmer!: Phaser.GameObjects.Graphics;
  private shimmerPhase = 0;
  
  // Background music and SFX
  private bgMusic?: Phaser.Sound.BaseSound;
  private splashSfx?: Phaser.Sound.BaseSound;
  private lastSplashTime = 0;
  private splashCooldown = 150;
  private hasFishIcon = false;

  constructor() {
    super({ key: 'FishingScene' });
  }

  preload() {
    // Preload sound effects
    CozyAudio.preloadSounds(this);
    
    // Try to load fishing music if available
    try {
      this.load.audio('fishing_calm', '/audio/calm1.mp3');
    } catch (e) {
      console.log('Could not load fishing music');
    }
    
    // Try to load water splash SFX
    try {
      this.load.audio('splash', '/sfx/splash.mp3');
    } catch (e) {
      console.log('Could not load splash sound');
    }
    
    // Try to load fish icon
    try {
      this.load.image('fishIcon', '/ui/fish.png');
    } catch (e) {
      console.log('Fish icon not available, will use fallback graphics');
    }
  }

  create() {
    // Get difficulty and mood from window
    this.difficulty = ((window as any).gameDifficulty || 'normal') as Difficulty;
    this.mood = ((window as any).gameMood || 'neutral') as Mood;
    this.config = getFishingConfig(this.difficulty);
    this.timeLeft = this.config.durationSec;
    this.fishCaught = 0;
    this.gameEnded = false;
    this.startTime = Date.now();
    this.isPaused = false;

    // Create beautiful cozy scene
    this.createBackground();
    this.createLake();
    this.createRipplesSystem();
    this.createFishingUI();
    this.createHUD();
    
    // Setup audio
    this.startBackgroundMusic();
    this.setupSoundEffects();
    
    // Check if fish icon loaded successfully
    this.hasFishIcon = this.textures.exists('fishIcon');
    
    // Setup input
    this.input.keyboard?.on('keydown-SPACE', () => this.attemptHook());
    this.input.keyboard?.on('keydown-P', () => this.togglePause());
    this.input.on('pointerdown', () => this.attemptHook());

    // Fade in
    CozyTransitions.sceneFadeIn(this);

    // Game timer
    this.gameTimer = this.time.addEvent({
      delay: 1000,
      callback: this.updateTimer,
      callbackScope: this,
      loop: true,
    });

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

  createBackground() {
    // Night gradient sky
    CozyTheme.applyBackground(this, 800, 600);
    
    // Big soft moon glow
    CozyTheme.addMoonGlow(this, 650, 120, 70);
    
    // Create starfield
    this.stars = CozyParticles.createStarfield(this, 800, 600, 100);
    
    // Add nebula fog atmosphere
    CozyParticles.createNebulaFog(this, 800, 600);
    
    // Schedule shooting stars
    CozyParticles.scheduleShootingStars(this, 800, 600);
    
    // Add vignette
    CozyTransitions.createVignette(this, 0.25);
  }

  createLake() {
    // Lake surface (bottom half)
    const lakeGraphics = this.add.graphics();
    
    // Lake gradient (darker at bottom)
    lakeGraphics.fillGradientStyle(
      0x1a1a3e, 0x1a1a3e,
      0x0a0a1e, 0x0a0a1e,
      0.9, 0.9, 1, 1
    );
    lakeGraphics.fillRect(0, 250, 800, 350);
    
    // Add subtle shimmer effect
    this.waterShimmer = this.add.graphics();
    this.waterShimmer.setAlpha(0.15);
    
    // Small dock silhouette (bottom left)
    const dock = this.add.graphics();
    dock.fillStyle(0x0a0a0a, 0.8);
    dock.fillRect(20, 520, 120, 80);
    dock.fillRect(35, 480, 20, 40);
    dock.fillRect(105, 480, 20, 40);
    
    // Add rounded frame
    CozyTheme.addRoundedFrame(this, 10, 50, 780, 540, 20, 0x9b59b6, 0.3);
  }

  createRipplesSystem() {
    // Create gentle water ripples at random points
    const reducedMotion = localStorage.getItem('nebula_reduced_motion') === 'true';
    
    if (!reducedMotion) {
      this.time.addEvent({
        delay: 3000,
        callback: () => {
          if (this.gameEnded || this.isPaused) return;
          
          const x = Phaser.Math.Between(100, 700);
          const y = Phaser.Math.Between(280, 500);
          this.createRipple(x, y, 0.1);
        },
        loop: true,
      });
    }
  }

  createRipple(x: number, y: number, alpha = 0.15) {
    const ripple = this.add.circle(x, y, 5, 0x87ceeb, alpha);
    this.ripples.push(ripple);
    
    this.tweens.add({
      targets: ripple,
      radius: 40,
      alpha: 0,
      duration: 2000,
      ease: 'Quad.easeOut',
      onComplete: () => {
        ripple.destroy();
        const index = this.ripples.indexOf(ripple);
        if (index > -1) this.ripples.splice(index, 1);
      },
    });
  }

  createFishingUI() {
    // Fishing bar container (center-right)
    this.fishingBar = this.add.container(650, 300);
    
    // Bar background (glass effect with gradient)
    this.barBackground = this.add.graphics();
    this.barBackground.lineStyle(3, 0x9b59b6, 0.6);
    this.barBackground.strokeRoundedRect(-25, -200, 50, 400, 10);
    this.barBackground.fillStyle(0x1a1a3e, 0.3);
    this.barBackground.fillRoundedRect(-25, -200, 50, 400, 10);
    this.fishingBar.add(this.barBackground);
    
    // Catch zone (green glowing rectangle)
    this.catchZone = this.add.graphics();
    this.updateCatchZone();
    this.fishingBar.add(this.catchZone);
    
    // Bobber (glowing circle)
    this.bobber = this.add.circle(0, this.bobberY - 300, 12, 0xffffff, 1);
    this.bobber.setBlendMode(Phaser.BlendModes.ADD);
    this.fishingBar.add(this.bobber);
    
    // Add bobber glow
    const bobberGlow = this.add.circle(0, this.bobberY - 300, 20, 0xffffff, 0.3);
    bobberGlow.setBlendMode(Phaser.BlendModes.ADD);
    this.fishingBar.add(bobberGlow);
    
    // Add hint text
    const hintText = this.add.text(650, 520, '🎣 Press SPACE to hook', {
      fontSize: '16px',
      color: '#87ceeb',
      fontFamily: 'Arial, sans-serif',
      stroke: '#000000',
      strokeThickness: 3,
    });
    hintText.setOrigin(0.5);
    hintText.setAlpha(0.8);
    
    // Pulse animation
    this.tweens.add({
      targets: hintText,
      alpha: 0.5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  updateCatchZone() {
    this.catchZone.clear();
    
    // Green glowing zone
    this.catchZone.fillStyle(0x90ee90, 0.4);
    this.catchZone.fillRoundedRect(
      -20,
      this.zoneY - 300 - this.config.zoneHeight / 2,
      40,
      this.config.zoneHeight,
      8
    );
    
    // Bright center line
    this.catchZone.lineStyle(2, 0x90ee90, 0.8);
    this.catchZone.strokeRoundedRect(
      -20,
      this.zoneY - 300 - this.config.zoneHeight / 2,
      40,
      this.config.zoneHeight,
      8
    );
  }

  createHUD() {
    this.hud = CozyHUD.create(this, {
      mode: this.difficulty.toUpperCase() as 'CALM' | 'NORMAL' | 'FOCUS',
      getScore: () => this.fishCaught,
      getTimeLeft: () => this.timeLeft,
    });
  }

  startBackgroundMusic() {
    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('nebula_sound_enabled') !== 'false';
    if (!soundEnabled) return;
    
    try {
      if (this.cache.audio.exists('fishing_calm')) {
        this.bgMusic = this.sound.add('fishing_calm', {
          loop: true,
          volume: 0.3,
        });
        this.bgMusic.play();
      }
    } catch (e) {
      console.log('Background music not available');
    }
  }

  setupSoundEffects() {
    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('nebula_sound_enabled') !== 'false';
    if (!soundEnabled) return;
    
    try {
      if (this.cache.audio.exists('splash')) {
        this.splashSfx = this.sound.add('splash', { volume: 0.25 });
      }
    } catch (e) {
      console.log('Splash sound not available');
    }
  }

  playSplash(volume = 0.25) {
    // Check cooldown to prevent spam
    const now = Date.now();
    if (now - this.lastSplashTime < this.splashCooldown) return;
    this.lastSplashTime = now;
    
    // Check if sound is enabled
    const soundEnabled = localStorage.getItem('nebula_sound_enabled') !== 'false';
    if (!soundEnabled || !this.splashSfx) return;
    
    try {
      this.splashSfx.play({ volume });
    } catch (e) {
      // Silently fail
    }
  }

  spawnFishIcon(x: number, y: number) {
    let fishIcon: Phaser.GameObjects.GameObject;
    
    if (this.hasFishIcon) {
      // Use image if available
      const fish = this.add.image(x, y, 'fishIcon');
      fish.setScale(0);
      fish.setAlpha(1);
      fishIcon = fish;
    } else {
      // Fallback to graphics fish shape
      const graphics = this.add.graphics();
      graphics.fillStyle(0x87ceeb, 1);
      // Draw oval body
      graphics.fillEllipse(0, 0, 30, 20);
      // Draw triangle tail
      graphics.beginPath();
      graphics.moveTo(-15, 0);
      graphics.lineTo(-25, -8);
      graphics.lineTo(-25, 8);
      graphics.closePath();
      graphics.fillPath();
      
      graphics.setPosition(x, y);
      graphics.setScale(0);
      graphics.setAlpha(1);
      fishIcon = graphics;
    }
    
    // Pop in animation (scale 0 → 0.6 → 1.1 → 1.0)
    this.tweens.add({
      targets: fishIcon,
      scale: 0.6,
      duration: 100,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: fishIcon,
          scale: 1.1,
          duration: 150,
          ease: 'Quad.easeOut',
          onComplete: () => {
            this.tweens.add({
              targets: fishIcon,
              scale: 1.0,
              duration: 100,
              ease: 'Quad.easeIn',
            });
          },
        });
      },
    });
    
    // Float upward and fade out
    this.tweens.add({
      targets: fishIcon,
      y: y - 60,
      alpha: 0,
      duration: 1200,
      delay: 250,
      ease: 'Quad.easeOut',
      onComplete: () => fishIcon.destroy(),
    });
    
    // Optional tiny sparkle burst
    CozyTheme.createSparkles(this, x, y, 4);
  }

  showMotivationalQuote() {
    if (this.gameEnded || this.isPaused) return;

    const quotes = MOTIVATIONAL_QUOTES[this.mood];
    const randomQuote = Phaser.Utils.Array.GetRandom(quotes);

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

    this.tweens.add({
      targets: quoteText,
      alpha: 1,
      duration: 1000,
      ease: 'Sine.easeInOut',
    });

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
      this.gameTimer.paused = true;
      this.pauseOverlay = CozyTransitions.createPauseOverlay(this);
      this.bgMusic?.pause();
      (window as any).onGamePause?.(true);
    } else {
      this.gameTimer.paused = false;
      this.pauseOverlay?.destroy();
      this.pauseOverlay = undefined;
      this.bgMusic?.resume();
      (window as any).onGamePause?.(false);
    }
  }

  attemptHook() {
    if (this.gameEnded || this.isPaused || !this.canHook) return;
    
    // Set cooldown
    this.canHook = false;
    this.hookCooldown = this.config.cooldownMs;
    
    // Check if bobber overlaps catch zone
    const bobberTop = this.bobberY - 12;
    const bobberBottom = this.bobberY + 12;
    const zoneTop = this.zoneY - this.config.zoneHeight / 2 - this.config.successWindowPadding;
    const zoneBottom = this.zoneY + this.config.zoneHeight / 2 + this.config.successWindowPadding;
    
    const overlaps = bobberBottom >= zoneTop && bobberTop <= zoneBottom;
    
    if (overlaps) {
      this.onCatchSuccess();
    } else {
      this.onCatchMiss();
    }
  }

  onCatchSuccess() {
    this.fishCaught++;
    CozyAudio.playSuccess(this);
    
    // Play splash sound
    this.playSplash(0.25);
    
    // Spawn fish icon near the catch zone
    const fishX = 650;
    const fishY = 300 + (this.zoneY - 300);
    this.spawnFishIcon(fishX, fishY);
    
    // Sparkle burst at bar
    CozyTheme.createSparkles(this, 650, 300, 8);
    
    // Floating +1 text
    this.hud.showFloatingText(650, 280, '+1', '#90ee90');
    
    // Lake ripple
    const rippleX = Phaser.Math.Between(200, 600);
    const rippleY = Phaser.Math.Between(300, 450);
    this.createRipple(rippleX, rippleY, 0.25);
    
    // Warm flash
    CozyTransitions.flashScreen(this, 0x90ee90, 0.15, 300);
    
    // Bobber celebration pulse
    this.tweens.add({
      targets: this.bobber,
      scale: 1.5,
      duration: 200,
      yoyo: true,
      ease: 'Back.easeOut',
    });
  }

  onCatchMiss() {
    CozyAudio.playSoftFail(this);
    
    // Play smaller splash sound
    this.playSplash(0.15);
    
    // Small plop ripple
    const rippleX = Phaser.Math.Between(250, 550);
    const rippleY = Phaser.Math.Between(320, 420);
    this.createRipple(rippleX, rippleY, 0.15);
    
    // Gentle feedback text
    this.hud.showFloatingText(650, 280, 'Almost!', '#aabbff');
    
    // Small poof
    CozyParticles.createPoof(this, 650, 300);
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
    
    // Update hook cooldown
    if (!this.canHook) {
      this.hookCooldown -= delta;
      if (this.hookCooldown <= 0) {
        this.canHook = true;
      }
    }
    
    // Move bobber up/down smoothly
    const bobberDelta = (this.config.bobberSpeed * delta) / 1000;
    this.bobberY += bobberDelta * this.bobberDirection;
    
    if (this.bobberY <= 100) {
      this.bobberY = 100;
      this.bobberDirection = 1;
    } else if (this.bobberY >= 400) {
      this.bobberY = 400;
      this.bobberDirection = -1;
    }
    
    this.bobber.y = this.bobberY - 300;
    
    // Move catch zone slowly (drift)
    const zoneDelta = (this.config.zoneDriftSpeed * delta) / 1000;
    this.zoneY += zoneDelta * this.zoneDriftDirection;
    
    const halfZone = this.config.zoneHeight / 2;
    if (this.zoneY - halfZone <= 100) {
      this.zoneY = 100 + halfZone;
      this.zoneDriftDirection = 1;
    } else if (this.zoneY + halfZone >= 400) {
      this.zoneY = 400 - halfZone;
      this.zoneDriftDirection = -1;
    }
    
    this.updateCatchZone();
    
    // Update water shimmer
    this.updateWaterShimmer(delta);
  }

  updateWaterShimmer(delta: number) {
    this.shimmerPhase += delta / 2000;
    
    this.waterShimmer.clear();
    
    // Draw animated shimmer bands
    for (let i = 0; i < 3; i++) {
      const y = 280 + i * 60 + Math.sin(this.shimmerPhase + i) * 10;
      const alpha = 0.1 + Math.sin(this.shimmerPhase + i) * 0.05;
      
      this.waterShimmer.fillStyle(0x87ceeb, alpha);
      this.waterShimmer.fillRect(0, y, 800, 30);
    }
  }

  endGame() {
    if (this.gameEnded) return;
    this.gameEnded = true;

    // Stop timers
    this.gameTimer?.destroy();
    
    // Stop music
    this.bgMusic?.stop();

    // Calculate calm score using difficulty-based targets
    const durationSec = Math.floor((Date.now() - this.startTime) / 1000);
    const targetFish: Record<string, number> = { calm: 5, normal: 8, focus: 12 };
    const target = targetFish[this.difficulty] || 8;
    
    // Clamp helper
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const calmScore = clamp(Math.round((this.fishCaught / target) * 100), 0, 100);

    // Build payload with REAL values
    const payload = {
      type: 'fishing' as const,
      score: this.fishCaught,
      calmScore,
      durationSec,
    };

    // Debug log - VERBOSE
    console.log('============================================');
    console.log('[FishingScene] END GAME - FINAL VALUES');
    console.log('[FishingScene] this.fishCaught =', this.fishCaught);
    console.log('[FishingScene] target =', target, '(difficulty:', this.difficulty, ')');
    console.log('[FishingScene] calmScore =', calmScore);
    console.log('[FishingScene] duration =', durationSec);
    console.log('[FishingScene] PAYLOAD:', JSON.stringify(payload));
    console.log('============================================');

    // Cleanup
    this.hud.destroy();
    CozyParticles.destroyParticles(this.stars);
    this.ripples.forEach(r => r.destroy());

    // Fade out
    CozyTransitions.sceneFadeOut(this, 800, () => {
      // Emit game completion event to the page
      console.log('[FishingScene] Emitting mission:complete with payload');
      this.game.events.emit('mission:complete', payload);
      
      // Legacy callback support
      (window as any).onGameEnd?.(payload.score, payload.calmScore, payload.durationSec);
    });
  }
}
