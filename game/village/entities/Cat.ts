import * as Phaser from 'phaser';
import { SpeechBubble } from '../SpeechBubble';

/**
 * Wandering cat that meows when near player
 */
export class Cat {
  private scene: Phaser.Scene;
  private body: Phaser.GameObjects.Ellipse;
  private head: Phaser.GameObjects.Arc;
  private ear1: Phaser.GameObjects.Triangle;
  private ear2: Phaser.GameObjects.Triangle;
  private tail: Phaser.GameObjects.Arc;
  private speechBubble: SpeechBubble;
  private x: number;
  private y: number;
  private targetX: number;
  private targetY: number;
  private moveTimer = 0;
  private isMoving = false;
  private isSitting = false;
  private speed = 20;
  private color: number;

  constructor(scene: Phaser.Scene, x: number, y: number, color: number = 0xffa500) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.color = color;
    this.speechBubble = new SpeechBubble(scene);

    // Create cat body
    this.body = scene.add.ellipse(x, y, 32, 20, color);
    
    // Create cat head
    this.head = scene.add.circle(x, y - 12, 10, color);
    
    // Create ears (triangles)
    this.ear1 = scene.add.triangle(x - 6, y - 20, 0, 8, 4, 0, 8, 8, color);
    this.ear2 = scene.add.triangle(x + 6, y - 20, 0, 8, 4, 0, 8, 8, color);
    
    // Create tail (curved)
    this.tail = scene.add.arc(x - 18, y - 4, 12, 180, 360, false, 0x000000, 0);
    this.tail.setStrokeStyle(3, color);
    
    // Tail sway animation
    scene.tweens.add({
      targets: this.tail,
      angle: 15,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Start wandering behavior
    this.scheduleNextMove();
  }

  /**
   * Update cat behavior
   */
  update(delta: number) {
    this.moveTimer -= delta;

    if (this.isMoving) {
      // Move towards target
      const distance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
      
      if (distance < 2) {
        // Reached target
        this.isMoving = false;
        this.isSitting = Math.random() < 0.4; // 40% chance to sit
        this.scheduleNextMove();
      } else {
        // Move towards target
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        this.x += Math.cos(angle) * this.speed * delta / 1000;
        this.y += Math.sin(angle) * this.speed * delta / 1000;
        
        // Update positions
        this.updatePosition();
      }
    }

    // Check if near player for meow
    // This will be called from VillageScene
  }

  /**
   * Schedule next movement
   */
  private scheduleNextMove() {
    if (this.isSitting) {
      // Sit for a while
      this.moveTimer = Phaser.Math.Between(2000, 5000);
      this.isSitting = false;
    } else {
      // Wait before next move
      this.moveTimer = Phaser.Math.Between(1000, 3000);
    }

    this.scene.time.delayedCall(this.moveTimer, () => {
      this.startWandering();
    });
  }

  /**
   * Start wandering to a random nearby location
   */
  private startWandering() {
    // Pick random nearby point
    this.targetX = this.x + Phaser.Math.Between(-100, 100);
    this.targetY = this.y + Phaser.Math.Between(-50, 50);
    
    // Keep in world bounds (will be clamped in VillageScene)
    this.isMoving = true;
  }

  /**
   * Update sprite positions
   */
  private updatePosition() {
    this.body.x = this.x;
    this.body.y = this.y;
    this.head.x = this.x;
    this.head.y = this.y - 12;
    this.ear1.x = this.x - 6;
    this.ear1.y = this.y - 20;
    this.ear2.x = this.x + 6;
    this.ear2.y = this.y - 20;
    this.tail.x = this.x - 18;
    this.tail.y = this.y - 4;
  }

  /**
   * Check if player is near
   */
  isNearPlayer(playerX: number, playerY: number): boolean {
    const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    return distance < 50;
  }

  /**
   * Make the cat meow
   */
  meow() {
    if (this.speechBubble.isShowing()) return;

    // Show speech bubble
    this.speechBubble.show(this.x, this.y, '🐱 Meow~', 1500);

    // Play meow sound (if available)
    try {
      const isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
      if (isSoundEnabled && this.scene.sound) {
        this.scene.sound.play('meow', { volume: 0.2 });
      }
    } catch (error) {
      // Sound not available
    }

    // Slight bounce
    this.scene.tweens.add({
      targets: [this.body, this.head, this.ear1, this.ear2],
      y: '-=4',
      duration: 150,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  /**
   * Get cat position
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Set boundaries for wandering
   */
  clampPosition(minX: number, maxX: number, minY: number, maxY: number) {
    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
    this.y = Phaser.Math.Clamp(this.y, minY, maxY);
    this.targetX = Phaser.Math.Clamp(this.targetX, minX, maxX);
    this.targetY = Phaser.Math.Clamp(this.targetY, minY, maxY);
    this.updatePosition();
  }

  /**
   * Destroy the cat
   */
  destroy() {
    this.body.destroy();
    this.head.destroy();
    this.ear1.destroy();
    this.ear2.destroy();
    this.tail.destroy();
  }
}
