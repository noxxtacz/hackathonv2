import * as Phaser from 'phaser';
import { SpeechBubble } from '../SpeechBubble';

/**
 * Friendly dog that barks when interacted with
 * Uses pixel art sprite sheets with animations
 */
export class Dog {
  private scene: Phaser.Scene;
  private sprite: Phaser.GameObjects.Sprite | null = null;
  private body: Phaser.GameObjects.Rectangle | null = null;
  private head: Phaser.GameObjects.Arc | null = null;
  private ear1: Phaser.GameObjects.Triangle | null = null;
  private ear2: Phaser.GameObjects.Triangle | null = null;
  private tail: Phaser.GameObjects.Rectangle | null = null;
  private label: Phaser.GameObjects.Text;
  private speechBubble: SpeechBubble;
  private lastBarkTime = 0;
  private barkCooldown = 2000; // 2 seconds
  private x: number;
  private y: number;
  private isBarking = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.speechBubble = new SpeechBubble(scene);

    // Try to use sprite first, fallback to shapes
    if (scene.textures.exists('dogSheet')) {
      this.sprite = scene.add.sprite(x, y, 'dogSheet');
      this.sprite.setScale(1.5); // Scale up for visibility
      
      // ADJUST THESE: Idle animation frame presets (use frames that look like breathing/subtle movement)
      const DOG_IDLE_FRAMES = [0, 1, 2, 1]; // Default preset - smooth breathing loop
      const PRESET_1 = [0, 1, 2, 1];        // Preset 1: Press '1' to use
      const PRESET_2 = [3, 4, 5, 4];        // Preset 2: Press '2' to use
      const PRESET_3 = [6, 7, 8, 7];        // Preset 3: Press '3' to use
      
      // Create dog-idle animation with explicit frame list
      if (!scene.anims.exists('dog-idle')) {
        scene.anims.create({
          key: 'dog-idle',
          frames: scene.anims.generateFrameNumbers('dogSheet', { 
            frames: DOG_IDLE_FRAMES 
          }),
          frameRate: 6, // Adjust between 5-7 for speed
          repeat: -1 // Loop forever
        });
      }
      
      // Play idle animation by default (dog stays in place)
      this.sprite.play('dog-idle');
      
      // DEBUG: Add keyboard handlers to switch idle presets (Press 1, 2, or 3)
      const key1 = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
      const key2 = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
      const key3 = scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.THREE);
      
      if (key1) {
        key1.on('down', () => {
          if (this.sprite) {
            scene.anims.remove('dog-idle');
            scene.anims.create({
              key: 'dog-idle',
              frames: scene.anims.generateFrameNumbers('dogSheet', { frames: PRESET_1 }),
              frameRate: 6,
              repeat: -1
            });
            this.sprite.play('dog-idle');
            console.log('Dog idle preset 1:', PRESET_1);
          }
        });
      }
      
      if (key2) {
        key2.on('down', () => {
          if (this.sprite) {
            scene.anims.remove('dog-idle');
            scene.anims.create({
              key: 'dog-idle',
              frames: scene.anims.generateFrameNumbers('dogSheet', { frames: PRESET_2 }),
              frameRate: 6,
              repeat: -1
            });
            this.sprite.play('dog-idle');
            console.log('Dog idle preset 2:', PRESET_2);
          }
        });
      }
      
      if (key3) {
        key3.on('down', () => {
          if (this.sprite) {
            scene.anims.remove('dog-idle');
            scene.anims.create({
              key: 'dog-idle',
              frames: scene.anims.generateFrameNumbers('dogSheet', { frames: PRESET_3 }),
              frameRate: 6,
              repeat: -1
            });
            this.sprite.play('dog-idle');
            console.log('Dog idle preset 3:', PRESET_3);
          }
        });
      }
    } else {
      // Fallback to original shapes
      this.body = scene.add.rectangle(x, y, 40, 24, 0x8b4513);
      this.head = scene.add.circle(x + 18, y - 2, 14, 0x8b4513);
      this.ear1 = scene.add.triangle(x + 12, y - 12, 0, 0, 8, 12, 0, 12, 0x654321);
      this.ear2 = scene.add.triangle(x + 24, y - 12, 0, 0, 8, 12, 0, 12, 0x654321);
      this.tail = scene.add.rectangle(x - 24, y - 4, 10, 6, 0x8b4513);
      this.tail.setOrigin(0, 0.5);
      
      // Wag tail animation
      scene.tweens.add({
        targets: this.tail,
        angle: -20,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });

      // Slight idle bob animation
      scene.tweens.add({
        targets: [this.body, this.head, this.ear1, this.ear2, this.tail],
        y: '+=2',
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Add label
    this.label = scene.add.text(x, y + 40, '🐶', {
      fontSize: '16px',
    }).setOrigin(0.5);
  }

  /**
   * Check if player is near and can interact
   */
  isNearPlayer(playerX: number, playerY: number): boolean {
    const distance = Phaser.Math.Distance.Between(playerX, playerY, this.x, this.y);
    return distance < 60;
  }

  /**
   * Make the dog bark (with cooldown)
   */
  bark(): boolean {
    const now = Date.now();
    
    // Check cooldown or if already barking
    if (now - this.lastBarkTime < this.barkCooldown || this.isBarking) {
      return false;
    }

    this.lastBarkTime = now;
    this.isBarking = true;

    // Show speech bubble
    this.speechBubble.show(this.x, this.y - 20, 'Bark! Bark! 🐾', 1800);

    // Play bark sound (if available and sound is enabled)
    try {
      const isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
      if (isSoundEnabled && this.scene.sound) {
        this.scene.sound.play('bark', { volume: 0.3 });
      }
    } catch (error) {
      console.log('Bark sound not available:', error);
    }

    // Visual feedback: slight bounce animation (dog keeps idling)
    if (this.sprite) {
      // Quick bounce without interrupting idle animation
      this.scene.tweens.add({
        targets: this.sprite,
        y: this.y - 8,
        duration: 150,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.isBarking = false;
        }
      });
    } else {
      // Fallback jump animation for shapes
      const targets = [this.body, this.head, this.ear1, this.ear2, this.tail, this.label].filter(t => t !== null);
      this.scene.tweens.add({
        targets,
        y: '-=8',
        duration: 200,
        yoyo: true,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.isBarking = false;
        }
      });
    }

    return true;
  }

  /**
   * Get dog position
   */
  getPosition() {
    return { x: this.x, y: this.y };
  }

  /**
   * Destroy the dog
   */
  destroy() {
    if (this.sprite) {
      this.sprite.destroy();
    }
    if (this.body) this.body.destroy();
    if (this.head) this.head.destroy();
    if (this.ear1) this.ear1.destroy();
    if (this.ear2) this.ear2.destroy();
    if (this.tail) this.tail.destroy();
    this.label.destroy();
  }
}
