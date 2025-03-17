import React, { useState, useEffect } from 'react';
import Recommendation from './Recommendation';

const ActionButtons = ({ gameState, handleActionClick, betAmount, setBetAmount, handlePlayerAction }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);
  
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

  const buttonDescriptions = {
    fold: "Give up your hand and forfeit any bets",
    check: "Pass the action to the next player without betting",
    call: "Match the current bet to stay in the hand",
    bet: "Open the betting with a new wager",
    raise: "Increase the current bet amount"
  };

  const hasBettingAction = (availableActions.includes('bet') || availableActions.includes('raise'));

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
      { label: "1/2 Pot", value: halfPot },
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
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 z-50 flex flex-row items-center justify-center">
        {/* Horizontal container for all controls */}
        <div className="flex flex-row items-center gap-4 bg-gray-800/80 p-3 rounded-lg backdrop-blur-sm">
          {/* Action Buttons with tooltips */}
          <div className="flex gap-3">
            {availableActions
              .filter(action => action !== 'bet' && action !== 'raise')
              .map(action => (
                <div key={action} className="relative group">
                  <button
                    onClick={() => handleActionClick(action)}
                    className={`${buttonStyles[action]} flex text-white px-6 py-3 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg uppercase tracking-wide relative`}
                  >
                    <span>{action}</span>
                    {action === 'call' && currentPlayer.call_amount ? 
                      <span className="block text-xs mt-1 font-normal">
                        ${currentPlayer.call_amount}
                      </span> : null
                    }
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap pointer-events-none">
                    {buttonDescriptions[action]}
                  </div>
                </div>
              ))}
          </div>

          {/* Vertical separator when betting actions are available */}
          {hasBettingAction && availableActions.some(action => action !== 'bet' && action !== 'raise') && (
            <div className="h-16 w-px bg-gray-600 mx-2"></div>
          )}

          {/* Bet/Raise Input - Automatically displayed when available */}
          {hasBettingAction && (
            <div className="flex flex-row items-center gap-4">
              <div className="flex flex-col gap-2">
                <div className="text-white font-bold text-lg">
                  {availableActions.includes('bet') ? 'Make Bet' : 'Raise Bet'}
                </div>
                
                <div className="flex items-center gap-4">
                  {/* Input field and amount display */}
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">$</span>
                    <input
                      type="number"
                      className="px-3 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none w-20 text-lg"
                      value={betAmount}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 0;
                        if (value >= minBet && value <= maxBet) {
                          setBetAmount(value);
                          setSliderValue(value);
                        }
                      }}
                      min={minBet}
                      max={maxBet}
                    />
                  </div>
                  
                  {/* Slider with tooltip */}
                  <div className="relative w-40">
                    <input
                      type="range"
                      min={minBet}
                      max={maxBet}
                      value={sliderValue}
                      onChange={handleSliderChange}
                      onMouseEnter={() => setShowTooltip(true)}
                      onMouseLeave={() => setShowTooltip(false)}
                      className="w-full h-3 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((sliderValue - minBet) / (maxBet - minBet)) * 100}%, #4B5563 ${((sliderValue - minBet) / (maxBet - minBet)) * 100}%, #4B5563 100%)`,
                      }}
                    />
                    {showTooltip && (
                      <div 
                        className="absolute -top-8 px-2 py-1 bg-gray-900 text-white text-xs rounded pointer-events-none"
                        style={{ 
                          left: `calc(${((sliderValue - minBet) / (maxBet - minBet)) * 100}% - 20px)` 
                        }}
                      >
                        ${sliderValue}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Vertical layout for preset amounts and confirm button */}
              <div className="flex flex-col gap-2">
                {/* Preset bet amount buttons in a grid */}
                <div className="flex gap-2">
                  {getPresetBetAmounts().map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setBetAmount(preset.value);
                        setSliderValue(preset.value);
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-sm transition-colors"
                    >
                      {preset.label} ${preset.value}
                    </button>
                  ))}
                </div>
                
                {/* Confirm button */}
                <button 
                  onClick={() => {
                    const action = availableActions.includes('bet') ? 'bet' : 'raise';
                    // Call handlePlayerAction directly with both action and amount
                    handlePlayerAction(action, parseInt(betAmount));
                  }}
                  className={`${availableActions.includes('bet') ? buttonStyles.bet : buttonStyles.raise} text-white px-4 py-2 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg w-full`}
                >
                  {availableActions.includes('bet') ? 'Bet' : 'Raise'}
                </button>
              </div>
            </div>
          )}
        </div>
        {hasHandStarted && (
        <div className="h-full w-[400px] flex-shrink-0">
          <Recommendation />
        </div>
      )}
      </div>
    )
  );
};

export default ActionButtons;