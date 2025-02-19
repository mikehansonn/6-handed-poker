import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import ChooseBotCount from './pages/ChooseBotCount';
import ChooseBots from './pages/ChooseBots';
import GameTable from './pages/GameTable';
import './App.css'; // Optional, for global styling

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/choose-bot-count" element={<ChooseBotCount />} />
        <Route path="/choose-bots" element={<ChooseBots />} />
        <Route path="/game-table" element={<GameTable />} />
      </Routes>
    </Router>
  );
}

export default App;
