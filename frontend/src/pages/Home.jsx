import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const handlePlayGame = () => {
    navigate('/choose-bot-count');
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Play Game</h1>
      <button style={buttonStyle} onClick={handlePlayGame}>
        Play Game
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
  backgroundColor: '#f0f2f5',
};

const headerStyle = {
  fontSize: '3rem',
  marginBottom: '2rem',
  color: '#333',
};

const buttonStyle = {
  padding: '1rem 2rem',
  fontSize: '1.5rem',
  backgroundColor: '#0070f3',
  color: '#fff',
  border: 'none',
  borderRadius: '10px',
  cursor: 'pointer',
};
