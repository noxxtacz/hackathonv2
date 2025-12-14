import * as Phaser from 'phaser';

/**
 * Cozy theme colors and visual helpers for consistent styling across all mini-games
 */
export class CozyTheme {
  // Color palette
  static readonly colors = {
    // Night sky gradients
    skyTop: 0x0a0a1e,
    skyMiddle: 0x1a1a3e,
    skyBottom: 0x2d2d5e,
    
    // Accents
    moonGlow: 0xfff8dc,
    starlight: 0xffffff,
    purpleGlow: 0x9b59b6,
    softPink: 0xff9ec8,
    
    // Mode colors
    calmMode: 0x87ceeb,    // Light blue
    normalMode: 0xffd700,   // Gold
    focusMode: 0xff6b6b,    // Soft red
    
    // UI
    textPrimary: 0xffffff,
    textSecondary: 0xcccccc,
    textShadow: 0x000000,
    
    // Feedback
    success: 0x90ee90,
    warning: 0xffa500,
    softFail: 0x8b7d7d,
  };

  /**
   * Apply a vertical gradient background to the scene
   */
  static applyBackground(scene: Phaser.Scene, width: number, height: number) {
    const graphics = scene.add.graphics();
    
    // Apply gradient using Phaser's fillGradientStyle
    graphics.fillGradientStyle(
      this.colors.skyTop, this.colors.skyTop,
      this.colors.skyBottom, this.colors.skyBottom,
      1, 1, 1, 1
    );
    graphics.fillRect(0, 0, width, height);
    
    return graphics;
  }

