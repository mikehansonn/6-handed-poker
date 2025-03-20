import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import api from './api';
import ActionButtons from './ActionButtons';
import PlayingCard from './PlayingCard';

const GameTable = () => {
  const navigate = useNavigate();
  const [botComment, setBotComment] = useState({});
  const [gameState, setGameState] = useState(() => {
    const state = window.history.state?.usr?.initialGameState;
    return state || null;
  });
  
  const [checkStarted, setCheckStarted] = useState(false);
  const [error, setError] = useState(null);
  const [betAmount, setBetAmount] = useState('');
  const [showBetInput, setShowBetInput] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [gameStats, setGameStats] = useState({
    startingChips: 200, // Default starting value from game.py
    handsPlayed: 0,
    handsWon: 0,
    bestHand: null
  });

  // Track game statistics
  useEffect(() => {
    if (gameState) {
      // Update handsPlayed count when a new hand starts
      if (gameState.community_cards && gameState.community_cards.length === 0) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsPlayed: prevStats.handsPlayed + 1
        }));
      }
      
      // Track the human player's chips
      const humanPlayer = gameState.players.find(p => !p.is_bot);
      if (humanPlayer) {
        setGameStats(prevStats => ({
          ...prevStats,
          finalChips: humanPlayer.chips
        }));
      }
    }
  }, [gameState]);

  // State to track game end conditions
  const [gameEndState, setGameEndState] = useState(null);
  const [handComplete, setHandComplete] = useState(false);

  // Check for game end conditions ONLY after a hand is complete
  useEffect(() => {
    // Only check when a hand has completed and we're not already in a game end state
    if (handComplete && gameState && !gameEndState) {
      const humanPlayer = gameState.players.find(p => !p.is_bot);
      
      // Check if human player has lost (out of chips after hand distribution)
      if (humanPlayer && humanPlayer.chips <= 0) {
        setGameEndState('lost');
        return;
      }
      
      // Check if human player is the only one left with chips
      const playersWithChips = gameState.players.filter(p => p.chips > 0);
      if (playersWithChips.length === 1 && !playersWithChips[0].is_bot) {
        setGameEndState('won');
        return;
      }
      
      // Reset handComplete flag if no end condition was met
      setHandComplete(false);
    }
  }, [handComplete, gameState, gameEndState]);
  
  // Handle redirect after delay when game end is detected
  useEffect(() => {
    if (gameEndState) {
      // Set a timer to navigate after 5 seconds
      const timer = setTimeout(() => {
        if (gameEndState === 'lost') {
          navigate('/game-lost', { 
            state: { gameStats: gameStats }
          });
        } else if (gameEndState === 'won') {
          navigate('/game-won', { 
            state: { gameStats: gameStats }
          });
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [gameEndState, navigate, gameStats]);

  // Existing game logic remains the same...
  useEffect(() => {
    const state = window.history.state?.usr?.initialGameState;
    if (state && !gameState) {
      setGameState(state);
    }
  }, [gameState]);

  useEffect(() => {
    let timer;
    if (winner && !gameEndState) {
      timer = setTimeout(() => {
        setWinner(null);
        handleStartGame();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [winner, gameEndState]);

  const updateGameState = (newGameState) => {
    // Update the local state
    setGameState(newGameState);
    
    // Store in history.state for persistence
    const currentState = window.history.state || {};
    const usr = currentState.usr || {};
    
    window.history.replaceState(
      { 
        ...currentState, 
        usr: { 
          ...usr, 
          gameState: newGameState 
        } 
      }, 
      ""
    );
    
    // Dispatch a custom event to notify components like Recommendation
    window.dispatchEvent(new CustomEvent('gameStateUpdated'));
  };

  // All existing handler functions remain the same...
  const processBotActions = async () => {
    const gameId = JSON.parse(localStorage.getItem("game_id")).value;
    try {
      while (true) {
        const botResponse = await api.post("/games/bot-action", {game_id: gameId});
        const data = await botResponse.data;
        
        // Set comment only if bot made a move
        if (data.table_comment) {
          setBotComment({
            text: data.table_comment,
            playerName: data.game_state.players[data.comment_index].name
          });

          // Wait 3 seconds before updating the game state
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Remove comment just before updating game state
          setBotComment(null);
        }
        
        // set game state after comment is complete
        updateGameState(data.game_state);

        if (data.status === "hand_complete") {
          console.log(data.game_state);
          handleHandComplete(data.game_state);
          break;
        }
        if (!data.game_state.players[data.game_state.current_player_idx].is_bot) {
          break;
        }
      }
    } catch (err) {
      console.error("Error processing bot actions:", err);
      setError("Failed to process bot actions");
    }
  };

  const handleHandComplete = (finalGameState) => {
    const nonFoldedPlayers = finalGameState.players.filter(p => p.status !== 'folded');
    
    // Check if the human player won this hand
    const humanPlayer = finalGameState.players.find(p => !p.is_bot);
    const humanPlayerIndex = finalGameState.players.findIndex(p => !p.is_bot);
    
    // Calculate the winner but don't display immediately
    let winningPlayer;
    
    if (nonFoldedPlayers.length === 1) {
      winningPlayer = nonFoldedPlayers[0];
      
      // Update hand win stats if human player won
      if (nonFoldedPlayers[0] === humanPlayer) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsWon: prevStats.handsWon + 1
        }));
      }
    } else {
      winningPlayer = finalGameState.players.reduce((prev, current) => 
        (current.chips > prev.chips) ? current : prev
      );
      
      // Check if human player gained chips (won the hand)
      if (humanPlayer && humanPlayer.chips > gameStats.finalChips) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsWon: prevStats.handsWon + 1
        }));
      }
    }
    
    // Wait 3 seconds before showing the winner
    setTimeout(() => {
      setWinner(winningPlayer);
    }, 3000);
    
    // Set handComplete flag to trigger game end check
    setHandComplete(true);
  };

  const handleStartGame = async () => {
    try {
      const gameId = JSON.parse(localStorage.getItem("game_id")).value;
      const response = await api.post("/games/start-hand", {game_id: gameId});
      const data = await response.data;
      updateGameState(data.game_state);
      setCheckStarted(true);

      if (data.game_state.players[data.game_state.current_player_idx].is_bot) {
        await processBotActions();
      }
    } catch (err) {
      console.error("Error starting game:", err);
      setError("Failed to start game");
    }
  };

  const handleActionClick = (action) => {
    setSelectedAction(action);
    setShowBetInput(action === 'bet' || action === 'raise');
    if (action !== 'bet' && action !== 'raise') {
      handlePlayerAction(action);
    }
  };

  const handleBetSubmit = () => {
    if (!betAmount || isNaN(betAmount) || parseInt(betAmount) <= 0) {
      setError('Please enter a valid bet amount');
      return;
    }
    handlePlayerAction(selectedAction, parseInt(betAmount));
    setBetAmount('');
    setShowBetInput(false);
    setSelectedAction(null);
  };

  const handlePlayerAction = async (action, amount = null) => {
    try {
      const gameId = JSON.parse(localStorage.getItem("game_id")).value;
      const response = await api.post("/games/player-action", {
        game_id: gameId,
        action: action,
        amount: amount
      });
      const data = await response.data;
      updateGameState(data.game_state);

      // Reset comment since humans don't make comments
      setBotComment(null);

      if (data.status === "hand_complete") {
        console.log(data.game_state);
        handleHandComplete(data.game_state);
      } else if (data.game_state.players[data.game_state.current_player_idx].is_bot) {
        await processBotActions();
      }
    } catch (err) {
      console.error("Error processing player action:", err);
      setError("Failed to process player action");
    }
  };

  function renderChipStack(amount) {
    // Define chip values and colors
    const chipValues = [
      { value: 200, color: "from-black to-slate-800", border: "border-slate-600" },
      { value: 100, color: "from-purple-700 to-purple-900", border: "border-purple-400" },
      { value: 50, color: "from-black to-slate-900", border: "border-slate-400" },
      { value: 25, color: "from-green-600 to-green-800", border: "border-green-400" },
      { value: 5, color: "from-red-600 to-red-800", border: "border-red-400" },
      { value: 1, color: "from-blue-600 to-blue-800", border: "border-blue-400" }
    ];
    
    // Calculate how many of each chip to show
    let remainingAmount = amount;
    let chipCounts = {};
    
    chipValues.forEach(chip => {
      const count = Math.floor(remainingAmount / chip.value);
      if (count > 0) {
        chipCounts[chip.value] = Math.min(count, 5); // Cap at 5 chips per denomination
        remainingAmount -= chip.value * chipCounts[chip.value];
      }
    });
    
    // Generate chip elements
    let chips = [];
    let offset = 0;
    
    // Display at most 12 chips total for performance
    let totalChips = 0;
    
    Object.entries(chipCounts).forEach(([value, count]) => {
      const chipInfo = chipValues.find(c => c.value === parseInt(value));
      
      for (let i = 0; i < count && totalChips < 12; i++) {
        // Calculate the chip display size based on its value
        const sizeClass = parseInt(value) >= 100 ? "w-12 h-12" : "w-10 h-10";
        
        chips.push(
          <motion.div 
            key={`chip-${value}-${i}`}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: -offset, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`${sizeClass} rounded-full bg-gradient-to-b ${chipInfo.color} absolute border-2 ${chipInfo.border} shadow-lg flex items-center justify-center`}
            style={{ zIndex: 100 - totalChips }}
          >
            <div className={`${parseInt(value) >= 100 ? "w-8 h-8" : "w-6 h-6"} rounded-full border border-white/20 flex items-center justify-center text-white text-xs font-bold`}>
              {parseInt(value)}
            </div>
          </motion.div>
        );
        
        offset += 4; // Stack height offset
        totalChips++;
      }
    });
    
    if (chips.length === 0) {
      chips.push(
        <motion.div 
          key="chip-min"
          className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-600 to-gray-800 border-2 border-gray-400 shadow-lg flex items-center justify-center"
        >
          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-white text-xs font-bold">
            ${amount}
          </div>
        </motion.div>
      );
    }
    
    return (
      <div className="relative" style={{ height: `${Math.max(40, offset + 20)}px`, width: "48px" }}>
        {chips}
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-emerald-500 rounded-full animate-spin mx-auto"></div>
          <div className="text-white text-xl mt-4">Loading game state...</div>
          <div className="text-sm text-gray-400 mt-2">
            If this persists, please return to the bot selection screen.
          </div>
        </div>
      </div>
    );
  }

  const players = gameState.players;
  const numPlayers = players.length;
  const tableWidth = 800; // Return to original fixed width
  const tableHeight = 500; // Return to original fixed height
  const centerX = tableWidth / 2;
  const centerY = tableHeight / 2;

  const playerPositions = players.map((player, index) => {
    const totalPositions = numPlayers;
    const angle = -Math.PI/2 + (index / totalPositions) * 2 * Math.PI;
    
    const ellipseA = tableWidth * 0.53; // Horizontal radius
    const ellipseB = tableHeight * 0.53; // Vertical radius
    
    const x = centerX + ellipseA * Math.cos(angle);
    const y = centerY + ellipseB * Math.sin(angle);
    
    const betScale = 0.5; // Place bets 60% of the way between center and player
    const betX = centerX - 24 + (ellipseA * betScale) * Math.cos(angle);
    const betY = centerY - 10 + (ellipseB * betScale) * Math.sin(angle);
    
    // Adjust player card position to center the 120x120 card
    return { 
      x: x - 70, // Half of card width (120/2)
      y: y - 70, // Half of card height (120/2)
      betX,
      betY,
      player, 
      isButton: index === gameState.button_position,
      angle
    };
  });

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 flex flex-col pt-16">
      {/* Game Table */}
      <div className="flex justify-center items-center mt-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="relative w-[800px] h-[500px]"
        >
          <div className="absolute inset-0 stadium bg-emerald-500/20 blur-xl"></div>
          
          <div className="relative flex items-center justify-center w-full h-full stadium bg-gradient-to-br from-emerald-800 to-emerald-900 shadow-2xl border-8 border-amber-950/80">
            <div className="absolute inset-8 stadium bg-emerald-700 shadow-inner"></div>
            
            <style jsx>{`
              .stadium {
                border-radius: 250px;
              }
            `}</style>

            {winner && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-[35%] -translate-y-1/2 z-50 bg-black/90 p-8 rounded-xl backdrop-blur-sm shadow-2xl border border-yellow-500/30"
              >
                <div className="text-4xl font-bold text-yellow-400 text-center mb-3 animate-pulse">
                  Winner!
                </div>
                <div className="text-2xl text-white text-center font-semibold">
                  {winner.name}
                </div>
              </motion.div>
            )}
            
            {gameEndState && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 p-8 rounded-xl backdrop-blur-sm shadow-2xl border border-yellow-500/30"
              >
                <div className={`text-4xl font-bold ${gameEndState === 'won' ? 'text-yellow-400' : 'text-red-500'} text-center mb-3 animate-pulse`}>
                  {gameEndState === 'won' ? 'You Won The Game!' : 'Game Over!'}
                </div>
                <div className="text-2xl text-white text-center font-semibold mb-4">
                  {gameEndState === 'won' ? 'You\'re the last player with chips!' : 'You\'ve run out of chips!'}
                </div>
                <div className="text-lg text-gray-300 text-center">
                  Redirecting in 5 seconds...
                </div>
              </motion.div>
            )}

            {gameState.community_cards && gameState.community_cards.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="absolute top-[46%] -translate-y-1/2 flex gap-2 p-2 rounded-xl"
              >
                {gameState.community_cards.map((card, index) => (
                  <PlayingCard 
                    card={card}
                  />
                ))}
              </motion.div>
            )}

            {/* Pot and current bet display */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute top-[35%] flex flex-col items-center"
            >
              <div className="flex items-center gap-4">
                {/* Pot amount text display */}
                <div className="bg-black/50 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-slate-700">
                  <div className="flex items-center gap-2">
                    <div className="text-white text-2xl font-bold text-center">
                      <span className="text-slate-400 text-xl mr-1">$</span>
                      <span>{gameState.total_pot || 0}</span>
                    </div>
                    <div className="text-yellow-500 text-lg font-medium">Pot</div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Player positions */}
            {playerPositions.map(({ x, y, betX, betY, player, isButton }, index) => (
              <div key={index}>
                {/* Bot comment bubble */}
                <AnimatePresence>
                  {botComment && botComment.playerName === player.name && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="absolute w-48 z-50 px-4 py-2 bg-gray-900/90 text-white text-sm rounded-xl shadow-md border border-gray-700"
                      style={{
                        left: x + 70,
                        top: y - 60,
                      }}
                    >
                      <div className="relative">
                        {botComment.text}
                        <div className="absolute w-4 h-4 bg-gray-900/90 border-b border-r border-gray-700 transform rotate-45 -bottom-4 left-4"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bet amount indicator */}
                <AnimatePresence>
                  {player.current_street_contribution > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ 
                        left: betX,
                        top: betY
                      }}
                    >
                      <div className="relative flex flex-col items-center">
                        {/* Chip stack visualization based on bet amount */}
                        <div className="relative flex flex-col items-center">
                          {/* Render different chip stacks based on bet amount */}
                          {renderChipStack(player.current_street_contribution)}
                          
                          {/* Bet amount label */}
                          <div className="absolute -right-6 top-1/2 transform -translate-y-1/2 bg-black/80 text-white px-2 py-1 rounded-md text-sm font-bold whitespace-nowrap">
                            ${player.current_street_contribution}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Player card */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                  className="absolute" 
                  style={{ left: x, top: y }}
                >
                  <motion.div 
                    animate={{
                      scale: gameState.current_player_idx === index ? 1.1 : 1,
                      boxShadow: gameState.current_player_idx === index ? 
                        "0 0 20px 5px rgba(250, 204, 21, 0.4)" : "0 0 0 rgba(0, 0, 0, 0)"
                    }}
                    transition={{ duration: 0.3 }}
                    className={`w-[140px] h-[140px] rounded-xl backdrop-blur-sm shadow-xl transition-all duration-300 transform
                      ${gameState.current_player_idx === index ? 
                        'ring-4 ring-yellow-400 bg-gradient-to-br from-gray-800 to-gray-900 border-2 border-yellow-500/50' : 
                        'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700 hover:border-gray-500'}
                      ${player.status === 'folded' ? 'opacity-50' : ''}`}
                  >
                    <div className="p-3 text-center">
                      <div className={`font-bold text-lg mb-1 ${!player.is_bot ? 'text-cyan-400' : 'text-white'}`}>
                        {player.name}
                      </div>
                      <div className="text-emerald-500 font-semibold text-lg">${player.chips}</div>
                      
                      {/* Player cards */}
                      {player.pocket_cards && player.pocket_cards.length > 0 && (
                        <div className="flex justify-center gap-1 mt-2">
                          {player.pocket_cards.map((card, i) => (
                            <PlayingCard 
                              card={card}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                  
                  {/* Dealer button */}
                  {isButton && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.5, duration: 0.3, type: "spring" }}
                      className="absolute w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 -right-2 top-[35%]"
                    >
                      <span className="font-bold text-white text-lg">D</span>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
      
      {/* Action buttons */}
      <div className="mt-6 w-[800px]">
        <ActionButtons 
          gameState={gameState} 
          handleActionClick={handleActionClick} 
          betAmount={betAmount} 
          setBetAmount={setBetAmount} 
          handlePlayerAction={handlePlayerAction} 
        />
      </div>
      
      {/* Start game button overlay */}
      <AnimatePresence>
        {!checkStarted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartGame}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className="relative px-10 py-4 text-xl font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse"></div>
              <div className="relative flex items-center justify-center gap-2">
                <span>Deal Cards</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
              
              {/* Button hover effect */}
              <AnimatePresence>
                {isHovering && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10"
                  />
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameTable;