import React, { useState, useEffect } from 'react';
import api from './api';

const ActionButtons = ({ gameState, handleActionClick, betAmount, setBetAmount, handleBetSubmit }) => {
  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.current_player_idx];
  const isUserTurn = !currentPlayer.is_bot;
  const availableActions = currentPlayer.available_actions || [];

  const buttonStyles = {
    fold: "bg-red-500 hover:bg-red-600",
    check: "bg-blue-500 hover:bg-blue-600",
    call: "bg-green-500 hover:bg-green-600",
    bet: "bg-yellow-500 hover:bg-yellow-600",
    raise: "bg-purple-500 hover:bg-purple-600"
  };

  const showBetInput = (availableActions.includes('bet') || availableActions.includes('raise'));

  return (
    isUserTurn && (
      <div className="flex flex-col items-center mt-4 gap-4">
        {/* Action Buttons */}
        <div className="flex gap-3">
          {availableActions.map(action => (
            <button
              key={action}
              onClick={() => handleActionClick(action)}
              className={`${buttonStyles[action]} text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg uppercase tracking-wide`}
            >
              {action}
              {action === 'call' && currentPlayer.call_amount ? ` ($${currentPlayer.call_amount})` : ''}
            </button>
          ))}
        </div>

        {/* Bet/Raise Input */}
        {showBetInput && (
          <div className="flex items-center gap-3 bg-gray-800/50 p-3 rounded-lg backdrop-blur-sm">
            <span className="text-white font-medium">Amount:</span>
            <input
              type="number"
              className="px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none w-32 text-lg"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              min={0}
            />
            <button 
              onClick={handleBetSubmit}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg"
            >
              Confirm
            </button>
          </div>
        )}
      </div>
    )
  );
};

