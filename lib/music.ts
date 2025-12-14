const SOUND_KEY = 'nebula-village-sound';

class MusicManagerClass {
  private audio: HTMLAudioElement | null = null;
  private isPlaying = false;
  private currentTrack = 'calm';
  private volume = 0.15;
  private trackList: string[] = [];
  private currentTrackIndex = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    this.audio = new Audio('/audio/calm.mp3');
    this.audio.loop = false; // Changed to false for playlist functionality
    this.audio.volume = this.volume;
    
    // Auto-play next track when current ends
    this.audio.addEventListener('ended', () => {
      this.playNext();
    });
  }

  /**
   * Set a playlist of tracks to shuffle through
   */
  setPlaylist(tracks: string[]): void {
    if (tracks.length === 0) return;
    
    // Shuffle the tracks
    this.trackList = [...tracks].sort(() => Math.random() - 0.5);
    this.currentTrackIndex = 0;
    
    if (this.audio) {
      this.audio.src = `/audio/${this.trackList[0]}`;
      this.audio.load();
    }
  }

  /**
   * Play the next track in the playlist
   */
  private playNext(): void {
    if (this.trackList.length === 0) {
      // If no playlist, just replay current
      if (this.audio) {
        this.audio.currentTime = 0;
        this.audio.play().catch(console.error);
      }
      return;
    }

    this.currentTrackIndex = (this.currentTrackIndex + 1) % this.trackList.length;
    
    if (this.audio) {
      this.audio.src = `/audio/${this.trackList[this.currentTrackIndex]}`;
      this.audio.load();
      if (this.isPlaying) {
        this.audio.play().catch(console.error);
      }
    }
  }

  play(): void {
    if (!this.audio) this.init();
    if (this.audio && !this.isPlaying) {
      this.audio.play().catch((err) => {
        console.log('Audio play failed (user interaction required):', err);
      });
      this.isPlaying = true;
      this.saveState(true);
    }
  }

  pause(): void {
    if (this.audio && this.isPlaying) {
      this.audio.pause();
      this.isPlaying = false;
      this.saveState(false);
    }
  }

  toggle(): boolean {
    if (this.isPlaying) {
      this.pause();
      return false;
    } else {
      this.play();
      return true;
    }
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
  }

  /**
   * Switch to a different track based on mood/stress
   * Tracks: calm.mp3, balanced.mp3, focus.mp3
   */
  async switchTrack(track: 'calm' | 'balanced' | 'focus'): Promise<void> {
    if (track === this.currentTrack) return;
    
    const wasPlaying = this.isPlaying;
    
    // Fade out current track
    if (this.audio && wasPlaying) {
      await this.fadeOut();
    }

    // Switch track
    this.currentTrack = track;
    if (this.audio) {
      this.audio.src = `/audio/${track}.mp3`;
      this.audio.load();
    }

    // Fade in new track if was playing
    if (wasPlaying) {
      await this.fadeIn();
    }
  }

  private fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audio) {
        resolve();
        return;
      }

      const fadeInterval = setInterval(() => {
        if (this.audio && this.audio.volume > 0.01) {
          this.audio.volume = Math.max(0, this.audio.volume - 0.02);
        } else {
          clearInterval(fadeInterval);
          if (this.audio) {
            this.audio.pause();
            this.audio.volume = 0;
          }
          resolve();
        }
      }, 50);
    });
  }

  private fadeIn(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audio) {
        resolve();
        return;
      }

      this.audio.volume = 0;
      this.audio.play().catch(console.error);
      this.isPlaying = true;

      const fadeInterval = setInterval(() => {
        if (this.audio && this.audio.volume < this.volume - 0.02) {
          this.audio.volume = Math.min(this.volume, this.audio.volume + 0.02);
        } else {
          clearInterval(fadeInterval);
          if (this.audio) {
            this.audio.volume = this.volume;
          }
          resolve();
        }
      }, 50);
    });
  }

  private saveState(enabled: boolean): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_KEY, String(enabled));
    }
  }

  isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(SOUND_KEY) === 'true';
  }
}

// Singleton instance
export const MusicManager = new MusicManagerClass();
