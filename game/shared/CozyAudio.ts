import * as Phaser from 'phaser';

/**
 * Audio manager for cozy sound effects with global toggle integration
 */
export class CozyAudio {
  private static soundEnabled: boolean | null = null;

  /**
   * Check if sound is enabled globally
   */
  private static isSoundEnabled(): boolean {
    if (this.soundEnabled === null) {
      try {
        this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
      } catch {
        this.soundEnabled = true;
      }
    }
    return this.soundEnabled;
  }

  /**
   * Refresh sound enabled state (call when user toggles)
   */
  static refreshSoundState(): void {
    try {
      this.soundEnabled = localStorage.getItem('soundEnabled') !== 'false';
    } catch {
      this.soundEnabled = true;
    }
  }

  /**
   * Play a sound if sound is enabled
   */
  private static playSound(scene: Phaser.Scene, key: string, volume = 0.3): void {
    if (!this.isSoundEnabled()) return;
    
    try {
      if (scene.sound && scene.sound.get(key)) {
        scene.sound.play(key, { volume });
      } else {
        // Sound not loaded, fail silently
        console.log(`Sound "${key}" not available`);
      }
    } catch (error) {
      console.error(`Error playing sound "${key}":`, error);
    }
  }

  /**
   * Play click sound (UI interactions)
   */
  static playClick(scene: Phaser.Scene): void {
    this.playSound(scene, 'click', 0.2);
  }

  /**
   * Play success sound (positive feedback)
   */
  static playSuccess(scene: Phaser.Scene, volume = 0.3): void {
    this.playSound(scene, 'success', volume);
  }

  /**
   * Play soft fail sound (gentle negative feedback)
   */
  static playSoftFail(scene: Phaser.Scene): void {
    this.playSound(scene, 'softfail', 0.2);
  }

  /**
   * Play collect sound (picking up items)
   */
  static playCollect(scene: Phaser.Scene): void {
    this.playSound(scene, 'success', 0.25);
  }

  /**
   * Play whoosh sound (movement)
   */
  static playWhoosh(scene: Phaser.Scene): void {
    this.playSound(scene, 'click', 0.15);
  }

  /**
   * Preload common sound effects in a scene
   */
  static preloadSounds(scene: Phaser.Scene): void {
    try {
      // Try to load sounds, fail gracefully if not found
      scene.load.audio('click', '/sfx/click.mp3');
      scene.load.audio('success', '/sfx/success.mp3');
      scene.load.audio('softfail', '/sfx/softfail.mp3');
    } catch (error) {
      console.log('Could not load sound files:', error);
    }
    
    // Set error handler to prevent crashes
    scene.load.on('loaderror', (file: any) => {
      console.log(`Failed to load: ${file.key}`);
    });
  }

  /**
   * Play a custom sound with volume
   */
  static playCustom(scene: Phaser.Scene, key: string, volume = 0.3): void {
    this.playSound(scene, key, volume);
  }

  /**
   * Stop all sounds in scene
   */
  static stopAll(scene: Phaser.Scene): void {
    try {
      if (scene.sound) {
        scene.sound.stopAll();
      }
    } catch (error) {
      console.error('Error stopping sounds:', error);
    }
  }
}
