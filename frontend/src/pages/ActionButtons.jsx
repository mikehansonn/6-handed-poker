import React, { useState, useEffect } from 'react';
import UnifiedCoach from './UnifiedCoach';

const ActionButtons = ({ gameState, handleActionClick, betAmount, setBetAmount, handlePlayerAction }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isCoachLoading, setIsCoachLoading] = useState(false);
  
  // This effect needs to be at the top level, before any returns
  useEffect(() => {
    if (gameState) {
      const availableActions = gameState.players[gameState.current_player_idx]?.available_actions || [];
      
      const minBet = availableActions.includes('bet') 
        ? gameState.big_blind 
        : (availableActions.includes('raise') 
          ? gameState.min_raise 
          : 0);
          
      if (minBet > 0 && (availableActions.includes('bet') || availableActions.includes('raise'))) {
        setSliderValue(minBet);
        setBetAmount(minBet);
      }
    }
  }, [gameState, setBetAmount]);
  
  if (!gameState) return null;

  const currentPlayer = gameState.players[gameState.current_player_idx];
  const isUserTurn = !currentPlayer.is_bot;
  const hasHandStarted = ["preflop","flop","turn","river"].includes(gameState.game_stage);
  const availableActions = currentPlayer.available_actions || [];
  
  // Calculate min and max bet amounts
  const minBet = availableActions.includes('bet') 
    ? gameState.big_blind 
    : (availableActions.includes('raise') 
      ? gameState.min_raise 
      : 0);
      
  const maxBet = currentPlayer.chips;

  const buttonStyles = {
    fold: "bg-red-500 hover:bg-red-600 border-b-4 border-red-700",
    check: "bg-blue-500 hover:bg-blue-600 border-b-4 border-blue-700",
    call: "bg-green-500 space-x-1 hover:bg-green-600 border-b-4 border-green-700",
    bet: "bg-yellow-500 hover:bg-yellow-600 border-b-4 border-yellow-700",
    raise: "bg-purple-500 hover:bg-purple-600 border-b-4 border-purple-700"
  };

  const disabledButtonStyles = {
    fold: "bg-red-400 border-b-4 border-red-500 opacity-50 cursor-not-allowed",
    check: "bg-blue-400 border-b-4 border-blue-500 opacity-50 cursor-not-allowed",
    call: "bg-green-400 space-x-1 border-b-4 border-green-500 opacity-50 cursor-not-allowed",
    bet: "bg-yellow-400 border-b-4 border-yellow-500 opacity-50 cursor-not-allowed",
    raise: "bg-purple-400 border-b-4 border-purple-500 opacity-50 cursor-not-allowed"
  };

  const buttonDescriptions = {
    fold: "Give up your hand and forfeit any bets",
    check: "Pass the action to the next player without betting",
    call: "Match the current bet to stay in the hand",
    bet: "Open the betting with a new wager",
    raise: "Increase the current bet amount"
  };

  const hasBettingAction = (availableActions.includes('bet') || availableActions.includes('raise'));
  
  // Check if loading state is active
  const isLoading = isCoachLoading;

  const handleSliderChange = (e) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);
    setBetAmount(value);
  };

  const getPresetBetAmounts = () => {
    if (!maxBet) return [];
    
    const halfPot = Math.min(Math.floor(gameState.total_pot / 2), maxBet);
    const potSize = Math.min(gameState.total_pot, maxBet);
    const allIn = maxBet + currentPlayer.current_street_contribution;
    
    return [
      { label: "Min", value: minBet },
      { label: "1/2", value: halfPot },
      { label: "Pot", value: potSize },
      { label: "All In", value: allIn }
    ].filter((option, index, self) => 
      // Remove duplicates
      index === self.findIndex(o => o.value === option.value) && 
      // Ensure value is at least minBet
      option.value >= minBet
    );
  };

  return (
    isUserTurn && (
      <div className="fixed bottom-0 left-0 right-0 z-50 mb-6 flex justify-center">
        <div className="flex flex-col items-center max-w-screen-lg w-full px-4">
          {/* Main row with coach and action buttons side by side */}
          <div className="flex flex-row items-end gap-48 w-full justify-center">
            {/* Coach component on the left side */}
            {hasHandStarted && (
              <UnifiedCoach setIsLoading={setIsCoachLoading} />
            )}
            
            {/* Action buttons container */}
            <div className="w-96 bg-gray-800/80 p-3 rounded-lg backdrop-blur-sm shadow-lg">
              {/* Basic action buttons with tooltips */}
              <div className="flex flex-wrap gap-2 justify-center">
                {availableActions
                  .filter(action => action !== 'bet' && action !== 'raise')
                  .map(action => (
                    <div key={action} className="relative group">
                      <button
                        onClick={() => !isLoading && handleActionClick(action)}
                        className={`${isLoading ? disabledButtonStyles[action] : buttonStyles[action]} flex text-white px-4 py-2 rounded-lg font-semibold transform ${!isLoading && 'hover:scale-105'} transition-all duration-200 shadow-lg uppercase tracking-wide text-sm relative`}
                        disabled={isLoading}
                      >
                        <span>{action}</span>
                        {action === 'call' && currentPlayer.call_amount ? 
                          <span className="items-center flex block text-xs font-normal ml-1">
                            ${currentPlayer.call_amount}
                          </span> : null
                        }
                        {isLoading && (
                          <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                          </div>
                        )}
                      </button>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none z-10">
                        {isLoading ? "Wait for analysis to complete" : buttonDescriptions[action]}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Betting controls - only shown when betting actions are available */}
              {hasBettingAction && (
                <div className="mt-3 pt-3 border-t border-gray-600">
                  <div className="text-white font-bold text-sm mb-2 text-center">
                    {availableActions.includes('bet') ? 'Place Bet' : 'Raise Amount'}
                  </div>
                  
                  <div className="flex items-center gap-2 justify-center">
                    {/* Input field */}
                    <div className="flex items-center">
                      <span className="text-white font-medium text-sm pr-1">$</span>
                      <input
                        type="number"
                        className={`px-2 py-1 text-black rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none w-16 text-sm ${isLoading ? 'opacity-50 bg-gray-200' : ''}`}
                        value={betAmount}
                        onChange={(e) => {
                          if (isLoading) return;
                          const value = parseInt(e.target.value) || 0;
                          if (value >= minBet && value <= maxBet) {
                            setBetAmount(value);
                            setSliderValue(value);
                          }
                        }}
                        min={minBet}
                        max={maxBet}
                        disabled={isLoading}
                      />
                    </div>
                    
                    {/* Slider with tooltip */}
                    <div className="relative w-32">
                      <input
                        type="range"
                        min={minBet}
                        max={maxBet}
                        value={sliderValue}
                        onChange={handleSliderChange}
                        onMouseEnter={() => setShowTooltip(true)}
                        onMouseLeave={() => setShowTooltip(false)}
                        className={`w-full h-2 bg-gray-600 rounded-lg appearance-none ${isLoading ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        style={{
                          background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((sliderValue - minBet) / (maxBet - minBet)) * 100}%, #4B5563 ${((sliderValue - minBet) / (maxBet - minBet)) * 100}%, #4B5563 100%)`,
                        }}
                        disabled={isLoading}
                      />
                      {showTooltip && !isLoading && (
                        <div 
                          className="absolute -top-6 px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none"
                          style={{ 
                            left: `calc(${((sliderValue - minBet) / (maxBet - minBet)) * 100}% - 15px)` 
                          }}
                        >
                          ${sliderValue}
                        </div>
                      )}
                    </div>
                  
                    {/* Confirm button */}
                    <button 
                      onClick={() => {
                        if (isLoading) return;
                        const action = availableActions.includes('bet') ? 'bet' : 'raise';
                        handlePlayerAction(action, parseInt(betAmount));
                      }}
                      className={`${isLoading ? 
                        (availableActions.includes('bet') ? disabledButtonStyles.bet : disabledButtonStyles.raise) : 
                        (availableActions.includes('bet') ? buttonStyles.bet : buttonStyles.raise)
                      } text-white px-4 py-2 rounded-lg text-sm font-semibold transform ${!isLoading && 'hover:scale-105'} transition-all duration-200 shadow-lg`}
                      disabled={isLoading}
                    >
                      {availableActions.includes('bet') ? 'Bet' : 'Raise'}
                      {isLoading && (
                        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-lg flex items-center justify-center">
                        </div>
                      )}
                    </button>
                  </div>
                  
                  {/* Preset bet amount buttons */}
                  <div className="flex gap-2 mt-2 justify-center">
                    {getPresetBetAmounts().map((preset, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (isLoading) return;
                          setBetAmount(preset.value);
                          setSliderValue(preset.value);
                        }}
                        className={`${isLoading ? 'bg-gray-500 opacity-50 cursor-not-allowed' : 'bg-gray-700 hover:bg-gray-600'} text-white px-2 py-1 rounded text-xs font-medium transition-colors`}
                        disabled={isLoading}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  );
};

export default ActionButtons;