import * as Phaser from 'phaser';

/**
 * Scene transitions and visual effects for smooth game flow
 */
export class CozyTransitions {
  /**
   * Fade in scene from black
   */
  static sceneFadeIn(
    scene: Phaser.Scene,
    duration = 800,
    onComplete?: () => void
  ): Phaser.GameObjects.Rectangle {
    const { width, height } = scene.scale;
    
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 1);
    overlay.setOrigin(0);
    overlay.setDepth(10000);
    overlay.setScrollFactor(0);
    
    scene.tweens.add({
      targets: overlay,
      alpha: 0,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        overlay.destroy();
        if (onComplete) onComplete();
      },
    });
    
    return overlay;
  }

  /**
   * Fade out scene to black
   */
  static sceneFadeOut(
    scene: Phaser.Scene,
    duration = 800,
    onComplete?: () => void
  ): Phaser.GameObjects.Rectangle {
    const { width, height } = scene.scale;
    
    const overlay = scene.add.rectangle(0, 0, width, height, 0x000000, 0);
    overlay.setOrigin(0);
    overlay.setDepth(10000);
    overlay.setScrollFactor(0);
    
    scene.tweens.add({
      targets: overlay,
      alpha: 1,
      duration,
      ease: 'Sine.easeInOut',
      onComplete: () => {
        if (onComplete) onComplete();
        // Don't destroy - leave it black
      },
    });
    
    return overlay;
  }

  /**
   * Create a soft vignette overlay
   */
  static createVignette(
    scene: Phaser.Scene,
    intensity = 0.4
  ): Phaser.GameObjects.Graphics {
    const { width, height } = scene.scale;
    const graphics = scene.add.graphics();
    graphics.setDepth(999);
    graphics.setScrollFactor(0);
    
    // Create gradient vignette effect
    // Top edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, intensity, 0, intensity, 0);
    graphics.fillRect(0, 0, width, 80);
    
    // Bottom edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, intensity, 0, intensity);
    graphics.fillRect(0, height - 80, width, 80);
    
    // Left edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, intensity, intensity, 0, 0);
    graphics.fillRect(0, 0, 80, height);
    
    // Right edge
    graphics.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0, 0, intensity, intensity);
    graphics.fillRect(width - 80, 0, 80, height);
    
    // Corners (stronger)
    graphics.fillStyle(0x000000, intensity * 1.5);
    graphics.fillTriangle(0, 0, 100, 0, 0, 100);
    graphics.fillTriangle(width, 0, width - 100, 0, width, 100);
    graphics.fillTriangle(0, height, 100, height, 0, height - 100);
    graphics.fillTriangle(width, height, width - 100, height, width, height - 100);
    
    return graphics;
  }

  /**
   * Flash the screen briefly (for hit/impact)
   */
  static flashScreen(
    scene: Phaser.Scene,
    color = 0xffffff,
    intensity = 0.3,
    duration = 150
  ): void {
    const { width, height } = scene.scale;
    
    const flash = scene.add.rectangle(0, 0, width, height, color, intensity);
    flash.setOrigin(0);
    flash.setDepth(9999);
    flash.setScrollFactor(0);
    
    scene.tweens.add({
      targets: flash,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => flash.destroy(),
    });
  }

  /**
   * Dim the screen briefly (for negative feedback)
   */
  static dimScreen(
    scene: Phaser.Scene,
    duration = 150
  ): void {
    const { width, height } = scene.scale;
    
    const dim = scene.add.rectangle(0, 0, width, height, 0x000000, 0.5);
    dim.setOrigin(0);
    dim.setDepth(9999);
    dim.setScrollFactor(0);
    
    scene.tweens.add({
      targets: dim,
      alpha: 0,
      duration,
      ease: 'Quad.easeOut',
      onComplete: () => dim.destroy(),
    });
  }

  /**
   * Create a pause overlay
   */
  static createPauseOverlay(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const { width, height } = scene.scale;
    
    const container = scene.add.container(0, 0);
    container.setDepth(9998);
    container.setScrollFactor(0);
    
    // Semi-transparent background
    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7);
    bg.setOrigin(0);
    
    // Pause text
    const pauseText = scene.add.text(width / 2, height / 2, 'PAUSED', {
      fontSize: '64px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
    });
    pauseText.setOrigin(0.5);
    pauseText.setShadow(4, 4, '#000000', 10);
    
    // Instruction text
    const instructionText = scene.add.text(
      width / 2,
      height / 2 + 60,
      'Press P to resume',
      {
        fontSize: '24px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    instructionText.setOrigin(0.5);
    instructionText.setAlpha(0.8);
    
    // Gentle pulsing animation
    scene.tweens.add({
      targets: instructionText,
      alpha: 0.5,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    
    container.add([bg, pauseText, instructionText]);
    
    return container;
  }

  /**
   * Create game over overlay with message
   */
  static createGameOverOverlay(
    scene: Phaser.Scene,
    message: string,
    onContinue?: () => void
  ): Phaser.GameObjects.Container {
    const { width, height } = scene.scale;
    
    const container = scene.add.container(0, 0);
    container.setDepth(9998);
    container.setScrollFactor(0);
    container.setAlpha(0);
    
    // Semi-transparent background
    const bg = scene.add.rectangle(0, 0, width, height, 0x000000, 0.8);
    bg.setOrigin(0);
    
    // Message
    const messageText = scene.add.text(width / 2, height / 2 - 40, message, {
      fontSize: '48px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 6,
      align: 'center',
    });
    messageText.setOrigin(0.5);
    
    // Continue hint
    const continueText = scene.add.text(
      width / 2,
      height / 2 + 40,
      'Loading results...',
      {
        fontSize: '20px',
        color: '#cccccc',
        fontFamily: 'Arial, sans-serif',
        align: 'center',
      }
    );
    continueText.setOrigin(0.5);
    
    container.add([bg, messageText, continueText]);
    
    // Fade in
    scene.tweens.add({
      targets: container,
      alpha: 1,
      duration: 600,
      ease: 'Sine.easeIn',
    });
    
    return container;
  }

  /**
   * Screen shake effect (respects reduced motion)
   */
  static shakeScreen(scene: Phaser.Scene, intensity = 10, duration = 200): void {
    try {
      const reducedMotion = localStorage.getItem('nebula_reduced_motion') === 'true';
      if (reducedMotion) return; // Skip if reduced motion
    } catch {
      // Continue if localStorage fails
    }
    
    if (scene.cameras && scene.cameras.main) {
      scene.cameras.main.shake(duration, intensity / 1000);
    }
  }
}
