import { useEffect, useRef, useState } from 'react';

const SoundManager = () => {
  const foldSound = useRef(null);
  const betSound = useRef(null);
  const checkSound = useRef(null);
  const winSound = useRef(null);
  const dealSound = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Create audio elements
    foldSound.current = new Audio('/sounds/fold.wav');
    betSound.current = new Audio('/sounds/chips.wav');
    checkSound.current = new Audio('/sounds/check.wav');
    winSound.current = new Audio('/sounds/end.mp3');
    dealSound.current = new Audio('/sounds/deal.wav');
    
    // Set volume levels
    foldSound.current.volume = 0.9;
    betSound.current.volume = 0.7;
    checkSound.current.volume = 0.9;
    winSound.current.volume = 0.3;
    dealSound.current.volume = 0.9;
    
    // Track loading state
    const sounds = [
      foldSound.current, 
      betSound.current, 
      checkSound.current, 
      winSound.current, 
      dealSound.current
    ];
    
    // Count loaded sounds
    let loadedCount = 0;
    const onLoadedData = () => {
      loadedCount++;
      if (loadedCount === sounds.length) {
        setIsLoaded(true);
      }
    };
    
    // Add event listeners for load tracking
    sounds.forEach(sound => {
      sound.addEventListener('loadeddata', onLoadedData);
    });
    
    // Preload sounds
    sounds.forEach(sound => {
      sound.load();
    });
    
    // Cleanup function
    return () => {
      sounds.forEach(sound => {
        sound.removeEventListener('loadeddata', onLoadedData);
        sound.pause();
      });
    };
  }, []);
  
  // Safe play function that checks if audio is ready
  const safePlay = (soundRef) => {
    if (soundRef.current && isLoaded) {
      // Reset to beginning
      soundRef.current.currentTime = 0;
      
      // Create a promise to catch and handle play() errors
      const playPromise = soundRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Error playing sound:', error);
        });
      }
    }
  };
  
  // Methods to play each sound
  const playFoldSound = () => safePlay(foldSound);
  const playBetSound = () => safePlay(betSound);
  const playCheckSound = () => safePlay(checkSound);
  const playWinSound = () => safePlay(winSound);
  const playDealSound = () => safePlay(dealSound);
  
  return {
    playFoldSound,
    playBetSound,
    playCheckSound,
    playWinSound,
    playDealSound,
    isLoaded
  };
};

export default SoundManager;