import * as Phaser from 'phaser';

/**
 * Particle systems for cozy ambient effects with reduced motion support
 */
export class CozyParticles {
  /**
   * Check if reduced motion is enabled
   */
  private static isReducedMotion(): boolean {
    try {
      return localStorage.getItem('nebula_reduced_motion') === 'true';
    } catch {
      return false;
    }
  }

  /**
   * Create a starfield background with twinkling stars
   */
  static createStarfield(
    scene: Phaser.Scene,
    width: number,
    height: number,
    count = 100
  ): Phaser.GameObjects.Arc[] {
    const stars: Phaser.GameObjects.Arc[] = [];
    const reducedMotion = this.isReducedMotion();
    
    // Reduce count if reduced motion is enabled
    const starCount = reducedMotion ? Math.floor(count / 2) : count;
    
    for (let i = 0; i < starCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.FloatBetween(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.3, 1);
      
      const star = scene.add.circle(x, y, size, 0xffffff, alpha);
      stars.push(star);
      
      // Twinkle animation (skip if reduced motion)
      if (!reducedMotion) {
        scene.tweens.add({
          targets: star,
          alpha: alpha * 0.3,
          duration: Phaser.Math.Between(1000, 3000),
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
          delay: Phaser.Math.Between(0, 2000),
        });
      }
    }
    
    return stars;
  }

