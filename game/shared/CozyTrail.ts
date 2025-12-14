import * as Phaser from 'phaser';

/**
 * Motion blur trail system using RenderTexture
 */
export class CozyTrail {
  private scene: Phaser.Scene;
  private renderTexture: Phaser.GameObjects.RenderTexture;
  private isEnabled: boolean;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    
    // Check reduced motion setting
    const reducedMotion = typeof window !== 'undefined' 
      ? localStorage.getItem('nebula_reduced_motion') === 'true'
      : false;
    
    this.isEnabled = !reducedMotion;

    // Create render texture for trails
    this.renderTexture = scene.add.renderTexture(0, 0, width, height);
    this.renderTexture.setDepth(5);
    this.renderTexture.setBlendMode(Phaser.BlendModes.ADD);
    this.renderTexture.setAlpha(0.6);
  }

  /**
   * Draw a trail point
   */
  draw(x: number, y: number, radius = 8, color = 0xffffff, alpha = 0.3) {
    if (!this.isEnabled) return;

    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(color, alpha);
    graphics.fillCircle(x, y, radius);
    
    this.renderTexture.draw(graphics, 0, 0);
    graphics.destroy();
  }

  /**
   * Fade the entire trail (called each frame)
   */
  fade(amount = 0.02) {
    if (!this.isEnabled) return;
    
    // Fade by drawing a semi-transparent black rectangle
    const graphics = this.scene.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x000000, amount);
    graphics.fillRect(0, 0, this.renderTexture.width, this.renderTexture.height);
    
    this.renderTexture.draw(graphics, 0, 0);
    graphics.destroy();
  }

  /**
   * Clear the trail
   */
  clear() {
    this.renderTexture.clear();
  }

  /**
   * Clean up
   */
  destroy() {
    this.renderTexture.destroy();
  }

  /**
   * Get render texture for custom operations
   */
  getTexture(): Phaser.GameObjects.RenderTexture {
    return this.renderTexture;
  }

  /**
   * Static factory method
   */
  static create(scene: Phaser.Scene, width: number, height: number): CozyTrail {
    return new CozyTrail(scene, width, height);
  }
}
