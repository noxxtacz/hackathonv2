import * as Phaser from 'phaser';

/**
 * Reusable speech bubble system for showing text above entities
 */
export class SpeechBubble {
  private scene: Phaser.Scene;
  private bubble?: Phaser.GameObjects.Container;
  private isActive = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Show a speech bubble above an entity
   * @param x X position
   * @param y Y position (will appear above this)
   * @param text Text to display
   * @param duration How long to show (ms)
   */
  show(x: number, y: number, text: string, duration = 2000) {
    // Don't create new bubble if one is already active
    if (this.isActive) return;

    this.isActive = true;

    // Create container for bubble
    this.bubble = this.scene.add.container(x, y - 50);

    // Measure text to size bubble appropriately
    const tempText = this.scene.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#000000',
    });
    const textWidth = tempText.width;
    const textHeight = tempText.height;
    tempText.destroy();

    // Create bubble background
    const padding = 12;
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = textHeight + padding * 2;

    const background = this.scene.add.graphics();
    background.fillStyle(0xffffff, 1);
    background.lineStyle(2, 0x333333, 1);
    background.fillRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);
    background.strokeRoundedRect(-bubbleWidth / 2, -bubbleHeight / 2, bubbleWidth, bubbleHeight, 8);

    // Create tail/pointer
    background.fillStyle(0xffffff, 1);
    background.lineStyle(2, 0x333333, 1);
    background.beginPath();
    background.moveTo(-8, bubbleHeight / 2);
    background.lineTo(0, bubbleHeight / 2 + 8);
    background.lineTo(8, bubbleHeight / 2);
    background.closePath();
    background.fillPath();
    background.strokePath();

    // Create text
    const bubbleText = this.scene.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#000000',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    // Add to container
    this.bubble.add([background, bubbleText]);

    // Animate in
    this.bubble.setScale(0);
    this.scene.tweens.add({
      targets: this.bubble,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    // Auto-destroy after duration
    this.scene.time.delayedCall(duration, () => {
      this.hide();
    });
  }

  /**
   * Hide the bubble
   */
  hide() {
    if (!this.bubble || !this.isActive) return;

    this.scene.tweens.add({
      targets: this.bubble,
      scaleX: 0,
      scaleY: 0,
      alpha: 0,
      duration: 150,
      ease: 'Back.easeIn',
      onComplete: () => {
        this.bubble?.destroy();
        this.bubble = undefined;
        this.isActive = false;
      },
    });
  }

  /**
   * Update bubble position (call in update loop if entity moves)
   */
  updatePosition(x: number, y: number) {
    if (this.bubble) {
      this.bubble.x = x;
      this.bubble.y = y - 50;
    }
  }

  /**
   * Check if bubble is currently showing
   */
  isShowing(): boolean {
    return this.isActive;
  }
}
