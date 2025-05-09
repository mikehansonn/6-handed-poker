import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from "./api";

export default function ChooseBots() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const count = searchParams.get('count') || '1';
  const maxBots = Number(count);
  const cardSuits = ['♠', '♥', '♦', '♣'];
  
  const AVAILABLE_BOTS = [
    { 
      id: 'LooseLauren', 
      style: 'loose', 
      difficulty: 'easy', 
      color: 'from-blue-500 to-blue-600',
      icon: '♠️',
      description: 'Plays many hands with a relaxed approach',
    },
    { 
      id: 'TightTimmy', 
      style: 'tight', 
      difficulty: 'medium', 
      color: 'from-red-500 to-red-600',
      icon: '♦️',
      description: 'Selective and patient player who waits for premium hands',
    },
    { 
      id: 'BalancedBenny', 
      style: 'balanced', 
      difficulty: 'medium', 
      color: 'from-purple-500 to-purple-600',
      icon: '♣️',
      description: 'Adapts play style based on table dynamics',
    },
    { 
      id: 'HyperHenry', 
      style: 'aggressive', 
      difficulty: 'hard', 
      color: 'from-yellow-500 to-yellow-600',
      icon: '♥️',
      description: 'Constantly applies pressure with aggressive betting',
    },
    { 
      id: 'PassivePete', 
      style: 'passive', 
      difficulty: 'easy', 
      color: 'from-green-500 to-green-600',
      icon: '🃏',
      description: 'Rarely initiates betting and prefers to call',
    },
    { 
      id: 'TrickyTravis', 
      style: 'tricky', 
      difficulty: 'hard', 
      color: 'from-pink-500 to-pink-600',
      icon: '🃏',
      description: 'Unpredictable player who uses deception effectively',
    },
    { 
      id: 'MathMindy', 
      style: 'calculated', 
      difficulty: 'hard', 
      color: 'from-cyan-500 to-cyan-600',
      icon: '🃏',
      description: 'Makes decisions based on precise mathematical odds',
    },
    { 
      id: 'ExploitingEve', 
      style: 'exploiting', 
      difficulty: 'hard', 
      color: 'from-orange-500 to-orange-600',
      icon: '🃏',
      description: 'Identifies and targets weaknesses in opponents',
    },
    { 
      id: 'WildcardWally', 
      style: 'unpredictable', 
      difficulty: 'medium', 
      color: 'from-indigo-500 to-indigo-600',
      icon: '🃏',
      description: 'Highly random play style that is hard to read',
    },
    { 
      id: 'ManiacMitch', 
      style: 'maniac', 
      difficulty: 'hard', 
      color: 'from-rose-500 to-rose-600',
      icon: '🃏',
      description: 'Extremely aggressive with constant raising',
    }
  ];
  
  const [selectedBots, setSelectedBots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredBot, setHoveredBot] = useState(null);
  const [filterDifficulty, setFilterDifficulty] = useState('all');
  const [filterStyle, setFilterStyle] = useState('all');
  const [showConfetti, setShowConfetti] = useState(false);
  const [isRandomSelecting, setIsRandomSelecting] = useState(false);
  const [isMysteryMode, setIsMysteryMode] = useState(false);
  const [showMysteryTooltip, setShowMysteryTooltip] = useState(false);
  const [showMysteryEffect, setShowMysteryEffect] = useState(false);

  const filteredBots = AVAILABLE_BOTS.filter(bot => {
    if (filterDifficulty !== 'all' && bot.difficulty !== filterDifficulty) return false;
    if (filterStyle !== 'all' && bot.style !== filterStyle) return false;
    return true;
  });

  const toggleBot = (bot) => {
    if (selectedBots.includes(bot.id)) {
      setSelectedBots(selectedBots.filter((b) => b !== bot.id));
    } else {
      if (selectedBots.length < maxBots) {
        setSelectedBots([...selectedBots, bot.id]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 1000);
      }
    }
  };
  

  const handleRandomSelection = () => {
    if (isRandomSelecting || isLoading) return;
    
    setSelectedBots([]);
    setIsRandomSelecting(true);
    
    const availableBots = [...filteredBots];
    const randomSelection = [];
    
    const shuffledBots = [...availableBots].sort(() => Math.random() - 0.5);
    
    const botsToSelect = Math.min(maxBots, shuffledBots.length);
    
    const selectNextBot = (index) => {
      if (index >= botsToSelect) {
        setIsRandomSelecting(false);
        return;
      }
      
      const selectedBot = shuffledBots[index];
      
      randomSelection.push(selectedBot.id);
      setSelectedBots([...randomSelection]);
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 400);

      setTimeout(() => selectNextBot(index + 1), 500);
    };

    selectNextBot(0);
  };

  const fillTableRandom = () => {
    if (isRandomSelecting || isLoading) return;
    
    const remainingSlots = maxBots - selectedBots.length;
    if (remainingSlots <= 0) return;
    
    setIsRandomSelecting(true);
    
    const availableBots = filteredBots.filter(bot => !selectedBots.includes(bot.id));
    const shuffledBots = [...availableBots].sort(() => Math.random() - 0.5);
    
    const botsToSelect = Math.min(remainingSlots, shuffledBots.length);
    const currentSelection = [...selectedBots];
    
    const selectNextBot = (index) => {
      if (index >= botsToSelect) {
        setIsRandomSelecting(false);
        return;
      }
      
      const selectedBot = shuffledBots[index];
      
      currentSelection.push(selectedBot.id);
      setSelectedBots([...currentSelection]);
      
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 400);
      
      setTimeout(() => selectNextBot(index + 1), 500);
    };
    
    selectNextBot(0);
  };

  const storeWithExpiry = (key, value, ttl) => {
    const item = {
      value: value,
      expiry: new Date().getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item));
  };

  const handleMysteryMode = () => {
    if (isRandomSelecting || isLoading) return;
    
    setShowMysteryEffect(true);
    setIsLoading(true);
    setSelectedBots([]);
    setIsMysteryMode(true);

    const availableBots = [...filteredBots];
    const shuffledBots = [...availableBots].sort(() => Math.random() - 0.5);
    
    const mysterySelection = [];
    const botsToSelect = Math.min(maxBots, shuffledBots.length);

    setShowConfetti(true);
    setTimeout(() => {
      setShowConfetti(false);
      for (let i = 0; i < botsToSelect; i++) {
        mysterySelection.push(shuffledBots[i].id);
      }

      handleCreateGame(mysterySelection);
    }, 1500);
  };

  const handleCreateGame = async (mysteryBots = null) => {
    setIsLoading(true);
    const playerNames = ['HumanUser'];
    const botIds = [null];
    var selected_bots = JSON.parse(localStorage.getItem("bot_selection")) || {};

    const botsToUse = Array.isArray(mysteryBots) ? mysteryBots : selectedBots;
    const isMysteryModeActive = Array.isArray(mysteryBots); 

    botsToUse.forEach((botId) => {
      if (botId in selected_bots) {
        selected_bots[botId] += 1;
      }
      else {
        selected_bots[botId] = 1;
      }
      playerNames.push(botId);
      botIds.push(botId.toLowerCase());
    });

    localStorage.setItem("is_mystery_mode", isMysteryModeActive);

    localStorage.setItem("bot_selection", JSON.stringify(selected_bots));
    var game_sizes = JSON.parse(localStorage.getItem("game_sizes")) || [0, 0, 0, 0, 0];
    game_sizes[playerNames.length - 2] += 1;
    localStorage.setItem("game_sizes", JSON.stringify(game_sizes));
  
    const a_sessions = parseInt(localStorage.getItem("total_sessions_played")) || 0;
    localStorage.setItem("total_sessions_played", a_sessions + 1);
  
    try {
      const response = await api.post("/games/create", { 
        player_names: playerNames, 
        bot_ids: botIds 
      });
      
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      storeWithExpiry('game_id', response.data.game_id, TWENTY_FOUR_HOURS);
      var session_hands = JSON.parse(localStorage.getItem("session_hands_played")) || new Array(10).fill(0);
      var session_wins = JSON.parse(localStorage.getItem("session_hands_won")) || new Array(10).fill(0);
      var session_money = JSON.parse(localStorage.getItem("session_money_won")) || new Array(10).fill(0);
      var session_vpip = JSON.parse(localStorage.getItem("session_vpip")) || new Array(10).fill(0);
      var session_pfr = JSON.parse(localStorage.getItem("session_pfr")) || new Array(10).fill(0);
      if (session_hands.length >= 10) {
        session_hands.pop();
        session_wins.pop();
        session_money.pop();
        session_vpip.pop();
        session_pfr.pop();
      }
      session_hands.unshift(0);
      session_wins.unshift(0);
      session_money.unshift(0);
      session_vpip.unshift(0);
      session_pfr.unshift(0);
      localStorage.setItem("session_hands_played", JSON.stringify(session_hands));
      localStorage.setItem("session_hands_won", JSON.stringify(session_wins));
      localStorage.setItem("session_money_won", JSON.stringify(session_money));
      localStorage.setItem("session_vpip", JSON.stringify(session_vpip));
      localStorage.setItem("session_pfr", JSON.stringify(session_pfr));
      
      navigate('/game-table', { 
        state: { 
          initialGameState: response.data.state,
          isMysteryMode: isMysteryModeActive 
        } 
      });
    } catch (error) {
      console.error("Error creating game:", error);
      setIsLoading(false);
      setIsMysteryMode(false);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch(difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  if (!count) return (
    <div className="flex items-center justify-center min-h-screen bg-gray-950">
      <div className="text-center">
        <div className="w-16 h-16 border-t-4 border-b-4 border-emerald-500 rounded-full animate-spin mx-auto"></div>
        <div className="text-white text-xl mt-4">Loading...</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6 overflow-hidden">
      <div className="fixed inset-0 z-0">
        <div className="absolute -inset-[10%] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent blur-3xl"></div>

        <div className="overflow-hidden h-full w-full absolute z-0">
          {cardSuits.flatMap((suit, suitIndex) => 
            [...Array(5)].map((_, i) => (
              <motion.div 
                key={`${suit}-${i}`}
                initial={{ 
                  left: `${Math.random() * 100}%`, 
                  top: '-50px',
                  rotate: Math.random() * 360,
                  opacity: 0.2 + Math.random() * 0.15
                }}
                animate={{ 
                  top: ['-50px', `${window.innerHeight + 50}px`],
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 15 + Math.random() * 20, 
                  repeat: Infinity, 
                  delay: Math.random() * 20,
                  ease: "linear"
                }}
                className="absolute text-4xl sm:text-5xl pointer-events-none"
                style={{
                  color: suit === '♥' || suit === '♦' ? 'rgba(248, 113, 113, 0.4)' : 'rgba(248, 248, 248, 0.4)'
                }}
              >
                {suit}
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-5xl w-full bg-gray-900/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800 overflow-hidden"
      >
        <div className="text-center relative mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
          />
          
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow"
          >
            Choose Your Opponents
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg sm:text-xl mb-6 text-gray-300 max-w-2xl mx-auto"
          >
            Select up to {count} challenger{maxBots > 1 ? 's' : ''} to face off against at the poker table
          </motion.p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mb-6 flex flex-wrap gap-4 justify-center"
        >
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Difficulty:</span>
            <div className="flex rounded-lg overflow-hidden border border-gray-700 bg-gray-800">
              <button 
                onClick={() => setFilterDifficulty('all')}
                className={`px-3 py-1 text-sm ${filterDifficulty === 'all' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilterDifficulty('easy')}
                className={`px-3 py-1 text-sm ${filterDifficulty === 'easy' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Easy
              </button>
              <button 
                onClick={() => setFilterDifficulty('medium')}
                className={`px-3 py-1 text-sm ${filterDifficulty === 'medium' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Medium
              </button>
              <button 
                onClick={() => setFilterDifficulty('hard')}
                className={`px-3 py-1 text-sm ${filterDifficulty === 'hard' ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
              >
                Hard
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Play Style:</span>
            <select 
              value={filterStyle}
              onChange={(e) => setFilterStyle(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-gray-300 rounded-lg text-sm px-3 py-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            >
              <option value="all">All Styles</option>
              {Array.from(new Set(AVAILABLE_BOTS.map(bot => bot.style))).map(style => (
                <option key={style} value={style}>
                  {style.charAt(0).toUpperCase() + style.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <motion.button
              onClick={handleRandomSelection}
              disabled={isRandomSelecting || isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                px-4 py-1 text-sm rounded-lg flex items-center gap-2
                ${isRandomSelecting ? 'bg-purple-700 text-white cursor-wait' : 'bg-purple-600 hover:bg-purple-500 text-white'}
                transition-colors duration-200 border border-purple-500
              `}
            >
              {isRandomSelecting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Selecting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  Random
                </>
              )}
            </motion.button>
            
            {selectedBots.length > 0 && selectedBots.length < maxBots && (
              <motion.button
                onClick={fillTableRandom}
                disabled={isRandomSelecting || isLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-4 py-1 text-sm rounded-lg flex items-center gap-2
                  ${isRandomSelecting ? 'bg-purple-700/70 text-white cursor-wait' : 'bg-purple-600/70 hover:bg-purple-500/70 text-white'}
                  transition-colors duration-200 border border-purple-500/70
                `}
              >
                {isRandomSelecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Filling...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      <path fillRule="evenodd" d="M10 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Fill Table
                  </>
                )}
              </motion.button>
            )}
            
            <motion.button
              onClick={handleMysteryMode}
              disabled={isLoading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onMouseEnter={() => setShowMysteryTooltip(true)}
              onMouseLeave={() => setShowMysteryTooltip(false)}
              className={`
                relative px-4 py-1 text-sm rounded-lg flex items-center gap-2
                ${isMysteryMode || isLoading ? 'bg-pink-700 text-white cursor-wait' : 'bg-pink-600 hover:bg-pink-500 text-white'}
                transition-colors duration-200 border border-pink-500
              `}
            >
              {isMysteryMode || isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Preparing Mystery...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Mystery Mode
                </>
              )}
              
              <AnimatePresence>
                {showMysteryTooltip && !isMysteryMode && !isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full left-[-25%] transform -translate-x-[-25%] mb-2 w-64 bg-gray-900 text-white p-3 rounded-lg shadow-xl z-50 text-xs"
                  >
                    <div className="relative">
                      <div className="font-semibold mb-1">Mystery Mode</div>
                      <p>Face random opponents without knowing who they are!</p>
                      <div className="absolute -bottom-6 left-[45%] transform -translate-x-[45%] w-3 h-3 bg-gray-900 rotate-45"></div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-8"
        >
          <AnimatePresence>
            {filteredBots.map((bot, index) => {
              const isSelected = selectedBots.includes(bot.id);
              const isHovered = hoveredBot === bot.id;
              
              return (
                <motion.div
                  key={bot.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: 0.05 * index, duration: 0.3 }}
                  onHoverStart={() => setHoveredBot(bot.id)}
                  onHoverEnd={() => setHoveredBot(null)}
                  onClick={() => toggleBot(bot)}
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative overflow-hidden rounded-2xl shadow-xl cursor-pointer 
                    transition-all duration-300 transform
                    ${isSelected 
                      ? `bg-gradient-to-br ${bot.color} border-2 border-white` 
                      : 'bg-gray-800/80 border border-gray-700/50 hover:border-gray-600'}
                  `}
                >
                  <div className="p-4 h-full flex flex-col items-center justify-between min-h-32">
                    <div className="absolute top-0 right-0 left-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent opacity-50"></div>
                    
                    <div className={`text-3xl mb-1 ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {bot.icon}
                    </div>
                    
                    <div className="text-center">
                      <div className={`font-bold text-sm sm:text-base transition-colors ${isSelected ? 'text-white' : 'text-gray-200'}`}>
                        {bot.id}
                      </div>
                      
                      <div className="mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getDifficultyBadge(bot.difficulty)}`}>
                          {bot.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-lg"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </motion.div>
                  )}

                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute inset-0 bg-black/90 flex items-center justify-center p-3 text-xs text-center"
                      >
                        <div className="flex flex-col gap-1 items-center">
                          <span className="font-semibold text-xs uppercase tracking-wider text-gray-400">
                            {bot.style} style
                          </span>
                          <span className="text-white text-xs">
                            {bot.description}
                          </span>
                          {!isSelected && selectedBots.length < maxBots && (
                            <span className="mt-1 text-xs text-emerald-400">
                              Click to select
                            </span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-8 border border-gray-700/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
          
          <div className="relative">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span className="bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                {isMysteryMode ? "Mystery Challengers" : "Selected Challengers"}
              </span>
              {!isMysteryMode && (
                <span className="text-sm bg-gray-700 px-2 py-0.5 rounded-full text-gray-300">
                  {selectedBots.length}/{maxBots}
                </span>
              )}
            </h2>

            {!isMysteryMode && (
              <div className="mb-4 w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${(selectedBots.length / maxBots) * 100}%` }}
                ></div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-center mb-4">
              {isMysteryMode ? (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl p-4 w-full text-center"
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span className="font-bold">Mystery Mode Active</span>
                  </div>
                  <p className="text-sm text-white/90">
                    Your opponents have been randomly selected and will remain hidden!
                  </p>
                </motion.div>
              ) : (
                selectedBots.length > 0 ? (
                  selectedBots.map((botId) => {
                    const bot = AVAILABLE_BOTS.find(b => b.id === botId);
                    return (
                      <motion.div 
                        key={botId} 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className={`bg-gradient-to-r ${bot.color} rounded-full pl-3 pr-2 py-1.5 text-sm font-medium text-white flex items-center shadow-lg`}
                      >
                        <span className="mr-1">{bot.icon}</span>
                        {botId}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedBots(selectedBots.filter(b => b !== botId));
                          }}
                          className="ml-2 rounded-full bg-white/20 hover:bg-white/40 p-1 transition-colors"
                          aria-label={`Remove ${botId}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-gray-400 italic py-4">No opponents selected yet</div>
                )
              )}
            </div>

            {(selectedBots.length > 0 || isMysteryMode) && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2 text-center"
              >
                {!isMysteryMode && (
                  <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Difficulty Mix</div>
                    <div className="flex justify-center gap-1">
                      {['easy', 'medium', 'hard'].map(diff => {
                        const count = selectedBots.filter(
                          botId => AVAILABLE_BOTS.find(b => b.id === botId)?.difficulty === diff
                        ).length;
                        const color = diff === 'easy' ? 'bg-green-500' : 
                                      diff === 'medium' ? 'bg-yellow-500' : 'bg-red-500';
                        return count > 0 ? (
                          <div key={diff} className="flex items-center">
                            <div className={`w-3 h-3 ${color} rounded-full mr-1`}></div>
                            <span className="text-xs text-gray-300">{count}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
                
                {isMysteryMode && (
                  <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                    <div className="text-xs text-gray-400 mb-1">Difficulty Mix</div>
                    <div className="text-sm text-white">
                      <span className="text-pink-400">? ? ?</span>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Table Size</div>
                  <div className="text-sm text-white">
                    {isMysteryMode ? `${maxBots + 1} Players` : `${selectedBots.length + 1} Players`}
                  </div>
                </div>
                
                <div className="bg-gray-900/50 rounded-xl p-3 border border-gray-800">
                  <div className="text-xs text-gray-400 mb-1">Game Type</div>
                  <div className="text-sm text-white">
                    No Limit Hold'em
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex justify-center relative"
        >
          <motion.button 
            onClick={handleCreateGame}
            disabled={selectedBots.length === 0 || isLoading}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative px-10 py-4 text-xl font-bold rounded-xl shadow-xl overflow-hidden
              w-full sm:w-auto min-w-48
              ${selectedBots.length > 0 && !isLoading
                ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white cursor-pointer'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'}
            `}
          >
            {isLoading ? (
              <>
                <span className="opacity-0">Dealing Cards...</span>
                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </>
            ) : (
              <>
                {selectedBots.length > 0 && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse"></div>
                )}
                <div className="relative flex items-center justify-center gap-2">
                  <span>To the Table</span>
                  {selectedBots.length > 0 && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </>
            )}
          </motion.button>

          {showConfetti && (
            <motion.div 
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute -inset-10 pointer-events-none"
            >
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ 
                    x: '50%', 
                    y: '50%',
                    scale: 0
                  }}
                  animate={{ 
                    x: `${Math.random() * 100}%`,
                    y: `${Math.random() * 100}%`,
                    scale: Math.random() * 0.5 + 0.5,
                    rotate: Math.random() * 360
                  }}
                  transition={{ 
                    duration: 0.8,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ['#10B981', '#0EA5E9', '#6366F1', '#F43F5E', '#F59E0B'][Math.floor(Math.random() * 5)]
                  }}
                />
              ))}
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {showMysteryEffect && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/100 z-50 flex items-center justify-center"
        >
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-center"
          >
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="text-6xl mb-4 inline-block"
            >
              🎭
            </motion.div>
            
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold text-white mb-2"
            >
              Mystery Mode Activated!
            </motion.h2>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="text-emerald-400 text-xl mb-8"
            >
              Preparing your mysterious opponents...
            </motion.div>
            
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity,
                repeatType: "loop" 
              }}
              className="relative"
            >
              <div className="w-16 h-16 rounded-full border-4 border-t-transparent border-emerald-500 animate-spin mx-auto"></div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}

    </div>
  );
}