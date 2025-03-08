// src/pages/GameTable.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import api from './api';
import ActionButtons from './ActionButtons';

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
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Remove comment just before updating game state
          setBotComment(null);
        }
        
        // set game state after comment is complete
        setGameState(data.game_state);

        if (data.status === "hand_complete") {
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
    
    if (nonFoldedPlayers.length === 1) {
      setWinner(nonFoldedPlayers[0]);
      
      // Update hand win stats if human player won
      if (nonFoldedPlayers[0] === humanPlayer) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsWon: prevStats.handsWon + 1
        }));
      }
    } else {
      const winningPlayer = finalGameState.players.reduce((prev, current) => 
        (current.chips > prev.chips) ? current : prev
      );
      setWinner(winningPlayer);
      
      // Check if human player gained chips (won the hand)
      if (humanPlayer && humanPlayer.chips > gameStats.finalChips) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsWon: prevStats.handsWon + 1
        }));
      }
    }
    
    // Set handComplete flag to trigger game end check
    setHandComplete(true);
  };

  const handleStartGame = async () => {
    try {
      const gameId = JSON.parse(localStorage.getItem("game_id")).value;
      const response = await api.post("/games/start-hand", {game_id: gameId});
      const data = await response.data;
      setGameState(data.game_state);
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
      setGameState(data.game_state);

      // Reset comment since humans don't make comments
      setBotComment(null);

      if (data.status === "hand_complete") {
        handleHandComplete(data.game_state);
      } else if (data.game_state.players[data.game_state.current_player_idx].is_bot) {
        await processBotActions();
      }
    } catch (err) {
      console.error("Error processing player action:", err);
      setError("Failed to process player action");
    }
  };

  const getCardColor = (card) => {
    if (!card) return '';
    
    // Check if the card contains hearts or diamonds (red suits)
    if (card.includes('♥') || card.includes('♦')) {
      return 'text-red-600';
    }
    // Otherwise it's spades or clubs (black suits)
    return 'text-gray-900';
  };

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="text-white text-center">
          <div className="w-16 h-16 border-t-4 border-b-4 border-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-xl mb-2">Loading game state...</div>
          <div className="text-sm text-gray-400">
            If this persists, please return to the bot selection screen.
          </div>
        </div>
      </div>
    );
  }

  const players = gameState.players;
  const numPlayers = players.length;
  const tableWidth = 800;
  const tableHeight = 500;
  const centerX = tableWidth / 2;
  const centerY = tableHeight / 2;
  const rectWidth = 400; // Width of the rectangular part
  const semiCircleRadius = tableHeight / 2;

  const getBetPosition = (x, y) => {
    const movementDistance = 50;
    const centerX = tableWidth / 2;
    const centerY = tableHeight / 2;
    
    const dx = centerX - x;
    const dy = centerY - y;
    
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;
    
    const betX = x + normalizedDx * movementDistance;
    const betY = y + normalizedDy * movementDistance;
    
    return { betX, betY };
  };

  const playerPositions = players.map((player, index) => {
    const totalPositions = numPlayers;
    const angle = (index / totalPositions) * 2 * Math.PI - Math.PI / 2; 
  
    const horizontalRadius = (rectWidth / 2) + semiCircleRadius;
    const verticalRadius = tableHeight / 2;
  
    const x = centerX + horizontalRadius * Math.cos(angle);
    const y = centerY + verticalRadius * Math.sin(angle);
  
    const { betX, betY } = getBetPosition(x, y);
  
    return { 
      x: x - 60,
      y: y - 60,
      betX,
      betY,
      player, 
      isButton: index === gameState.button_position 
    };
  });

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6 overflow-hidden">
      {/* Game Error Messages */}
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-lg shadow-lg border border-red-400"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Start game overlay */}
      <AnimatePresence>
        {!checkStarted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.button
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)" }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartGame}
              className="px-8 py-4 text-xl bg-gradient-to-r from-emerald-600 to-cyan-600 text-white rounded-xl shadow-2xl hover:from-emerald-600 hover:to-cyan-700 transition-all border border-emerald-400/30"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse rounded-xl"></div>
              <div className="relative flex items-center justify-center gap-2">
                <span>Deal The Cards</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Game Table */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-[800px] h-[500px] mb-8 mt-16"
      >
        {/* Table glow effect */}
        <div className="absolute inset-0 stadium bg-emerald-500/20 blur-xl"></div>
        
        {/* Main table */}
        <div className="relative flex flex-col items-center w-full h-full stadium bg-gradient-to-br from-emerald-800 to-emerald-900 shadow-2xl border-8 border-amber-950/80">
          <div className="absolute inset-8 stadium bg-emerald-700 shadow-inner"></div>
          
          <style jsx>{`
            .stadium {
              border-radius: 250px;
            }
          `}</style>

          {/* Winner Overlay */}
          <AnimatePresence>
            {winner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute top-[30%] z-50 bg-black/90 p-8 rounded-xl backdrop-blur-sm shadow-2xl border border-yellow-500/30"
              >
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-4xl font-bold text-yellow-400 text-center mb-3"
                >
                  Winner!
                </motion.div>
                <div className="text-2xl text-white text-center font-semibold">
                  {winner.name}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Game End State Overlay */}
          <AnimatePresence>
            {gameEndState && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 p-8 rounded-xl backdrop-blur-sm shadow-2xl border border-yellow-500/30"
              >
                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`text-4xl font-bold ${gameEndState === 'won' ? 'text-yellow-400' : 'text-red-500'} text-center mb-3`}
                >
                  {gameEndState === 'won' ? 'You Won The Game!' : 'Game Over!'}
                </motion.div>
                <div className="text-2xl text-white text-center font-semibold mb-4">
                  {gameEndState === 'won' ? 'You\'re the last player with chips!' : 'You\'ve run out of chips!'}
                </div>
                <div className="text-lg text-gray-300 text-center">
                  Redirecting in 5 seconds...
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Community Cards */}
          <AnimatePresence>
            {gameState.community_cards && gameState.community_cards.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-[52%] -translate-y-1/2 flex gap-2 bg-black/20 p-4 rounded-xl backdrop-blur-sm"
              >
                {gameState.community_cards.map((card, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, rotateY: 90 }}
                    animate={{ opacity: 1, rotateY: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white px-3 ${getCardColor(card)} py-2 rounded-lg font-mono shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-transform`}
                  >
                    {card}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pot and current bet display */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="absolute top-[30%] flex flex-col items-center gap-3"
          >
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-gray-700/30">
              <div className="text-yellow-400 text-2xl font-bold drop-shadow-lg mb-2">
                Pot: ${gameState.total_pot || 0}
              </div>
              <div className="text-yellow-300 text-lg font-semibold drop-shadow-lg">
                Current Bet: ${gameState.current_bet || 0}
              </div>
            </div>
          </motion.div>

          {/* Player positions */}
          <AnimatePresence>
            {playerPositions.map(({ x, y, betX, betY, player, isButton }, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 + (index * 0.05) }}
              >
                {/* Bot comment bubble */}
                <AnimatePresence>
                  {botComment && botComment.playerName === player.name && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="absolute w-60 z-50 px-4 py-3 bg-gray-900/90 text-white text-sm rounded-xl shadow-md backdrop-blur-sm border border-gray-700"
                      style={{
                        left: x + 50,
                        top: y - 30,
                        maxWidth: '200px'
                      }}
                    >
                      <div className="relative">
                        {botComment.text}
                        <div className="absolute -bottom-7 left-5 w-4 h-4 bg-gray-900/90 rotate-45 border-r border-b border-gray-700"></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bet amount chip */}
                <AnimatePresence>
                  {player.current_street_contribution > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
                      style={{ left: betX, top: betY }}
                    >
                      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-4 py-2 rounded-full font-bold shadow-lg border-2 border-blue-400/70">
                        ${player.current_street_contribution}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Player card */}
                <div className="absolute" style={{ left: x, top: y }}>
                <motion.div 
                  animate={gameState.current_player_idx === index ? { 
                    scale: [1, 1.08, 1],
                    boxShadow: [
                      "0 0 0 rgba(250, 204, 21, 0)",
                      "0 0 25px rgba(250, 204, 21, 0.8)",
                      "0 0 0 rgba(250, 204, 21, 0)"
                    ]
                  } : {}}
                  transition={gameState.current_player_idx === index ? { 
                    repeat: Infinity, 
                    duration: 1.5,
                    ease: "easeInOut"
                  } : {}}
                  className={`w-[120px] h-[120px] rounded-xl bg-white/95 shadow-xl transition-all duration-300 transform
                    ${gameState.current_player_idx === index ? 'ring-4 ring-yellow-400 scale-115 z-30' : 'hover:scale-105'}
                    ${player.status === 'folded' ? 'opacity-60 grayscale' : ''}`}
                >
                  {/* Current player indicator */}
                  {gameState.current_player_idx === index && (
                    <motion.div
                      className="absolute -inset-2 rounded-xl z-0"
                      initial={{ opacity: 0 }}
                      animate={{ 
                        opacity: [0.4, 0.8, 0.4],
                        background: [
                          "radial-gradient(circle, rgba(250, 204, 21, 0.7) 0%, rgba(250, 204, 21, 0) 70%)",
                          "radial-gradient(circle, rgba(250, 204, 21, 0.9) 0%, rgba(250, 204, 21, 0) 70%)",
                          "radial-gradient(circle, rgba(250, 204, 21, 0.7) 0%, rgba(250, 204, 21, 0) 70%)"
                        ]
                      }}
                      transition={{ 
                        repeat: Infinity, 
                        duration: 1.5,
                        ease: "easeInOut"
                      }}
                    />
                  )}
                  
                  <div className="p-3 text-center relative z-10">
                    {/* Active player label */}
                    {gameState.current_player_idx === index && (
                      <motion.div 
                        className="absolute -top-6 left-1/2 transform -translate-x-1/2"
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full font-bold text-sm shadow-lg border border-yellow-500">
                          Action
                        </div>
                      </motion.div>
                    )}
                    
                    <div className="font-bold text-gray-800 text-lg mb-1">{player.name}</div>
                    <div className="text-green-600 font-semibold text-lg">${player.chips}</div>
                    
                    {/* Player cards */}
                    {player.pocket_cards && player.pocket_cards.length > 0 && (
                      <div className="flex justify-center gap-1 mt-2">
                        {player.pocket_cards.map((card, i) => (
                          <motion.div 
                            key={i}
                            initial={{ rotateY: 90 }}
                            animate={{ rotateY: 0 }}
                            transition={{ delay: i * 0.2 }}
                            className={`bg-gradient-to-br ${getCardColor(card)} from-white to-gray-100 px-2 py-1 rounded-md font-mono shadow-md border-2 border-gray-200`}
                          >
                            {card}
                          </motion.div>
                        ))}
                      </div>
                    )}
                    
                    {/* Status indicators */}
                    <AnimatePresence>
                      {player.status === 'folded' && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 bg-red-500 text-white text-sm py-1 px-3 rounded-full font-bold animate-pulse"
                        >
                          Folded
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    <AnimatePresence>
                      {player.is_all_in && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-2 bg-orange-500 text-white text-sm py-1 px-3 rounded-full font-bold"
                        >
                          All-in
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
                  
                  {/* Dealer button */}
                  <AnimatePresence>
                    {isButton && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        className="absolute w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 -right-2 top-1/2 -translate-y-1/2"
                      >
                        <span className="font-bold text-white text-lg">D</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        
        {/* Action buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ActionButtons 
            gameState={gameState} 
            handleActionClick={handleActionClick} 
            betAmount={betAmount} 
            setBetAmount={setBetAmount} 
            handlePlayerAction={handlePlayerAction} 
            handleBetSubmit={handleBetSubmit}
            showBetInput={showBetInput}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GameTable;