  /**
   * Add a moon glow in the corner
   */
  static addMoonGlow(scene: Phaser.Scene, x: number, y: number, radius = 80) {
    // Outer glow
    const outerGlow = scene.add.circle(x, y, radius * 1.5, this.colors.moonGlow, 0.1);
    
    // Middle glow
    const middleGlow = scene.add.circle(x, y, radius, this.colors.moonGlow, 0.3);
    
    // Moon core
    const moon = scene.add.circle(x, y, radius * 0.7, this.colors.moonGlow, 0.9);
    
    // Gentle pulsing animation
    scene.tweens.add({
      targets: [outerGlow, middleGlow],
      alpha: '-=0.1',
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    return { outerGlow, middleGlow, moon };
  }

  /**
   * Create a soft vignette overlay (dark edges)
   */
  static addVignette(scene: Phaser.Scene, width: number, height: number, intensity = 0.3) {
    const graphics = scene.add.graphics();
    
    // Create radial gradient for vignette
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.max(width, height) * 0.8;
    
    graphics.fillStyle(0x000000, 0);
    graphics.fillRect(0, 0, width, height);
    
    // Draw vignette using multiple circles
    for (let i = 0; i < 5; i++) {
      const alpha = (i / 5) * intensity;
      const currentRadius = radius - (i * radius / 5);
      graphics.fillStyle(0x000000, alpha);
      graphics.fillRect(0, 0, width, height);
    }
    
    // Simple dark overlay on edges
    graphics.fillStyle(0x000000, intensity);
    graphics.fillRect(0, 0, width, 50); // Top
    graphics.fillRect(0, height - 50, width, 50); // Bottom
    graphics.fillRect(0, 0, 50, height); // Left
    graphics.fillRect(width - 50, 0, 50, height); // Right
    
    graphics.setAlpha(0.3);
    
    return graphics;
  }

  /**
   * Create a rounded frame around the play area
   */
  static addRoundedFrame(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    radius = 20,
    color = 0x9b59b6,
    alpha = 0.2
  ) {
    const graphics = scene.add.graphics();
    
    // Draw rounded rectangle stroke
    graphics.lineStyle(3, color, alpha);
    graphics.strokeRoundedRect(x, y, width, height, radius);
    
    return graphics;
  }

  /**
   * Get color based on mode
   */
  static getModeColor(mode: 'CALM' | 'NORMAL' | 'FOCUS'): number {
    switch (mode) {
      case 'CALM':
        return this.colors.calmMode;
      case 'NORMAL':
        return this.colors.normalMode;
      case 'FOCUS':
        return this.colors.focusMode;
      default:
        return this.colors.normalMode;
    }
  }

  /**
   * Create a text with soft shadow
   */
  static createSoftText(
    scene: Phaser.Scene,
    x: number,
    y: number,
    text: string,
    fontSize = '18px',
    color = '#ffffff'
  ) {
    const textObj = scene.add.text(x, y, text, {
      fontSize,
      color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    });
    
    textObj.setShadow(2, 2, '#000000', 4, true, true);
    textObj.setAlpha(0.95);
    
    return textObj;
  }

  /**
   * Create sparkle particles at position
   */
  static createSparkles(scene: Phaser.Scene, x: number, y: number, count = 8) {
    const particles: Phaser.GameObjects.Arc[] = [];
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      const distance = Phaser.Math.Between(10, 30);
      
      const sparkle = scene.add.circle(
        x,
        y,
        Phaser.Math.Between(2, 4),
        this.colors.starlight,
        1
      );
      
      particles.push(sparkle);
      
      // Animate outward
      scene.tweens.add({
        targets: sparkle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: 600,
        ease: 'Quad.easeOut',
        onComplete: () => sparkle.destroy(),
      });
    }
    
    return particles;
  }

  /**
   * Create a soft glow around an object
   */
  static addGlow(scene: Phaser.Scene, x: number, y: number, radius = 20, color = 0xffff88) {
    const glow = scene.add.circle(x, y, radius, color, 0.3);
    
    scene.tweens.add({
      targets: glow,
      alpha: 0.5,
      scale: 1.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    return glow;
  }

  /**
   * Create parallax background layers (for Glide-style games)
   */
  static createParallaxLayers(
    scene: Phaser.Scene,
    width: number,
    height: number
  ): { graphics: Phaser.GameObjects.Graphics; speed: number }[] {
    const layers: { graphics: Phaser.GameObjects.Graphics; speed: number }[] = [];
    
    // Check reduced motion
    const reducedMotion = typeof window !== 'undefined'
      ? localStorage.getItem('nebula_reduced_motion') === 'true'
      : false;
    
    // Far mountains (slowest)
    const far = scene.add.graphics();
    far.fillStyle(0x1a1a3e, 0.6);
    far.fillRect(0, height - 150, width, 150);
    // Add some mountain peaks
    far.beginPath();
    far.moveTo(0, height - 150);
    for (let x = 0; x < width; x += 100) {
      far.lineTo(x + 50, height - 180 - Phaser.Math.Between(10, 40));
      far.lineTo(x + 100, height - 150);
    }
    far.closePath();
    far.fillPath();
    far.setDepth(1);
    layers.push({ graphics: far, speed: reducedMotion ? 0 : 0.1 });
    
    // Mid hills (medium speed)
    const mid = scene.add.graphics();
    mid.fillStyle(0x2d2d5e, 0.7);
    mid.fillRect(0, height - 100, width, 100);
    // Add some hills
    mid.beginPath();
    mid.moveTo(0, height - 100);
    for (let x = 0; x < width; x += 80) {
      mid.lineTo(x + 40, height - 120 - Phaser.Math.Between(5, 25));
      mid.lineTo(x + 80, height - 100);
    }
    mid.closePath();
    mid.fillPath();
    mid.setDepth(2);
    layers.push({ graphics: mid, speed: reducedMotion ? 0 : 0.2 });
    
    // Near ground (fastest)
    const near = scene.add.graphics();
    near.fillStyle(0x3a3a6e, 0.8);
    near.fillRect(0, height - 60, width, 60);
    near.setDepth(3);
    layers.push({ graphics: near, speed: reducedMotion ? 0 : 0.4 });
    
    return layers;
  }

  /**
   * Update parallax layers (call in update loop with world speed)
   */
  static updateParallax(
    layers: { graphics: Phaser.GameObjects.Graphics; speed: number }[],
    worldSpeed: number,
    delta: number
  ) {
    layers.forEach(layer => {
      if (layer.speed === 0) return; // Static if reduced motion
      
      const movement = (worldSpeed * layer.speed * delta) / 1000;
      layer.graphics.x -= movement;
      
      // Wrap around based on scene width (Graphics width is 0, so use the layer's position)
      // Since layers are drawn to fill the screen, we wrap when scrolled far enough
      if (layer.graphics.x <= -800) {
        layer.graphics.x += 800;
      }
    });
  }
}
