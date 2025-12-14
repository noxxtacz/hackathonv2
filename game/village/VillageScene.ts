import * as Phaser from 'phaser';
import { Dog } from './entities/Dog';
import { Cat } from './entities/Cat';
import { Chicken } from './entities/Chicken';

export class VillageScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerHead!: Phaser.GameObjects.Arc;
  private playerLabel!: Phaser.GameObjects.Text;
  private npc!: Phaser.GameObjects.Rectangle;
  private npcLabel!: Phaser.GameObjects.Text;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private interactKey!: Phaser.Input.Keyboard.Key;
  private interactPrompt!: Phaser.GameObjects.Text;
  private speed = 200;
  private nearNPC = false;
  private inputEnabled = true;

  // Animals
  private dog!: Dog;
  private cats: Cat[] = [];
  private chickens: Chicken[] = [];
  private nearDog = false;
  private dogPrompt!: Phaser.GameObjects.Text;

  // World bounds
  private worldWidth = 2400;
  private worldHeight = 1800;

  constructor() {
    super({ key: 'VillageScene' });
  }

  preload() {
    // Load sound effects
    try {
      this.load.audio('bark', '/audio/bark.mp3');
      this.load.audio('meow', '/audio/meow.mp3');
    } catch (error) {
      console.log('Audio files not loaded:', error);
    }
    
    // Load Mystic Woods sprites
    try {
      this.load.image('grass', '/sprites/tilesets/grass.png');
      this.load.image('decor_16x16', '/sprites/tilesets/decor_16x16.png');
      this.load.image('decor_8x8', '/sprites/tilesets/decor_8x8.png');
      this.load.image('fences', '/sprites/tilesets/fences.png');
      this.load.image('objects', '/sprites/objects/objects.png');
      this.load.image('chest', '/sprites/objects/chest_01.png');
      this.load.spritesheet('player', '/sprites/characters/player.png', { frameWidth: 48, frameHeight: 48 });
      this.load.spritesheet('slime', '/sprites/characters/slime.png', { frameWidth: 32, frameHeight: 32 });
      
      // Dog Spritesheet Configuration - ADJUST THESE VALUES IF NEEDED
      const DOG_FRAME_WIDTH = 48;  // Width of each frame in pixels
      const DOG_FRAME_HEIGHT = 48; // Height of each frame in pixels
      
      // Load dog sprite sheet with idle animation (first row only)
      this.load.spritesheet('dogSheet', '/sprites/dog/Dogs-Remastered-20.png', { 
        frameWidth: DOG_FRAME_WIDTH, 
        frameHeight: DOG_FRAME_HEIGHT 
      });
    } catch (error) {
      console.log('Sprite assets not loaded:', error);
    }
    
    // Load bark sound
    try {
      this.load.audio('bark', '/audio/bark.mp3');
    } catch (error) {
      console.log('Audio not loaded:', error);
    }
  }

  create() {
    // Set world bounds (bigger map!)
    this.physics.world.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Create village background
    this.createBackground();

    // Create decorative elements
    this.createDecorations();

    // Create NPC (Luna)
    this.createNPC();

    // Create animals
    this.createAnimals();

    // Create player
    this.createPlayer();

    // Setup camera to follow player
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBounds(0, 0, this.worldWidth, this.worldHeight);

    // Setup input
    this.setupInput();

    // Create interact prompts (hidden initially)
    this.interactPrompt = this.add.text(400, 500, 'Press E to talk', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#1a1a2e',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setVisible(false).setScrollFactor(1);

    this.dogPrompt = this.add.text(400, 500, 'Press E to pet', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#8b4513',
      padding: { x: 12, y: 8 },
    }).setOrigin(0.5).setVisible(false).setScrollFactor(1);

    // Add ambient particles
    this.createAmbientParticles();
  }

  createBackground() {
    // Check if grass tileset is loaded
    if (this.textures.exists('grass')) {
      // Create tiled grass background using the sprite
      const tileSize = 16;
      for (let x = 0; x < this.worldWidth; x += tileSize) {
        for (let y = 800; y < this.worldHeight; y += tileSize) {
          const tile = this.add.image(x, y, 'grass').setOrigin(0, 0);
          tile.setDisplaySize(tileSize, tileSize);
          tile.setTint(0x2d5a3e); // Slight green tint for variety
        }
      }
    } else {
      // Fallback to solid color
      const graphics = this.add.graphics();
      graphics.fillStyle(0x2d4a3e, 1);
      graphics.fillRect(0, 800, this.worldWidth, 1000);
    }

    // Main path using graphics (keep as is for contrast)
    const pathGraphics = this.add.graphics();
    pathGraphics.fillStyle(0x8b7355, 1);
    pathGraphics.fillRect(this.worldWidth / 2 - 60, 800, 120, 1000);
    pathGraphics.fillRect(200, 1100, this.worldWidth - 400, 100);
    pathGraphics.fillRect(400, 1400, this.worldWidth - 800, 100);

    // Sky gradient (top area)
    const skyGraphics = this.add.graphics();
    skyGraphics.fillStyle(0x1a1a3e, 1);
    skyGraphics.fillRect(0, 0, this.worldWidth, 800);
    
    // Moon
    this.add.circle(1200, 200, 60, 0xffffff, 0.9);
    this.add.circle(1185, 190, 50, 0x1a1a2e, 1); // Crescent effect

    // Stars scattered across sky
    for (let i = 0; i < 150; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(0, 700);
      const size = Phaser.Math.FloatBetween(1, 3);
      
      const star = this.add.circle(x, y, size, 0xffffff, Phaser.Math.FloatBetween(0.5, 1));
      
      // Twinkle
      this.tweens.add({
        targets: star,
        alpha: 0.3,
        duration: Phaser.Math.Between(1000, 2000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  createDecorations() {
    // Houses - spread across the map
    this.createHouse(300, 900, 0x6b4423);
    this.createHouse(700, 950, 0x4a6741);
    this.createHouse(1200, 920, 0x8b6914);
    this.createHouse(1600, 880, 0x6b4423);
    this.createHouse(2000, 940, 0x4a6741);
    this.createHouse(500, 1300, 0x8b6914);
    this.createHouse(1800, 1320, 0x6b4423);

    // Trees - scattered throughout
    const treePositions = [
      [200, 850], [400, 880], [650, 920], [900, 860],
      [1100, 900], [1400, 870], [1700, 920], [1900, 880],
      [2100, 900], [250, 1250], [550, 1280], [850, 1240],
      [1150, 1270], [1450, 1250], [1750, 1280], [2050, 1260],
      [300, 1450], [700, 1480], [1100, 1450], [1500, 1470],
      [1900, 1450], [2200, 1480],
    ];
    
    treePositions.forEach(([x, y]) => this.createTree(x, y));

    // Flowers - random scattered (use sprite if available)
    for (let i = 0; i < 80; i++) {
      const x = Phaser.Math.Between(100, this.worldWidth - 100);
      const y = Phaser.Math.Between(850, 1700);
      const color = Phaser.Math.RND.pick([0xff69b4, 0xffff00, 0x87ceeb, 0xffa500]);
      this.add.circle(x, y, 4, color);
    }
    
    // Add decorative chests
    if (this.textures.exists('chest')) {
      this.add.image(600, 1050, 'chest').setScale(2);
      this.add.image(1400, 1150, 'chest').setScale(2);
      this.add.image(2100, 1350, 'chest').setScale(2);
    }

    // Fence around farm area (right side)
    this.createFarmArea();

    // Pond/Well decoration
    this.createPond(400, 1500);
    this.createWell(1800, 1100);
  }

  createFarmArea() {
    // Farm fence on right side
    const farmX = 2100;
    const farmY = 1400;
    
    // Horizontal fences
    for (let x = 1900; x < 2300; x += 40) {
      this.add.rectangle(x, farmY - 100, 8, 30, 0x8b4513);
      this.add.rectangle(x, farmY + 100, 8, 30, 0x8b4513);
    }
    
    // Vertical fences
    for (let y = farmY - 100; y < farmY + 100; y += 40) {
      this.add.rectangle(1900, y, 8, 30, 0x8b4513);
      this.add.rectangle(2300, y, 8, 30, 0x8b4513);
    }

    // Farm sign
    this.add.text(farmX, farmY - 150, '🌾 Farm', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#8b4513',
      padding: { x: 10, y: 6 },
    }).setOrigin(0.5);
  }

  createPond(x: number, y: number) {
    // Pond
    const pond = this.add.ellipse(x, y, 120, 80, 0x4682b4, 0.6);
    
    // Ripple effect
    this.tweens.add({
      targets: pond,
      alpha: 0.4,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Lily pads
    this.add.circle(x - 30, y - 10, 12, 0x228b22);
    this.add.circle(x + 25, y + 15, 10, 0x228b22);
  }

  createWell(x: number, y: number) {
    // Well base
    this.add.rectangle(x, y, 50, 30, 0x8b4513);
    
    // Well posts
    this.add.rectangle(x - 20, y - 20, 8, 40, 0x654321);
    this.add.rectangle(x + 20, y - 20, 8, 40, 0x654321);
    
    // Well roof
    this.add.triangle(x, y - 45, 0, 15, 35, 0, 70, 15, 0x8b0000);
    
    // Bucket
    this.add.rectangle(x, y - 5, 12, 10, 0x696969);
  }

  createHouse(x: number, y: number, color: number) {
    // House body
    this.add.rectangle(x, y + 30, 100, 60, color);
    
    // Roof
    const roof = this.add.triangle(x, y - 10, 0, 40, 60, 0, 120, 40, 0x8b0000);
    roof.setOrigin(0.5, 0.5);
    
    // Door
    this.add.rectangle(x, y + 45, 20, 30, 0x4a3000);
    
    // Window
    this.add.rectangle(x - 25, y + 25, 18, 18, 0xffff88);
    this.add.rectangle(x + 25, y + 25, 18, 18, 0xffff88);
  }

  createTree(x: number, y: number) {
    // Trunk
    this.add.rectangle(x, y + 20, 15, 40, 0x4a3000);
    
    // Foliage
    this.add.circle(x, y - 10, 30, 0x228b22);
    this.add.circle(x - 15, y, 20, 0x228b22);
    this.add.circle(x + 15, y, 20, 0x228b22);
  }

  createNPC() {
    // NPC body (purple/magical looking) - positioned in center of map
    this.npc = this.add.rectangle(1200, 1000, 32, 48, 0x9b59b6);
    
    // NPC details
    this.add.circle(1200, 985, 12, 0xfdbcb4); // Head
    this.add.circle(1196, 983, 3, 0x000000); // Eye
    this.add.circle(1204, 983, 3, 0x000000); // Eye
    
    // Wizard hat
    this.add.triangle(1200, 965, 0, 20, 12, 0, 24, 20, 0x4a235a);
    
    // Glow effect
    const glow = this.add.circle(1200, 1000, 40, 0x9b59b6, 0.2);
    this.tweens.add({
      targets: glow,
      alpha: 0.4,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 1500,
      yoyo: true,
      repeat: -1,
    });

    // NPC label
    this.npcLabel = this.add.text(1200, 940, '🌟 Luna', {
      fontSize: '14px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  createAnimals() {
    // Create one friendly dog near village center
    this.dog = new Dog(this, 1000, 1100);

    // Create 3 wandering cats
    this.cats.push(new Cat(this, 600, 1050, 0xffa500)); // Orange cat
    this.cats.push(new Cat(this, 1500, 1200, 0x808080)); // Gray cat
    this.cats.push(new Cat(this, 900, 1350, 0xffffff)); // White cat

    // Create 4 chickens in farm area
    this.chickens.push(new Chicken(this, 2050, 1350));
    this.chickens.push(new Chicken(this, 2100, 1400));
    this.chickens.push(new Chicken(this, 2200, 1380));
    this.chickens.push(new Chicken(this, 2150, 1450));
  }

  createPlayer() {
    // Player - use sprite if available, otherwise fallback to shapes
    if (this.textures.exists('player')) {
      const playerSprite = this.add.sprite(1200, 1200, 'player', 0);
      playerSprite.setScale(1.5);
      this.player = playerSprite as any; // Cast to rectangle for compatibility
      
      // Create idle animation if not exists
      if (!this.anims.exists('player_idle')) {
        this.anims.create({
          key: 'player_idle',
          frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
          frameRate: 4,
          repeat: -1
        });
      }
      playerSprite.play('player_idle');
    } else {
      // Fallback to original shapes
      this.player = this.add.rectangle(1200, 1200, 28, 44, 0x3498db);
      this.playerHead = this.add.circle(1200, 1185, 10, 0xfdbcb4);
    }
    
    // Player label
    this.playerLabel = this.add.text(1200, 1230, '🎮 You', {
      fontSize: '12px',
      color: '#ffffff',
    }).setOrigin(0.5);
  }

  setupInput() {
    if (!this.input.keyboard) return;
    
    this.cursors = this.input.keyboard.createCursorKeys();
    
    this.wasd = {
      W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
  }

  createAmbientParticles() {
    // Floating particles (fireflies/dust) - more for bigger map
    for (let i = 0; i < 60; i++) {
      const x = Phaser.Math.Between(0, this.worldWidth);
      const y = Phaser.Math.Between(800, 1700);
      
      const particle = this.add.circle(x, y, 2, 0xffff88, 0.6);
      
      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(20, 50),
        x: x + Phaser.Math.Between(-30, 30),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        onRepeat: () => {
          particle.x = Phaser.Math.Between(0, this.worldWidth);
          particle.y = Phaser.Math.Between(800, 1700);
          particle.alpha = 0.6;
        },
      });
    }
  }

  update(time: number, delta: number) {
    if (!this.cursors || !this.wasd) return;

    // Check if input is enabled (disabled when modal is open)
    if (!this.inputEnabled) {
      return; // Don't process any input when modal is open
    }

    let vx = 0;
    let vy = 0;

    // Movement
    if (this.cursors.left.isDown || this.wasd.A.isDown) {
      vx = -this.speed;
    } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
      vx = this.speed;
    }

    if (this.cursors.up.isDown || this.wasd.W.isDown) {
      vy = -this.speed;
    } else if (this.cursors.down.isDown || this.wasd.S.isDown) {
      vy = this.speed;
    }

    // Apply movement
    const deltaSeconds = delta / 1000;
    this.player.x += vx * deltaSeconds;
    this.player.y += vy * deltaSeconds;

    // Keep player in bounds
    this.player.x = Phaser.Math.Clamp(this.player.x, 30, this.worldWidth - 30);
    this.player.y = Phaser.Math.Clamp(this.player.y, 830, this.worldHeight - 30);

    // Update player parts (head and label)
    if (this.playerHead) {
      this.playerHead.x = this.player.x;
      this.playerHead.y = this.player.y - 15;
    }
    this.playerLabel.x = this.player.x;
    this.playerLabel.y = this.player.y + 30;

    // Update animals
    this.updateAnimals(delta);

    // Check distance to NPC
    const npcDistance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.npc.x, this.npc.y
    );

    this.nearNPC = npcDistance < 80;
    this.interactPrompt.setVisible(this.nearNPC);

    if (this.nearNPC) {
      this.interactPrompt.x = this.npc.x;
      this.interactPrompt.y = this.npc.y + 60;
    }

    // Check distance to dog
    const dogPos = this.dog.getPosition();
    const dogDistance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      dogPos.x, dogPos.y
    );

    this.nearDog = dogDistance < 60;
    this.dogPrompt.setVisible(this.nearDog && !this.nearNPC);

    if (this.nearDog) {
      this.dogPrompt.x = dogPos.x;
      this.dogPrompt.y = dogPos.y + 40;
    }

    // Check for interact with NPC
    if (this.nearNPC && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.triggerNPCInteraction();
    }

    // Check for interact with dog
    if (this.nearDog && !this.nearNPC && Phaser.Input.Keyboard.JustDown(this.interactKey)) {
      this.dog.bark();
    }

    // Check cats proximity (auto meow)
    this.cats.forEach(cat => {
      if (cat.isNearPlayer(this.player.x, this.player.y)) {
        cat.meow();
      }
    });
  }

  updateAnimals(delta: number) {
    // Update cats
    this.cats.forEach(cat => {
      cat.update(delta);
      cat.clampPosition(50, this.worldWidth - 50, 850, 1700);
    });

    // Update chickens
    this.chickens.forEach(chicken => {
      chicken.update(delta, this.player.x, this.player.y);
      chicken.clampPosition(1850, 2350, 1250, 1550);
    });
  }

  triggerNPCInteraction() {
    // Disable input while modal is open
    this.inputEnabled = false;
    
    // Emit event that React can listen to
    this.game.events.emit('showNPCDialog', 'Luna');
  }

  // Called from React when modal closes
  enableInput() {
    this.inputEnabled = true;
  }

  disableInput() {
    this.inputEnabled = false;
  }
}
