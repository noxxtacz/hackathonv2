import * as Phaser from 'phaser';
import { SpeechBubble } from '../SpeechBubble';

/**
 * Chicken that pecks around and runs away from player
 */
export class Chicken {
  private scene: Phaser.Scene;
  private body: Phaser.GameObjects.Ellipse;
  private head: Phaser.GameObjects.Arc;
  private beak: Phaser.GameObjects.Triangle;
  private comb: Phaser.GameObjects.Arc;
  private legs: Phaser.GameObjects.Line[];
  private speechBubble: SpeechBubble;
  private x: number;
  private y: number;
  private targetX: number;
  private targetY: number;
  private moveTimer = 0;
  private isMoving = false;
  private isPecking = false;
  private speed = 40;
  private fleeSpeed = 80;
  private isFleeing = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.targetY = y;
    this.speechBubble = new SpeechBubble(scene);

    // Create chicken body (white/cream)
    this.body = scene.add.ellipse(x, y, 28, 32, 0xfff8dc);
    
    // Create head
    this.head = scene.add.circle(x, y - 18, 8, 0xfff8dc);
    
    // Create beak
    this.beak = scene.add.triangle(x + 8, y - 18, 0, -2, 6, 0, 0, 2, 0xffa500);
    
    // Create comb (red)
    this.comb = scene.add.arc(x, y - 24, 4, 0, 180, false, 0xff0000);
    
    // Create legs
    this.legs = [
      scene.add.line(0, 0, x - 6, y + 16, x - 6, y + 24, 0xffa500),
      scene.add.line(0, 0, x + 6, y + 16, x + 6, y + 24, 0xffa500),
    ];
    this.legs.forEach(leg => leg.setStrokeStyle(2, 0xffa500));

    // Start pecking behavior
    this.schedulePeck();
  }

  /**
   * Update chicken behavior
   */
  update(delta: number, playerX: number, playerY: number) {
    // Check if player is too close
    const distance = Phaser.Math.Distance.Between(this.x, this.y, playerX, playerY);
    
    if (distance < 70 && !this.isFleeing) {
      // Player is close! Run away!
      this.startFleeing(playerX, playerY);
    }

    if (this.isMoving || this.isFleeing) {
      // Move towards target
      const targetDistance = Phaser.Math.Distance.Between(this.x, this.y, this.targetX, this.targetY);
      
      if (targetDistance < 2) {
        // Reached target
        this.isMoving = false;
        this.isFleeing = false;
        this.schedulePeck();
      } else {
        // Move towards target
        const angle = Math.atan2(this.targetY - this.y, this.targetX - this.x);
        const currentSpeed = this.isFleeing ? this.fleeSpeed : this.speed;
        this.x += Math.cos(angle) * currentSpeed * delta / 1000;
        this.y += Math.sin(angle) * currentSpeed * delta / 1000;
        
        // Update positions
        this.updatePosition();

        // Bob animation while moving
        const bobOffset = Math.sin(Date.now() / 100) * 2;
        this.body.y = this.y + bobOffset;
        this.head.y = this.y - 18 + bobOffset;
      }
    } else if (this.isPecking) {
      // Pecking animation
      const peckOffset = Math.sin(Date.now() / 150) * 3;
      this.head.y = this.y - 18 + peckOffset;
      this.beak.y = this.y - 18 + peckOffset;
      this.comb.y = this.y - 24 + peckOffset;
    }
  }

  /**
   * Schedule next peck behavior
   */
  private schedulePeck() {
    this.isPecking = true;
    
    this.scene.time.delayedCall(Phaser.Math.Between(1000, 2000), () => {
      this.isPecking = false;
      this.startWandering();
    });
  }

  /**
   * Start wandering to nearby location
   */
  private startWandering() {
    // Short distance movement
    this.targetX = this.x + Phaser.Math.Between(-50, 50);
    this.targetY = this.y + Phaser.Math.Between(-30, 30);
    this.isMoving = true;
  }

  /**
   * Flee from player
   */
  private startFleeing(playerX: number, playerY: number) {
    this.isFleeing = true;
    this.isPecking = false;
    this.isMoving = false;

    // Show cluck bubble
    if (!this.speechBubble.isShowing()) {
      this.speechBubble.show(this.x, this.y, '🐔 Cluck cluck!', 1200);
    }

    // Run away from player
    const angle = Math.atan2(this.y - playerY, this.x - playerX);
    this.targetX = this.x + Math.cos(angle) * 120;
    this.targetY = this.y + Math.sin(angle) * 120;
  }

  /**
   * Update sprite positions
   */
  private updatePosition() {
    this.body.x = this.x;
    this.body.y = this.y;
    this.head.x = this.x;
    this.head.y = this.y - 18;
    this.beak.x = this.x + 8;
    this.beak.y = this.y - 18;
    this.comb.x = this.x;
    this.comb.y = this.y - 24;
    
    this.legs[0].setTo(this.x - 6, this.y + 16, this.x - 6, this.y + 24);
    this.legs[1].setTo(this.x + 6, this.y + 16, this.x + 6, this.y + 24);
  }

  /**
   * Get chicken position
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Set boundaries for movement
   */
  clampPosition(minX: number, maxX: number, minY: number, maxY: number) {
    this.x = Phaser.Math.Clamp(this.x, minX, maxX);
    this.y = Phaser.Math.Clamp(this.y, minY, maxY);
    this.targetX = Phaser.Math.Clamp(this.targetX, minX, maxX);
    this.targetY = Phaser.Math.Clamp(this.targetY, minY, maxY);
    this.updatePosition();
  }

  /**
   * Destroy the chicken
   */
  destroy() {
    this.body.destroy();
    this.head.destroy();
    this.beak.destroy();
    this.comb.destroy();
    this.legs.forEach(leg => leg.destroy());
  }
}
