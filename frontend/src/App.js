import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChooseBotCount from './pages/ChooseBotCount';
import ChooseBots from './pages/ChooseBots';
import GameTable from './pages/GameTable';
import './App.css'; // Optional, for global styling
import GameLost from './pages/GameLost';
import GameWon from './pages/GameWon';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/choose-bot-count" element={<ChooseBotCount />} />
        <Route path="/choose-bots" element={<ChooseBots />} />
        <Route path="/game-table" element={<GameTable />} />
        <Route path="/game-won" element={<GameWon />} />
        <Route path="/game-lost" element={<GameLost />} />
      </Routes>
    </Router>
  );
}

export default App;
