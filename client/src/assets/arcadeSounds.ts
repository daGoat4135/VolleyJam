import { Howl } from 'howler';

type SoundNames = 'select' | 'score' | 'win' | 'gameStart' | 'error';

// Sound collection
const sounds: Record<SoundNames, Howl | null> = {
  select: null,
  score: null,
  win: null,
  gameStart: null,
  error: null
};

// Initialize all sounds
export async function initSounds(): Promise<void> {
  sounds.select = new Howl({
    src: ['https://assets.codepen.io/21542/select-1.mp3'],
    volume: 0.5,
    preload: true
  });

  sounds.score = new Howl({
    src: ['https://assets.codepen.io/21542/score.mp3'],
    volume: 0.5,
    preload: true
  });

  sounds.win = new Howl({
    src: ['https://assets.codepen.io/21542/win.mp3'],
    volume: 0.7,
    preload: true
  });

  sounds.gameStart = new Howl({
    src: ['https://assets.codepen.io/21542/gamestart.mp3'],
    volume: 0.6,
    preload: true
  });

  sounds.error = new Howl({
    src: ['https://assets.codepen.io/21542/error.mp3'],
    volume: 0.4,
    preload: true
  });

  // Return a promise that resolves when all sounds are loaded
  return new Promise((resolve) => {
    let loadedCount = 0;
    const totalSounds = Object.keys(sounds).length;

    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount >= totalSounds) {
        resolve();
      }
    };

    // Setup load events for each sound
    Object.values(sounds).forEach((sound) => {
      if (sound) {
        if (sound.state() === 'loaded') {
          checkAllLoaded();
        } else {
          sound.once('load', checkAllLoaded);
        }
      }
    });
  });
}

// Play a sound by name
export function playSound(name: SoundNames): void {
  const sound = sounds[name];
  if (sound) {
    sound.play();
  }
}
