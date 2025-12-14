import * as Phaser from 'phaser';
import { CozyTheme } from './CozyTheme';

/**
 * Consistent HUD across all mini-games with score, mode, time, and cozy messages
 */
export class CozyHUD {
  private scene: Phaser.Scene;
  private scoreText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private messageText!: Phaser.GameObjects.Text;
  
  private getScore: () => number;
  private getTimeLeft: () => number;
  private mode: 'CALM' | 'NORMAL' | 'FOCUS';
  
  private messageTimer = 0;
  private messageIndex = 0;
  private messageDuration = 10000; // 10 seconds
  
  private cozyMessages = [
    "You're exactly where you need to be.",
    "Small steps still count.",
    "Breathe in… breathe out…",
    "One calm moment at a time.",
    "Take your time, no rush.",
    "Every moment matters.",
    "You're doing great.",
    "Enjoy this peaceful moment.",
  ];

  constructor(
    scene: Phaser.Scene,
    options: {
      mode: 'CALM' | 'NORMAL' | 'FOCUS';
      getScore: () => number;
      getTimeLeft: () => number;
    }
  ) {
    this.scene = scene;
    this.mode = options.mode;
    this.getScore = options.getScore;
    this.getTimeLeft = options.getTimeLeft;
    
    this.createHUD();
  }

  private createHUD() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;

    // Top-left: Score
    this.scoreText = CozyTheme.createSoftText(
      this.scene,
      20,
      20,
      'Score: 0',
      '22px'
    );
    this.scoreText.setScrollFactor(0);
    this.scoreText.setDepth(1000);

    // Top-center: Mode
    const modeColor = this.getModeColorHex();
    this.modeText = CozyTheme.createSoftText(
      this.scene,
      width / 2,
      20,
      `Mode: ${this.mode}`,
      '20px',
      modeColor
    );
    this.modeText.setOrigin(0.5, 0);
    this.modeText.setScrollFactor(0);
    this.modeText.setDepth(1000);

    // Top-right: Time
    this.timeText = CozyTheme.createSoftText(
      this.scene,
      width - 20,
      20,
      'Time: 0s',
      '22px'
    );
    this.timeText.setOrigin(1, 0);
    this.timeText.setScrollFactor(0);
    this.timeText.setDepth(1000);

    // Bottom-center: Cozy message
    this.messageText = this.scene.add.text(
      width / 2,
      height - 40,
      this.cozyMessages[0],
      {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'Arial, sans-serif',
        fontStyle: 'italic',
        align: 'center',
      }
    );
    this.messageText.setOrigin(0.5);
    this.messageText.setAlpha(0.8);
    this.messageText.setScrollFactor(0);
    this.messageText.setDepth(1000);
    
    // Gentle fade in
    this.messageText.setAlpha(0);
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 0.8,
      duration: 1000,
      ease: 'Sine.easeIn',
    });
  }

  /**
   * Update HUD every frame
   */
  update(time: number, delta: number) {
    // Update score
    this.scoreText.setText(`Score: ${this.getScore()}`);

    // Update time
    const timeLeft = this.getTimeLeft();
    this.timeText.setText(`Time: ${Math.ceil(timeLeft)}s`);
    
    // Change color if time is running low
    if (timeLeft <= 10 && timeLeft > 5) {
      this.timeText.setColor('#ffa500');
    } else if (timeLeft <= 5) {
      this.timeText.setColor('#ff6b6b');
    } else {
      this.timeText.setColor('#ffffff');
    }

    // Rotate cozy messages
    this.messageTimer += delta;
    if (this.messageTimer >= this.messageDuration) {
      this.messageTimer = 0;
      this.rotateMessage();
    }
  }

  /**
   * Rotate to next cozy message with fade transition
   */
  private rotateMessage() {
    // Fade out
    this.scene.tweens.add({
      targets: this.messageText,
      alpha: 0,
      duration: 500,
      ease: 'Sine.easeOut',
      onComplete: () => {
        // Change text
        this.messageIndex = (this.messageIndex + 1) % this.cozyMessages.length;
        this.messageText.setText(this.cozyMessages[this.messageIndex]);
        
        // Fade in
        this.scene.tweens.add({
          targets: this.messageText,
          alpha: 0.8,
          duration: 500,
          ease: 'Sine.easeIn',
        });
      },
    });
  }

  /**
   * Show a temporary message (e.g., "Nice!", "Great!")
   */
  showFeedback(message: string, color = '#90ee90', duration = 1500) {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    
    const feedback = CozyTheme.createSoftText(
      this.scene,
      width / 2,
      height / 2 - 50,
      message,
      '32px',
      color
    );
    feedback.setOrigin(0.5);
    feedback.setScrollFactor(0);
    feedback.setDepth(1001);
    feedback.setScale(0);
    
    // Pop in
    this.scene.tweens.add({
      targets: feedback,
      scale: 1.2,
      duration: 200,
      ease: 'Back.easeOut',
    });
    
    // Fade out after duration
    this.scene.time.delayedCall(duration - 500, () => {
      this.scene.tweens.add({
        targets: feedback,
        alpha: 0,
        scale: 0.8,
        y: feedback.y - 30,
        duration: 500,
        ease: 'Sine.easeIn',
        onComplete: () => feedback.destroy(),
      });
    });
  }

  /**
   * Show floating text (e.g., "+1", "+5")
   */
  showFloatingText(x: number, y: number, text: string, color = '#90ee90') {
    const floatingText = this.scene.add.text(x, y, text, {
      fontSize: '24px',
      color,
      fontFamily: 'Arial, sans-serif',
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 4,
    });
    floatingText.setOrigin(0.5);
    floatingText.setDepth(1001);
    
    this.scene.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      ease: 'Quad.easeOut',
      onComplete: () => floatingText.destroy(),
    });
  }

  /**
   * Get mode color as hex string
   */
  private getModeColorHex(): string {
    switch (this.mode) {
      case 'CALM':
        return '#87ceeb';
      case 'NORMAL':
        return '#ffd700';
      case 'FOCUS':
        return '#ff6b6b';
      default:
        return '#ffd700';
    }
  }

  /**
   * Clean up HUD
   */
  destroy() {
    this.scoreText?.destroy();
    this.modeText?.destroy();
    this.timeText?.destroy();
    this.messageText?.destroy();
  }

  /**
   * Static factory method for easy creation
   */
  static create(
    scene: Phaser.Scene,
    options: {
      mode: 'CALM' | 'NORMAL' | 'FOCUS';
      getScore: () => number;
      getTimeLeft: () => number;
    }
  ): CozyHUD {
    return new CozyHUD(scene, options);
  }
}
