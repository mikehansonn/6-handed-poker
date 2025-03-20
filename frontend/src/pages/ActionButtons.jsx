import React, { useState, useEffect } from 'react';
import Recommendation from './Recommendation';
import CoachChat from './CoachChat';

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
        {/* Container for both elements with absolute positioning */}
        <div className="relative">
          {/* Horizontal container for all controls - centered with reduced width */}
          <div className="flex flex-row items-center gap-3 bg-gray-800/80 p-2 rounded-lg backdrop-blur-sm shadow-lg max-w-lg">
          {/* Action Buttons with tooltips - smaller buttons */}
          <div className="flex gap-2">
            {availableActions
              .filter(action => action !== 'bet' && action !== 'raise')
              .map(action => (
                <div key={action} className="relative group">
                  <button
                    onClick={() => handleActionClick(action)}
                    className={`${buttonStyles[action]} flex text-white px-4 py-2 rounded-lg font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg uppercase tracking-wide text-sm relative`}
                  >
                    <span>{action}</span>
                    {action === 'call' && currentPlayer.call_amount ? 
                      <span className="items-center flex block text-xs font-normal">
                        ${currentPlayer.call_amount}
                      </span> : null
                    }
                  </button>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap pointer-events-none">
                    {buttonDescriptions[action]}
                  </div>
                </div>
              ))}
          </div>

          {/* Vertical separator when betting actions are available */}
          {hasBettingAction && availableActions.some(action => action !== 'bet' && action !== 'raise') && (
            <div className="h-12 w-px bg-gray-600 mx-1"></div>
          )}

          {/* Bet/Raise Input - Automatically displayed when available - more compact */}
          {hasBettingAction && (
            <div className="flex flex-col gap-1">
              <div className="text-white font-bold text-sm">
                {availableActions.includes('bet') ? 'Bet' : 'Raise'}
              </div>
              
              <div className="flex items-center gap-2">
                {/* Input field and slider in more compact layout */}
                <div className="flex items-center">
                  <span className="text-white font-medium text-sm">$</span>
                  <input
                    type="number"
                    className="px-2 py-1 text-black rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none w-16 text-sm"
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
                <div className="relative w-24">
                  <input
                    type="range"
                    min={minBet}
                    max={maxBet}
                    value={sliderValue}
                    onChange={handleSliderChange}
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((sliderValue - minBet) / (maxBet - minBet)) * 100}%, #4B5563 ${((sliderValue - minBet) / (maxBet - minBet)) * 100}%, #4B5563 100%)`,
                    }}
                  />
                  {showTooltip && (
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
                    const action = availableActions.includes('bet') ? 'bet' : 'raise';
                    // Call handlePlayerAction directly with both action and amount
                    handlePlayerAction(action, parseInt(betAmount));
                  }}
                  className={`${availableActions.includes('bet') ? buttonStyles.bet : buttonStyles.raise} text-white px-3 py-1 rounded-lg text-sm font-semibold transform hover:scale-105 transition-all duration-200 shadow-lg`}
                >
                  {availableActions.includes('bet') ? 'Bet' : 'Raise'}
                </button>
              </div>
              
              {/* Preset bet amount buttons in a horizontal layout */}
              <div className="flex gap-1 mt-1 justify-center">
                {getPresetBetAmounts().map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setBetAmount(preset.value);
                      setSliderValue(preset.value);
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-1 py-1 rounded text-xs transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Recommendation component to the left */}
        {hasHandStarted && (
          <div className="absolute right-full bottom-0 mr-3">
            <Recommendation />
          </div>
        )}
        
        {/* CoachChat component to the right */}
        {hasHandStarted && (
          <div className="absolute left-full bottom-0 ml-3">
            <CoachChat />
          </div>
        )}
        </div>
      </div>
    )
  );
};

export default ActionButtons;