// src/pages/ChooseBots.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from "./api";

export default function ChooseBots() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const count = searchParams.get('count') || '1';
  const maxBots = Number(count);
  
  // Example available bots
  const AVAILABLE_BOTS = ['LooseLauren', 'TightTimmy', 'AggroAmy', 'CalmCarl'];
  const [selectedBots, setSelectedBots] = useState([]);

  const toggleBot = (bot) => {
    if (selectedBots.includes(bot)) {
      setSelectedBots(selectedBots.filter((b) => b !== bot));
    } else {
      if (selectedBots.length < maxBots) {
        setSelectedBots([...selectedBots, bot]);
      }
    }
  };

  const storeWithExpiry = (key, value, ttl) => {
    const item = {
      value: value,
      expiry: new Date().getTime() + ttl,
    }
    localStorage.setItem(key, JSON.stringify(item));
  };
  
  const handleCreateGame = async () => {
    const playerNames = ['HumanUser'];
    const botIds = [null];
  
    selectedBots.forEach((bot) => {
      playerNames.push(bot);
      botIds.push(bot.toLowerCase());
    });
  
    try {
      const response = await api.post("/games/create", { player_names: playerNames, bot_ids: botIds });
      console.log("Game created:", response.data);
      
      const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
      storeWithExpiry('game_id', response.data.game_id, TWENTY_FOUR_HOURS);
      
      navigate('/game-table', { state: { gameState: response.data.state } });
    } catch (error) {
      console.error("Error creating game:", error);
    }
  };

  if (!count) return <div>Loading...</div>;

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Select Your Bots</h1>
      <p style={textStyle}>Choose up to {count} bot(s):</p>
      <div style={botListStyle}>
        {AVAILABLE_BOTS.map((bot) => {
          const isSelected = selectedBots.includes(bot);
          return (
            <button
              key={bot}
              onClick={() => toggleBot(bot)}
              style={{
                ...botButtonStyle,
                backgroundColor: isSelected ? '#0070f3' : '#fff',
                color: isSelected ? '#fff' : '#0070f3',
              }}
            >
              {bot}
            </button>
          );
        })}
      </div>
      <p style={textStyle}>
        Selected Bots: {selectedBots.length > 0 ? selectedBots.join(', ') : 'None'}
      </p>
      <button style={buttonStyle} onClick={handleCreateGame}>
        Create Game
      </button>
    </div>
  );
}

const containerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  backgroundColor: '#f5f5f5',
};

const headerStyle = {
  fontSize: '2.5rem',
  marginBottom: '1rem',
  color: '#333',
};

const textStyle = {
  fontSize: '1.2rem',
  marginBottom: '1rem',
};

const botListStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'center',
  marginBottom: '1rem',
};

const botButtonStyle = {
  margin: '0.5rem',
  padding: '0.5rem 1rem',
  border: '2px solid #0070f3',
  borderRadius: '5px',
  cursor: 'pointer',
};

const buttonStyle = {
  padding: '0.75rem 1.5rem',
  fontSize: '1rem',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
};
