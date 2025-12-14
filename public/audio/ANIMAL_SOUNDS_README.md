# Animal Sound Effects

The village now has interactive animals that need sound effects!

## Required Audio Files

Place these sound effect files in this directory:

### 🐶 bark.mp3
- **Description**: Dog barking sound
- **Usage**: Plays when player presses E near the dog
- **Recommended**: Short, friendly bark (1-2 barks)
- **Volume**: Will play at 30% volume
- **Where to get**: 
  - [Freesound.org](https://freesound.org/search/?q=dog+bark)
  - [Zapsplat.com](https://www.zapsplat.com/sound-effect-category/dogs/)
  - Record your own!

### 🐱 meow.mp3
- **Description**: Cat meowing sound
- **Usage**: Plays when player gets close to wandering cats
- **Recommended**: Soft, cute meow
- **Volume**: Will play at 20% volume
- **Where to get**:
  - [Freesound.org](https://freesound.org/search/?q=cat+meow)
  - [Zapsplat.com](https://www.zapsplat.com/sound-effect-category/cats/)

## How to Add Sounds

1. Download or create the sound files
2. Convert them to MP3 format if needed
3. Rename them to exactly:
   - `bark.mp3`
   - `meow.mp3`
4. Place them in `public/audio/` folder (this directory)
5. Restart your development server

## Notes

- The app will work fine without these files (sounds just won't play)
- Chickens currently don't have sounds (intentional - they just show "Cluck cluck!" bubbles)
- Make sure file names are lowercase
- Keep file sizes small (< 100KB each) for fast loading

## Testing

To test if sounds are working:
1. Make sure "Sound On" toggle in navbar is enabled
2. Go to the village
3. Walk near the dog and press E
4. Walk near any of the cats
5. You should hear the sounds!

Enjoy your cozy village! 🏡✨