  /**
   * Create floating firefly-style particles
   */
  static createFireflies(
    scene: Phaser.Scene,
    x: number,
    y: number,
    width: number,
    height: number,
    count = 20
  ): Phaser.GameObjects.Container {
    const container = scene.add.container(x, y);
    const reducedMotion = this.isReducedMotion();
    
    // Reduce count if reduced motion is enabled
    const fireflyCount = reducedMotion ? Math.floor(count / 3) : count;
    
    for (let i = 0; i < fireflyCount; i++) {
      const fx = Phaser.Math.Between(0, width);
      const fy = Phaser.Math.Between(0, height);
      
      // Glow
      const glow = scene.add.circle(fx, fy, 4, 0xffff88, 0.3);
      
      // Core
      const core = scene.add.circle(fx, fy, 2, 0xffff88, 0.8);
      
      container.add([glow, core]);
      
      // Skip animations if reduced motion
      if (reducedMotion) continue;
      
      // Floating animation
      scene.tweens.add({
        targets: [glow, core],
        x: fx + Phaser.Math.Between(-50, 50),
        y: fy + Phaser.Math.Between(-30, 30),
        duration: Phaser.Math.Between(3000, 5000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 2000),
      });
      
      // Pulsing glow
      scene.tweens.add({
        targets: glow,
        alpha: 0.6,
        scale: 1.5,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    
    return container;
  }

  /**
   * Create gentle wind particles (for Glide game)
   */
  static createWindParticles(
    scene: Phaser.Scene,
    width: number,
    height: number
  ): Phaser.GameObjects.Arc[] {
    const particles: Phaser.GameObjects.Arc[] = [];
    const reducedMotion = this.isReducedMotion();
    
    if (reducedMotion) return particles; // Skip if reduced motion
    
    for (let i = 0; i < 15; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      
      const particle = scene.add.circle(x, y, 1, 0xffffff, 0.3);
      particles.push(particle);
      
      // Move across screen
      scene.tweens.add({
        targets: particle,
        x: x - 200,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        onRepeat: () => {
          particle.x = width + 50;
          particle.y = Phaser.Math.Between(0, height);
        },
      });
    }
    
    return particles;
  }

  /**
   * Create water ripples (for Fishing game)
   */
  static createWaterRipple(
    scene: Phaser.Scene,
    x: number,
    y: number
  ): Phaser.GameObjects.Arc[] {
    const ripples: Phaser.GameObjects.Arc[] = [];
    const reducedMotion = this.isReducedMotion();
    
    if (reducedMotion) return ripples; // Skip if reduced motion
    
    for (let i = 0; i < 3; i++) {
      const ripple = scene.add.circle(x, y, 5, 0x4682b4, 0);
      ripple.setStrokeStyle(2, 0x87ceeb, 0.5);
      ripples.push(ripple);
      
      scene.tweens.add({
        targets: ripple,
        radius: 40 + (i * 15),
        alpha: 0,
        duration: 1500,
        delay: i * 200,
        ease: 'Quad.easeOut',
        onComplete: () => ripple.destroy(),
      });
    }
    
    return ripples;
  }

  /**
   * Create a particle burst at position
   */
  static createBurst(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color = 0xffffff,
    count = 12
  ): void {
    const reducedMotion = this.isReducedMotion();
    const particleCount = reducedMotion ? Math.floor(count / 2) : count;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = Phaser.Math.Between(20, 50);
      
      const particle = scene.add.circle(x, y, 3, color, 1);
      
      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * distance,
        y: y + Math.sin(angle) * distance,
        alpha: 0,
        scale: 0,
        duration: reducedMotion ? 400 : 800,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Create a soft "poof" effect
   */
  static createPoof(scene: Phaser.Scene, x: number, y: number): void {
    const reducedMotion = this.isReducedMotion();
    
    const poof = scene.add.circle(x, y, 10, 0xcccccc, 0.4);
    
    scene.tweens.add({
      targets: poof,
      radius: 30,
      alpha: 0,
      duration: reducedMotion ? 300 : 600,
      ease: 'Quad.easeOut',
      onComplete: () => poof.destroy(),
    });
  }

  /**
   * Create a trail effect behind an object
   */
  static createTrail(
    scene: Phaser.Scene,
    x: number,
    y: number,
    color = 0x3498db
  ): Phaser.GameObjects.Arc {
    const reducedMotion = this.isReducedMotion();
    
    if (reducedMotion) {
      // Return invisible dummy object
      const dummy = scene.add.circle(0, 0, 0, 0, 0);
      dummy.setVisible(false);
      return dummy;
    }
    
    const trail = scene.add.circle(x, y, 4, color, 0.6);
    
    scene.tweens.add({
      targets: trail,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => trail.destroy(),
    });
    
    return trail;
  }

  /**
   * Create nebula fog effect (soft drifting blobs)
   */
  static createNebulaFog(
    scene: Phaser.Scene,
    width: number,
    height: number,
    count = 8
  ): Phaser.GameObjects.Arc[] {
    const fog: Phaser.GameObjects.Arc[] = [];
    const reducedMotion = this.isReducedMotion();
    
    if (reducedMotion) return fog; // Skip fog entirely if reduced motion
    
    for (let i = 0; i < count; i++) {
      const x = Phaser.Math.Between(-50, width + 50);
      const y = Phaser.Math.Between(-50, height + 50);
      const size = Phaser.Math.Between(80, 150);
      
      const blob = scene.add.circle(x, y, size, 0x9b59b6, 0.05);
      blob.setBlendMode(Phaser.BlendModes.ADD);
      fog.push(blob);
      
      // Slow drift
      scene.tweens.add({
        targets: blob,
        x: x + Phaser.Math.Between(-100, 100),
        y: y + Phaser.Math.Between(-50, 50),
        duration: Phaser.Math.Between(15000, 25000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      
      // Pulsing alpha
      scene.tweens.add({
        targets: blob,
        alpha: 0.08,
        duration: Phaser.Math.Between(8000, 12000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
    
    return fog;
  }

  /**
   * Create a shooting star effect
   */
  static createShootingStar(scene: Phaser.Scene, width: number, height: number) {
    const reducedMotion = this.isReducedMotion();
    if (reducedMotion) return;
    
    // Start from random top edge
    const startX = Phaser.Math.Between(width * 0.3, width * 0.9);
    const startY = Phaser.Math.Between(50, 150);
    
    const endX = startX - Phaser.Math.Between(200, 400);
    const endY = startY + Phaser.Math.Between(100, 250);
    
    // Star
    const star = scene.add.circle(startX, startY, 2, 0xffffff, 1);
    star.setDepth(100);
    
    // Trail
    const trail = scene.add.graphics();
    trail.setDepth(99);
    
    // Animate
    scene.tweens.add({
      targets: star,
      x: endX,
      y: endY,
      alpha: 0,
      duration: 1500,
      ease: 'Quad.easeIn',
      onUpdate: () => {
        // Draw trail
        trail.clear();
        trail.lineStyle(1, 0xffffff, 0.5);
        trail.beginPath();
        trail.moveTo(star.x, star.y);
        trail.lineTo(star.x + 30, star.y - 15);
        trail.strokePath();
      },
      onComplete: () => {
        star.destroy();
        trail.destroy();
      },
    });
  }

  /**
   * Schedule shooting stars at random intervals
   */
  static scheduleShootingStars(scene: Phaser.Scene, width: number, height: number) {
    const reducedMotion = this.isReducedMotion();
    if (reducedMotion) return;
    
    const shoot = () => {
      this.createShootingStar(scene, width, height);
      
      // Schedule next one
      const nextDelay = Phaser.Math.Between(12000, 20000);
      scene.time.delayedCall(nextDelay, shoot);
    };
    
    // First shooting star after 8-12 seconds
    const initialDelay = Phaser.Math.Between(8000, 12000);
    scene.time.delayedCall(initialDelay, shoot);
  }

  /**
   * Destroy all particles in an array
   */
  static destroyParticles(particles: Phaser.GameObjects.GameObject[]): void {
    particles.forEach(p => {
      if (p && !p.scene) return; // Already destroyed
      p.destroy();
    });
    particles.length = 0;
  }
}