const GameTable = () => {
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

  // Existing game logic remains the same...
  useEffect(() => {
    const state = window.history.state?.usr?.initialGameState;
    if (state && !gameState) {
      setGameState(state);
    }
  }, []);

  useEffect(() => {
    let timer;
    if (winner) {
      timer = setTimeout(() => {
        setWinner(null);
        handleStartGame();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [winner]);

  // All existing handler functions remain the same...
  const processBotActions = async () => {
    const gameId = JSON.parse(localStorage.getItem("game_id")).value;
    try {
      while (true) {
        const botResponse = await api.post("/games/bot-action", {game_id: gameId});
        const data = await botResponse.data;
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
    if (nonFoldedPlayers.length === 1) {
      setWinner(nonFoldedPlayers[0]);
    } else {
      const winningPlayer = finalGameState.players.reduce((prev, current) => 
        (current.chips > prev.chips) ? current : prev
      );
      setWinner(winningPlayer);
    }
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

  

  if (!gameState) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white text-center">
          <div className="text-xl mb-4">Loading game state...</div>
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

  const getBetPosition = (x, y, angle) => {
    const movementDistance = 125;
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
  
    const { betX, betY } = getBetPosition(x, y, angle);
  
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
    <div className="flex flex-col items-center pt-20 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {error && (
        <div className="bg-red-500/90 backdrop-blur text-white px-6 py-3 rounded-lg mb-5 shadow-lg">
          {error}
        </div>
      )}
      
      <div className="relative w-[800px] h-[500px] mt-12">
        <div className="absolute inset-0 stadium bg-emerald-500/20 blur-xl"></div>
        
        <div className="relative w-full h-full stadium bg-gradient-to-br from-emerald-800 to-emerald-900 shadow-2xl border-8 border-amber-950/80">
          <div className="absolute inset-8 stadium bg-emerald-700 shadow-inner"></div>
          
          <style jsx>{`
            .stadium {
              border-radius: 250px;
            }
          `}</style>

          {winner && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-black/90 p-8 rounded-xl backdrop-blur-sm shadow-2xl border border-yellow-500/30">
              <div className="text-4xl font-bold text-yellow-400 text-center mb-3 animate-pulse">
                Winner!
              </div>
              <div className="text-2xl text-white text-center font-semibold">
                {winner.name}
              </div>
            </div>
          )}

          {gameState.community_cards && gameState.community_cards.length > 0 && (
            <div className="absolute left-1/2 top-[60%] -translate-x-1/2 -translate-y-1/2 flex gap-2 bg-black/20 p-4 rounded-xl backdrop-blur-sm">
              {gameState.community_cards.map((card, index) => (
                <div key={index} className="bg-white px-3 py-2 rounded-lg font-mono shadow-lg border-2 border-gray-200 transform hover:scale-105 transition-transform">
                  {card}
                </div>
              ))}
            </div>
          )}

          {/* Pot and current bet display */}
          <div className="absolute left-1/2 top-[30%] -translate-x-1/2 flex flex-col items-center gap-3">
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-xl">
              <div className="text-yellow-400 text-2xl font-bold drop-shadow-lg mb-2">
                Pot: ${gameState.total_pot || 0}
              </div>
              <div className="text-yellow-300 text-lg font-semibold drop-shadow-lg">
                Current Bet: ${gameState.current_bet || 0}
              </div>
            </div>
          </div>

          {/* Player positions */}
          {playerPositions.map(({ x, y, betX, betY, player, isButton }, index) => (
            <div key={index}>
              {/* Bet amount indicator */}
              {player.current_street_contribution > 0 && (
                <div 
                  className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: betX, top: betY }}
                >
                  <div className="bg-blue-600/90 backdrop-blur-sm text-white px-4 py-2 rounded-full font-bold shadow-lg border-2 border-blue-400">
                    ${player.current_street_contribution}
                  </div>
                </div>
              )}

              {/* Player card */}
              <div className="absolute" style={{ left: x, top: y }}>
                <div className={`w-[120px] h-[120px] rounded-xl bg-white/95 shadow-xl transition-all duration-300 transform
                  ${gameState.current_player_idx === index ? 'ring-4 ring-yellow-400 scale-110' : 'hover:scale-105'}
                  ${player.status === 'folded' ? 'opacity-75' : ''}`}>
                  <div className="p-3 text-center">
                    <div className="font-bold text-gray-800 text-lg mb-1">{player.name}</div>
                    <div className="text-green-600 font-semibold text-lg">${player.chips}</div>
                    
                    {/* Player cards */}
                    {player.pocket_cards && player.pocket_cards.length > 0 && (
                      <div className="flex justify-center gap-1 mt-2">
                        {player.pocket_cards.map((card, i) => (
                          <div key={i} className="bg-gradient-to-br from-white to-gray-100 px-2 py-1 rounded-md font-mono shadow-md border-2 border-gray-200">
                            {card}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Status indicators */}
                    {player.status === 'folded' && (
                      <div className="mt-2 bg-red-500 text-white text-sm py-1 px-3 rounded-full font-bold animate-pulse">
                        Folded
                      </div>
                    )}
                    {player.is_all_in && (
                      <div className="mt-2 bg-orange-500 text-white text-sm py-1 px-3 rounded-full font-bold">
                        All-in
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dealer button */}
                {isButton && (
                  <div className="absolute w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-10 -right-2 top-1/2 -translate-y-1/2">
                    <span className="font-bold text-white text-lg">D</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Start game button */}
          {!checkStarted && (
            <button 
              onClick={handleStartGame}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-8 py-4 text-xl bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl shadow-xl hover:from-green-600 hover:to-green-700 transition-all transform hover:scale-105"
            >
              Start Game
            </button>
          )}
        </div>
        {/* Action buttons */}
        <ActionButtons 
            gameState={gameState} 
            handleActionClick={handleActionClick} 
            betAmount={betAmount} 
            setBetAmount={setBetAmount} 
            handleBetSubmit={handleBetSubmit} 
          />
      </div>
    </div>
  );
};

export default GameTable;