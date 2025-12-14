import * as Phaser from 'phaser';
import { FishingScene } from './FishingScene';

export function createFishingGame(parent: string): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent,
    backgroundColor: '#0a0a1e',
    scene: [FishingScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    audio: {
      disableWebAudio: false,
    },
  };

  return new Phaser.Game(config);
}
