// src/pages/ChooseBots.jsx
import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

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

  const handleCreateGame = async () => {
    // Build the two arrays: one for player names and one for bot IDs.
    // The first player is always human.
    const playerNames = ['HumanUser']; // human at index 0
    const botIds = [null];              // corresponding bot_id is null

    // For each selected bot, add its name and id.
    selectedBots.forEach((bot) => {
      playerNames.push(bot);
      botIds.push(bot.toLowerCase()); // e.g., "LooseLauren" -> "looselauren"
    });

    console.log('Player Names:', playerNames);
    console.log('Bot IDs:', botIds);

    try {
      const response = await fetch("http://127.0.0.1:8000/games/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_names: playerNames, bot_ids: botIds }),
      });
      const data = await response.json();
      console.log("Game created:", data);
      // Navigate to the game table page and pass the returned state using location.state.
      navigate('/game-table', { state: { gameState: data.state } });
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
