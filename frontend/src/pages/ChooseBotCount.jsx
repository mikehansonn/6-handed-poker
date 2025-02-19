import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChooseBotCount() {
  const [botCount, setBotCount] = useState(1);
  const navigate = useNavigate();

  const handleContinue = () => {
    // Pass the selected count via query parameter
    navigate(`/choose-bots?count=${botCount}`);
  };

  return (
    <div style={containerStyle}>
      <h1 style={headerStyle}>Select Number of Bots</h1>
      <p style={textStyle}>How many bots would you like to play with? (Max 5)</p>
      <input
        type="number"
        min="1"
        max="5"
        value={botCount}
        onChange={(e) => setBotCount(Number(e.target.value))}
        style={inputStyle}
      />
      <button style={buttonStyle} onClick={handleContinue}>
        Continue
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

const inputStyle = {
  padding: '0.5rem',
  fontSize: '1rem',
  width: '60px',
  marginBottom: '1rem',
  textAlign: 'center',
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
