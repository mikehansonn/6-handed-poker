import React from 'react';
import { useLocation } from 'react-router-dom';

export default function GameTable() {
  // Get the game state passed from the previous page via location.state.
  const location = useLocation();
  const gameState = location.state?.gameState;

  if (!gameState) {
    return <div>No game state provided.</div>;
  }

  const players = gameState.players;
  const numPlayers = players.length;

  // Define the circle's properties (you can adjust these for your layout)
  const tableSize = 500; // width and height of the table container
  const radius = 200;    // radius of the circle where players will be positioned
  const centerX = tableSize / 2;
  const centerY = tableSize / 2;

  // Calculate each player's position using basic trigonometry.
  const playerPositions = players.map((player, index) => {
    const angle = (2 * Math.PI / numPlayers) * index;
    // Adjust positions so the player's box (assumed 100x100px) is centered at computed coordinates.
    const x = centerX + radius * Math.cos(angle) - 50;
    const y = centerY + radius * Math.sin(angle) - 50;
    return { x, y, player };
  });

  return (
    <div style={styles.tableContainer}>
      {playerPositions.map(({ x, y, player }, index) => (
        <div key={index} style={{ ...styles.playerBox, left: x, top: y }}>
          <strong>{player.name}</strong>
          <br />
          {player.chips} chips
          <br />
          {player.status}
        </div>
      ))}
      <button style={styles.startButton}>Start Game</button>
    </div>
  );
}

const styles = {
  tableContainer: {
    position: 'relative',
    width: '500px',
    height: '500px',
    margin: '50px auto',
    border: '2px solid #333',
    borderRadius: '50%',
    backgroundColor: '#0b6623',
  },
  playerBox: {
    position: 'absolute',
    width: '100px',
    height: '100px',
    border: '2px solid #0070f3',
    borderRadius: '50%',
    backgroundColor: '#fff',
    textAlign: 'center',
    padding: '10px',
    boxSizing: 'border-box',
  },
  startButton: {
    position: 'absolute',
    left: 'calc(50% - 50px)',
    top: 'calc(50% - 20px)',
    padding: '10px 20px',
    fontSize: '1rem',
    backgroundColor: '#0070f3',
    color: '#fff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};
