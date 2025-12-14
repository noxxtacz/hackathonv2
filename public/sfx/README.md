# Sound Effects for Cozy Games

The CozyGameKit now includes subtle sound effects! Place these audio files in this directory.

## Required Sound Files

### 🎵 click.mp3
- **Description**: Soft click sound for UI interactions
- **Usage**: Menu clicks, button presses
- **Recommended**: Very short (< 0.1s), soft click or tap
- **Volume**: 20% (low and unobtrusive)
- **Where to get**:
  - [Freesound.org](https://freesound.org/search/?q=soft+click)
  - [Zapsplat.com](https://www.zapsplat.com/sound-effect-category/clicks/)

### ✨ success.mp3
- **Description**: Pleasant success sound for positive feedback
- **Usage**: Catching fireflies, completing actions, achievements
- **Recommended**: Soft chime or sparkle (0.3-0.5s)
- **Volume**: 25-30%
- **Where to get**:
  - [Freesound.org](https://freesound.org/search/?q=success+chime)
  - [Zapsplat.com](https://www.zapsplat.com/sound-effect-category/success/)

### 🌫️ softfail.mp3
- **Description**: Gentle "oops" sound for minor failures
- **Usage**: Missing a catch, gentle errors (non-harsh feedback)
- **Recommended**: Soft "poof" or gentle wind (0.2-0.4s)
- **Volume**: 20%
- **Where to get**:
  - [Freesound.org](https://freesound.org/search/?q=soft+whoosh)
  - [Zapsplat.com](https://www.zapsplat.com/sound-effect-category/whooshes/)

## Audio File Guidelines

### Technical Requirements
- **Format**: MP3 (widely supported)
- **Bitrate**: 128kbps or higher
- **Sample Rate**: 44.1kHz recommended
- **File Size**: Keep under 50KB each for fast loading
- **Duration**: Very short (0.1s - 0.5s)

### Design Principles
- **Cozy & Calm**: Choose sounds that feel warm and inviting
- **Non-Intrusive**: Sounds should complement, not distract
- **Consistent Tone**: All sounds should feel part of the same "family"
- **Low Volume**: Game code automatically plays at reduced volume

### Sound Personality
Think: **Alto's Adventure** or **Stardew Valley**
- Gentle chimes and bells
- Soft organic sounds
- Nature-inspired tones
- Warm, analog feel (not harsh digital)

## How to Add Sounds

1. Download or create the sound files
2. Convert to MP3 format if needed
3. Rename them exactly:
   - `click.mp3`
   - `success.mp3`
   - `softfail.mp3`
4. Place in `public/sfx/` folder (this directory)
5. Sounds will automatically load when games start

## Testing

To verify sounds are working:
1. Make sure "Sound On" is enabled in navbar
2. Play the Firefly Garden mini-game
3. Click a firefly → should hear `success.mp3`
4. Miss a firefly (let time run out) → should hear `softfail.mp3`

## Graceful Fallback

The app works perfectly without sound files:
- Missing sounds are caught and logged to console
- No errors or crashes
- Game continues normally with visual-only feedback

## Volume Levels in Code

The CozyAudio system plays sounds at these volumes:
- `click`: 20%
- `success`: 25-30%
- `softfail`: 20%

These low volumes ensure sounds never overwhelm the peaceful atmosphere.

## Future Sounds (Optional)

If you want to add more variety:
- `collect.mp3` - for picking up items
- `whoosh.mp3` - for movement/transitions
- `ambient.mp3` - background nature sounds

Just add them to this folder and use `CozyAudio.playCustom(scene, 'filename', volume)`.

Enjoy your cozy soundscape! 🎵✨
