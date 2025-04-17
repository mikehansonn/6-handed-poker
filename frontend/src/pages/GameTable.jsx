import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import api from './api';
import ActionButtons from './ActionButtons';
import PlayingCard from './PlayingCard';
import SoundManager from './SoundManager';

const GameTable = () => {
  const navigate = useNavigate();
  const { 
    playFoldSound,
    playBetSound, 
    playCheckSound,
    playWinSound,
    playDealSound
  } = SoundManager();
  const [botComment, setBotComment] = useState({});
  const [commentProgress, setCommentProgress] = useState(100);
  const [gameState, setGameState] = useState(() => {
    const state = window.history.state?.usr?.initialGameState;
    return state || null;
  });
  const [isMysteryMode, setIsMysteryMode] = useState(() => {
    return window.history.state?.usr?.isMysteryMode || false;
  });
  const [hidePlayerNames, setHidePlayerNames] = useState(() => {
    return window.history.state?.usr?.isMysteryMode || false;
  });
  
  const [checkStarted, setCheckStarted] = useState(false);
  const [betAmount, setBetAmount] = useState('');
  const [winner, setWinner] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [gameStats, setGameStats] = useState({
    startingChips: 200,
    handsPlayed: 0,
    handsWon: 0,
    bestHand: null
  });

  const [gameEndState, setGameEndState] = useState(null);
  const [handComplete, setHandComplete] = useState(false);
  
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    const mysteryMode = window.history.state?.usr?.isMysteryMode;
    if (mysteryMode !== undefined) {
      setIsMysteryMode(mysteryMode);
      setHidePlayerNames(mysteryMode);
    }
  }, []);

  useEffect(() => {
    let progressInterval;
    setCommentProgress(100);
    if (botComment && Object.keys(botComment).length > 0) {
      
      progressInterval = setInterval(() => {
        if (isMounted.current) {
          setCommentProgress(prev => {
            if (prev <= 0) return 0;
            return prev - 1;
          });
        }
      }, 40);
    }
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [botComment]);

  useEffect(() => {
    if (handComplete && gameState && !gameEndState) {
      const humanPlayer = gameState.players.find(p => !p.is_bot);
      
      if (humanPlayer && humanPlayer.chips <= 0) {
        setGameEndState('lost');
        return;
      }
      
      const playersWithChips = gameState.players.filter(p => p.chips > 0);
      if (playersWithChips.length === 1 && !playersWithChips[0].is_bot) {
        setGameEndState('won');
        return;
      }
      
      setHandComplete(false);
    }
  }, [handComplete, gameState, gameEndState]);
  
  useEffect(() => {
    if (gameEndState) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          if (gameEndState === 'lost') {
            navigate('/game-lost', { 
              state: { gameStats: gameStats }
            });
          } else if (gameEndState === 'won') {
            navigate('/game-won', { 
              state: { gameStats: gameStats }
            });
          }
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [gameEndState, navigate, gameStats]);

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
        if (isMounted.current) { 
          setWinner(null);
          handleStartGame();
        }
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [winner, gameEndState]);

  const updateGameState = (newGameState) => {
    if (!isMounted.current) return; 
    
    setGameState(newGameState);
    
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
    
    window.dispatchEvent(new CustomEvent('gameStateUpdated'));
  };

  const processBotActions = async () => {
    const gameId = JSON.parse(localStorage.getItem("game_id")).value;
    try {
      while (isMounted.current) {
        const botResponse = await api.post("/games/bot-action", {game_id: gameId});
        const data = await botResponse.data;
        
        if (!isMounted.current) break;
        
        if (data.table_comment) {
          setBotComment({
            text: data.table_comment,
            playerName: data.game_state.players[data.comment_index].name
          });

          await new Promise((resolve) => {
            const commentTimer = setTimeout(() => {
              resolve();
            }, 2000);
            
            if (!isMounted.current) {
              clearTimeout(commentTimer);
              resolve();
            }
          });

          if (!isMounted.current) break;
        }
        
        updateGameState(data.game_state);
        if (data.action === 'call' || data.action === 'bet' || data.action === 'raise') {
          playBetSound();
        }
        else if (data.action === 'check') {
          playCheckSound();
        }
        else if (data.action === 'fold') {
          playFoldSound();
        }

        await new Promise((resolve) => {
          const actionTimer = setTimeout(() => {
            resolve();
          }, 2000);

          if (!isMounted.current) {
            clearTimeout(actionTimer);
            resolve();
          }
        });

        if (!isMounted.current) break;
        
        setBotComment(null);

        if (data.status === "hand_complete") {
          handleHandComplete(data.game_state, data.winner, data.player_diff);
          break;
        }
        if (!data.game_state.players[data.game_state.current_player_idx].is_bot) {
          break;
        }
      }
    } catch (err) {
      console.error("Error processing bot actions:", err);
    }
  };

  const handleHandComplete = (finalGameState, winner, player_diff) => {
    if (!isMounted.current) return; 
    

    const money = parseInt(localStorage.getItem("total_money_won")) || 0;
    localStorage.setItem("total_money_won", money + player_diff);

    var session_money = JSON.parse(localStorage.getItem("session_money_won")) || [0];
    session_money[0] += player_diff
    localStorage.setItem("session_money_won", JSON.stringify(session_money));

    if (winner.name === "HumanUser") {
      const wins = parseInt(localStorage.getItem("total_hands_won")) || 0;
      localStorage.setItem("total_hands_won", wins + 1);
      var session_wins = JSON.parse(localStorage.getItem("session_hands_won")) || [0];
      session_wins[0] += 1
      localStorage.setItem("session_hands_won", JSON.stringify(session_wins));
    }

    if (gameState.community_cards && gameState.community_cards.length === 0) {
      setGameStats(prevStats => ({
        ...prevStats,
        handsPlayed: prevStats.handsPlayed + 1
      }));
    }
    
    const humanPlayer = gameState.players.find(p => !p.is_bot);
    if (humanPlayer) {
      setGameStats(prevStats => ({
        ...prevStats,
        finalChips: humanPlayer.chips
      }));
    }
    const nonFoldedPlayers = finalGameState.players.filter(p => p.status !== 'folded');
    
    const humanPlayer1 = finalGameState.players.find(p => !p.is_bot);
    
    let winningPlayer;
    
    if (nonFoldedPlayers.length === 1) {
      winningPlayer = nonFoldedPlayers[0];
      
      if (nonFoldedPlayers[0] === humanPlayer1) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsWon: prevStats.handsWon + 1
        }));
      }
    } else {
      winningPlayer = finalGameState.players.reduce((prev, current) => 
        (current.chips > prev.chips) ? current : prev
      );
      
      if (humanPlayer1 && humanPlayer1.chips > gameStats.finalChips) {
        setGameStats(prevStats => ({
          ...prevStats,
          handsWon: prevStats.handsWon + 1
        }));
      }
    }

    const winSoundTimer = setTimeout(() => {
      if (isMounted.current) {
        playWinSound();
      }
    }, 2500);
    
    const winnerTimer = setTimeout(() => {
      if (isMounted.current) { 
        setWinner(winningPlayer);
      }
    }, 3000);

    const timerIds = { winSoundTimer, winnerTimer };

    setHandComplete(true);

    return () => {
      clearTimeout(timerIds.winSoundTimer);
      clearTimeout(timerIds.winnerTimer);
    };
  };

  const handleStartGame = async () => {
    if (!isMounted.current) return; 
    
    try {
      const gameId = JSON.parse(localStorage.getItem("game_id")).value;
      const response = await api.post("/games/start-hand", {game_id: gameId});
      
      if (!isMounted.current) return;
      const hands = parseInt(localStorage.getItem("total_hands_played")) || 0;
      localStorage.setItem("total_hands_played", hands + 1);

      var session_hands = JSON.parse(localStorage.getItem("session_hands_played")) || [0];
      session_hands[0] += 1
      localStorage.setItem("session_hands_played", JSON.stringify(session_hands));
      
      const data = await response.data;
      updateGameState(data.game_state);
      playDealSound();
      setCheckStarted(true);

      if (data.game_state.players[data.game_state.current_player_idx].is_bot) {
        await processBotActions();
      }
    } catch (err) {
      console.error("Error starting game:", err);
    }
  };

  const handleActionClick = (action) => {
    if (!isMounted.current) return;
    
    if (action !== 'bet' && action !== 'raise') {
      handlePlayerAction(action);
    }
  };

  const handlePlayerAction = async (action, amount = null) => {
    if (!isMounted.current) return; 
    
    try {
      if (gameState["game_stage"] === 'preflop' && gameState['players'][0]['current_street_contribution'] < 3) {
        localStorage.setItem("pfr_check", true);
      }

      var pfr_check = localStorage.getItem('pfr_check') === 'true' || false;
      if ((action === 'bet' || action === 'raise') && pfr_check && gameState['game_stage'] === 'preflop' ) {
        var session_pfr = JSON.parse(localStorage.getItem("session_pfr")) || [0];
        session_pfr[0] += 1

        localStorage.setItem("pfr_check", false);
        localStorage.setItem("session_pfr", JSON.stringify(session_pfr));
        const total_pfr = parseInt(localStorage.getItem("total_pfr")) || 0;
        localStorage.setItem("total_pfr", total_pfr + 1);
      }

      if (gameState['game_stage'] === 'preflop' 
          && (action === 'call' ||  action === 'bet' || action === 'raise') 
          && (gameState['players'][0]['current_street_contribution'] < 2 
          || (gameState['players'][0]['current_street_contribution'] === 2
          && gameState['current_bet'] !== gameState['players'][0]['current_street_contribution']
          && gameState['players'][0]['position'] === 'Big Blind'))) {
        var session_vpip = JSON.parse(localStorage.getItem("session_vpip")) || [0];
        session_vpip[0] += 1

        localStorage.setItem("session_vpip", JSON.stringify(session_vpip));
        const total_vpip = parseInt(localStorage.getItem("total_vpip")) || 0;
        localStorage.setItem("total_vpip", total_vpip + 1);
      }
      const gameId = JSON.parse(localStorage.getItem("game_id")).value;
      const response = await api.post("/games/player-action", {
        game_id: gameId,
        action: action,
        amount: amount
      });

      if (!isMounted.current) return;
      
      const data = await response.data;
      updateGameState(data.game_state);
      if (action === 'call' || action === 'bet' || action === 'raise') {
        playBetSound();
      }
      else if (action === 'check') {
        playCheckSound();
      }
      else if (action === 'fold') {
        playFoldSound();
      }

      setBotComment(null);

      if (data.status === "hand_complete") {
        handleHandComplete(data.game_state, data.winner, data.player_diff);
      } else if (data.game_state.players[data.game_state.current_player_idx].is_bot) {
        await processBotActions();
      }
    } catch (err) {
      console.error("Error processing player action:", err);
    }
  };

  function renderChipStack(amount) {
    const chipValues = [
      { value: 200, color: "from-black to-slate-800", border: "border-slate-600" },
      { value: 100, color: "from-purple-700 to-purple-900", border: "border-purple-400" },
      { value: 50, color: "from-black to-slate-900", border: "border-slate-400" },
      { value: 25, color: "from-green-600 to-green-800", border: "border-green-400" },
      { value: 5, color: "from-red-600 to-red-800", border: "border-red-400" },
      { value: 1, color: "from-blue-600 to-blue-800", border: "border-blue-400" }
    ];
    
    let remainingAmount = amount;
    let chipCounts = {};
    
    chipValues.forEach(chip => {
      const count = Math.floor(remainingAmount / chip.value);
      if (count > 0) {
        chipCounts[chip.value] = Math.min(count, 5);
        remainingAmount -= chip.value * chipCounts[chip.value];
      }
    });
    
    let chips = [];
    let offset = 0;
    
    let totalChips = 0;
    
    Object.entries(chipCounts).forEach(([value, count]) => {
      const chipInfo = chipValues.find(c => c.value === parseInt(value));
      
      for (let i = 0; i < count && totalChips < 12; i++) {
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
        
        offset += 4; 
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
  const tableWidth = 800; 
  const tableHeight = 500;
  const centerX = tableWidth / 2;
  const centerY = tableHeight / 2;

  const playerPositions = players.map((player, index) => {
    const totalPositions = numPlayers;
    const angle = -Math.PI/2 + ((index) / totalPositions) * 2 * Math.PI + Math.PI;
    
    const ellipseA = tableWidth * 0.53;
    const ellipseB = tableHeight * 0.53; 
    
    const x = centerX + ellipseA * Math.cos(angle);
    const y = centerY + ellipseB * Math.sin(angle);
    
    const betScale = 0.5; 
    const betX = centerX - 24 + (ellipseA * betScale) * Math.cos(angle);
    const betY = centerY - 10 + (ellipseB * betScale) * Math.sin(angle);
    
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
      {isMysteryMode && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute top-4 right-4 z-30"
        >
          <button
            onClick={() => setHidePlayerNames(!hidePlayerNames)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
              hidePlayerNames 
                ? 'bg-pink-600 hover:bg-pink-500 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-white'
            }`}
          >
            {hidePlayerNames ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Show Names
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                Hide Names
              </>
            )}
          </button>
        </motion.div>
      )}
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
                  {!winner.is_bot || !hidePlayerNames ? winner.name : (
                    <span className="text-pink-400">Player</span>
                  )}
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

            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="absolute top-[35%] flex flex-col items-center"
            >
              <div className="flex items-center gap-4">
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

            {playerPositions.map(({ x, y, betX, betY, player, isButton }, index) => (
              <div key={index}>
                <AnimatePresence>
                  {botComment && botComment.playerName === player.name && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.9 }}
                      className="absolute w-48 z-50 px-4 py-2 bg-gray-900/90 text-white text-sm rounded-xl shadow-md border border-gray-700"
                      style={{
                        left: x + 90,
                        top: y - 1,
                      }}
                    >
                      <div className="relative">
                        {botComment.text}
                      </div>
                      <div className="w-full bg-gray-900/90 rounded-full mt-1 h-1 overflow-hidden">
                        <div
                          className="bg-blue-500 h-1 transition-all"
                          style={{ width: `${commentProgress}%` }}
                        ></div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                        <div className="relative flex flex-col items-center">
                          {renderChipStack(player.current_street_contribution)}

                          <div className="absolute -right-8 top-1/2 transform -translate-y-1/2 bg-black/80 text-white px-2 py-1 rounded-md text-sm font-bold whitespace-nowrap">
                            ${player.current_street_contribution}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                      {!player.is_bot || !hidePlayerNames ? player.name : (
                        <span className="text-pink-400">Player {index + 1}</span>
                      )}
                    </div>
                      <div className="text-emerald-500 font-semibold text-lg">${player.chips}</div>
                      
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
      
      <div className="mt-6 w-[800px]">
        <ActionButtons 
          gameState={gameState} 
          handleActionClick={handleActionClick} 
          betAmount={betAmount} 
          setBetAmount={setBetAmount} 
          handlePlayerAction={handlePlayerAction} 
        />
      </div>
      
      <AnimatePresence>
        {!checkStarted && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="max-w-3xl w-full px-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-8 text-center"
              >
                <motion.h1 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-4xl sm:text-5xl font-bold mb-3 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent"
                >
                  Ready to Play
                </motion.h1>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-lg text-gray-300"
                >
                  Your opponents are waiting at the table
                </motion.p>
              </motion.div>
              
              <motion.div
                className="flex justify-center mb-2"
              >
                <div className="relative h-40 w-72">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={`card-${i}`}
                      initial={{ 
                        x: 0, 
                        y: -100, 
                        rotate: 0,
                        opacity: 0 
                      }}
                      animate={{ 
                        x: i * 20 - 40, 
                        y: 0,
                        rotate: (i - 2) * 5,
                        opacity: 1 
                      }}
                      transition={{ 
                        delay: 0.5 + i * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 15
                      }}
                      className="absolute top-0 left-[35%] w-24 h-36 bg-gradient-to-br from-white to-gray-200 rounded-lg shadow-xl border border-gray-300 flex items-center justify-center"
                    >
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 1 + i * 0.1 }}
                        className="text-2xl"
                      >
                        {['♠️', '♥️', '♦️', '♣️', '🃏'][i]}
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8"
              >
                {gameState.players.filter(player => player.is_bot).map((player, index) => (
                  <motion.div
                    key={player.name}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-3 text-center"
                  >
                    <div className="font-bold text-white mb-1">
                      {!player.is_bot || !hidePlayerNames ? player.name : (
                        <span className="text-pink-400">Player {index + 1}</span>
                      )}
                    </div>
                    <div className="text-emerald-500 font-semibold">${player.chips}</div>
                  </motion.div>
                ))}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="flex justify-center"
              >
                <motion.button
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)" }}
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
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.5 }}
                className="text-center mt-6 text-gray-400 text-sm"
              >
                <span className={`${isMysteryMode ? "" : "hidden"} bg-gray-800 px-3 py-1.5 rounded-full`}>
                  Mystery Mode: Opponent identities are hidden!
                </span>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GameTable;