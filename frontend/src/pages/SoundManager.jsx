// Create a new file called SoundManager.js

import { useEffect, useRef } from 'react';

const SoundManager = () => {
  const foldSound = useRef(null);
  const betSound = useRef(null);
  const checkSound = useRef(null);
  const winSound = useRef(null);
  const dealSound = useRef(null);
  
  useEffect(() => {
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
    
    // Preload sounds
    void foldSound.current.load();
    void betSound.current.load();
    void checkSound.current.load();
    void winSound.current.load();
    void dealSound.current.load();
    
  }, []);
  
  // Methods to play each sound
  const playFoldSound = () => {
    foldSound.current?.currentTime && (foldSound.current.currentTime = 0);
    void foldSound.current?.play();
  };
  
  const playBetSound = () => {
    betSound.current?.currentTime && (betSound.current.currentTime = 0);
    void betSound.current?.play();
  };
  
  const playCheckSound = () => {
    checkSound.current?.currentTime && (checkSound.current.currentTime = 0);
    void checkSound.current?.play();
  };
  
  const playWinSound = () => {
    winSound.current?.currentTime && (winSound.current.currentTime = 0);
    void winSound.current?.play();
  };
  
  const playDealSound = () => {
    dealSound.current?.currentTime && (dealSound.current.currentTime = 0);
    void dealSound.current?.play();
  };
  
  return {
    playFoldSound,
    playBetSound,
    playCheckSound,
    playWinSound,
    playDealSound,
  };
};

export default SoundManager;