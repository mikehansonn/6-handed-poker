// src/pages/Analytics.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Analytics() {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [analyticsData, setAnalyticsData] = useState({
    sessionHandsPlayed: [],
    sessionHandsWon: [],
    sessionMoneyWon: [],
    sessionPFR: [],
    sessionVPIP: [],
    totalHandsPlayed: 0,
    totalHandsWon: 0,
    totalMoneyWon: 0,
    totalPFR: 0,
    totalVPIP: 0,
    gameSizes: [],
    botSelection: {}
  });
  const [winRate, setWinRate] = useState(0);
  const [avgMoneyPerSession, setAvgMoneyPerSession] = useState(0);
  const [pfrPercentage, setPfrPercentage] = useState(0);
  const [vpipPercentage, setVpipPercentage] = useState(0);
  const [favoriteBot, setFavoriteBot] = useState({ name: '', count: 0 });
  const [mostSuccessfulSize, setMostSuccessfulSize] = useState({ size: 0, count: 0 });

  // For the card icon animations in background
  const cardSuits = ['♠', '♥', '♦', '♣'];

  // Bot display information
  const BOT_INFO = {
    'LooseLauren': { color: 'from-blue-500 to-blue-600', icon: '♠️', description: 'Plays many hands with a relaxed approach' },
    'TightTimmy': { color: 'from-red-500 to-red-600', icon: '♦️', description: 'Selective and patient player who waits for premium hands' },
    'BalancedBenny': { color: 'from-purple-500 to-purple-600', icon: '♣️', description: 'Adapts play style based on table dynamics' },
    'HyperHenry': { color: 'from-yellow-500 to-yellow-600', icon: '♥️', description: 'Constantly applies pressure with aggressive betting' },
    'PassivePete': { color: 'from-green-500 to-green-600', icon: '🃏', description: 'Rarely initiates betting and prefers to call' },
    'TrickyTravis': { color: 'from-pink-500 to-pink-600', icon: '🃏', description: 'Unpredictable player who uses deception effectively' },
    'MathMindy': { color: 'from-cyan-500 to-cyan-600', icon: '🃏', description: 'Makes decisions based on precise mathematical odds' },
    'ExploitingEve': { color: 'from-orange-500 to-orange-600', icon: '🃏', description: 'Identifies and targets weaknesses in opponents' },
    'WildcardWally': { color: 'from-indigo-500 to-indigo-600', icon: '🃏', description: 'Highly random play style that is hard to read' },
    'ManiacMitch': { color: 'from-rose-500 to-rose-600', icon: '🃏', description: 'Extremely aggressive with constant raising' }
  };

  // Colors for pie charts
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#F43F5E'];

  useEffect(() => {
    // Load data from localStorage
    const sessionHandsPlayed = JSON.parse(localStorage.getItem("session_hands_played")) || [];
    const sessionHandsWon = JSON.parse(localStorage.getItem("session_hands_won")) || [];
    const sessionMoneyWon = JSON.parse(localStorage.getItem("session_money_won")) || [];
    const sessionPFR = JSON.parse(localStorage.getItem("session_pfr")) || [];
    const sessionVPIP = JSON.parse(localStorage.getItem("session_vpip")) || [];
    const totalHandsPlayed = parseInt(localStorage.getItem("total_hands_played")) || 0;
    const totalHandsWon = parseInt(localStorage.getItem("total_hands_won")) || 0;
    const totalMoneyWon = parseInt(localStorage.getItem("total_money_won")) || 0;
    const totalPFR = parseInt(localStorage.getItem("total_pfr")) || 0;
    const totalVPIP = parseInt(localStorage.getItem("total_vpip")) || 0;
    const gameSizes = JSON.parse(localStorage.getItem("game_sizes")) || [0, 0, 0, 0, 0];
    const botSelection = JSON.parse(localStorage.getItem("bot_selection")) || {};
    const totalSessionsPlayed = JSON.parse(localStorage.getItem("total_sessions_played")) || 0;

    setAnalyticsData({
      sessionHandsPlayed,
      sessionHandsWon,
      sessionMoneyWon,
      sessionPFR,
      sessionVPIP,
      totalHandsPlayed,
      totalHandsWon,
      totalMoneyWon,
      totalPFR,
      totalVPIP,
      gameSizes,
      botSelection
    });

    // Calculate additional stats
    if (totalHandsPlayed > 0) {
      setWinRate(((totalHandsWon / totalHandsPlayed) * 100).toFixed(1));
      setPfrPercentage(((totalPFR / totalHandsPlayed) * 100).toFixed(1));
      setVpipPercentage(((totalVPIP / totalHandsPlayed) * 100).toFixed(1));
    }

    setAvgMoneyPerSession((totalMoneyWon / totalSessionsPlayed).toFixed(2));

    // Find favorite bot
    if (Object.keys(botSelection).length > 0) {
      const favorite = Object.entries(botSelection).reduce((max, [bot, count]) => 
        count > max.count ? { name: bot, count } : max
      , { name: '', count: 0 });
      setFavoriteBot(favorite);
    }

    // Find most successful game size
    if (gameSizes.some(size => size > 0)) {
      const maxSizeIndex = gameSizes.indexOf(Math.max(...gameSizes));
      setMostSuccessfulSize({ size: maxSizeIndex + 2, count: gameSizes[maxSizeIndex] });
    }
  }, []);

  const handleReturnHome = () => {
    navigate('/');
  };

  // Format data for session history chart
  const getSessionChartData = () => {
    return analyticsData.sessionHandsPlayed.map((hands, index) => ({
      session: `Game ${analyticsData.sessionHandsPlayed.length - index}`,
      hands: hands,
      won: analyticsData.sessionHandsWon[index] || 0,
      money: analyticsData.sessionMoneyWon[index] || 0
    })).reverse();
  };

  // Format data for playing style chart
  const getPlayingStyleData = () => {
    return analyticsData.sessionHandsPlayed.map((hands, index) => {
      // Calculate percentages for each session
      const vpipPercent = hands > 0 ? (analyticsData.sessionVPIP[index] / hands) * 100 : 0;
      const pfrPercent = hands > 0 ? (analyticsData.sessionPFR[index] / hands) * 100 : 0;
      
      return {
        session: `Game ${analyticsData.sessionHandsPlayed.length - index}`,
        VPIP: parseFloat(vpipPercent.toFixed(1)),
        PFR: parseFloat(pfrPercent.toFixed(1)),
        hands: hands
      };
    }).reverse();
  };

  // Format data for game sizes pie chart
  const getGameSizeData = () => {
    return analyticsData.gameSizes.map((count, index) => ({
      name: `${index + 2} Players`,
      value: count
    })).filter(item => item.value > 0);
  };

  // Format data for bot selection pie chart
  const getBotSelectionData = () => {
    return Object.entries(analyticsData.botSelection).map(([bot, count]) => ({
      name: bot,
      value: count
    })).sort((a, b) => b.value - a.value);
  };

  // Custom tooltip for the Session Performance chart
  const SessionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
          <p className="text-cyan-400 font-bold">{label}</p>
          <p className="text-emerald-400">Hands Played: {payload[0].value}</p>
          <p className="text-yellow-400">Hands Won: {payload[1].value}</p>
          <p className={`font-semibold ${payload[2].value >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            Money: ${payload[2].value}
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for the Playing Style chart
  const PlayingStyleTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-4 border border-gray-700 rounded-lg shadow-lg">
          <p className="text-cyan-400 font-bold">{label}</p>
          <p className="text-purple-400">VPIP: {payload[0].value}%</p>
          <p className="text-orange-400">PFR: {payload[1].value}%</p>
          <p className="text-gray-300 text-sm mt-1">Based on {payload[2].value} hands</p>
        </div>
      );
    }
    return null;
  };

  // Custom tooltip for pie charts
  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-lg shadow-lg">
          <p className="text-white font-bold">{payload[0].name}</p>
          <p className="text-emerald-400 font-semibold">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute -inset-[10%] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent blur-3xl"></div>
        
        {/* Animated playing card symbols */}
        <div className="overflow-hidden h-full w-full absolute z-0">
          {cardSuits.flatMap((suit, suitIndex) => 
            [...Array(5)].map((_, i) => (
              <motion.div 
                key={`${suit}-${i}`}
                initial={{ 
                  left: `${Math.random() * 100}%`, 
                  top: '-50px',
                  rotate: Math.random() * 360,
                  opacity: 0.2 + Math.random() * 0.15
                }}
                animate={{ 
                  top: ['-50px', `${window.innerHeight + 50}px`],
                  rotate: [0, 360],
                }}
                transition={{ 
                  duration: 15 + Math.random() * 20, 
                  repeat: Infinity, 
                  delay: Math.random() * 20,
                  ease: "linear"
                }}
                className="absolute text-4xl sm:text-5xl pointer-events-none"
                style={{
                  color: suit === '♥' || suit === '♦' ? 'rgba(248, 113, 113, 0.4)' : 'rgba(248, 248, 248, 0.4)'
                }}
              >
                {suit}
              </motion.div>
            ))
          )}
        </div>
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 max-w-6xl w-full bg-gray-900/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800 overflow-hidden"
      >
        {/* Glowing backgrounds */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="absolute -bottom-20 -right-20 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl"
        />
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-center mb-8"
        >
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow"
          >
            Your Poker Analytics
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg sm:text-xl text-gray-300 max-w-md mx-auto"
          >
            Track your performance and gain insights into your poker journey
          </motion.p>
        </motion.div>
        
        {/* Key stats cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          {/* Total Hands */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-blue-400/5"></div>
            <div className="relative">
              <div className="text-blue-400 text-4xl mb-2">♠</div>
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-1">Total Hands</h3>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold">{analyticsData.totalHandsPlayed}</div>
                <div className="ml-2 text-gray-400 text-sm">hands played</div>
              </div>
            </div>
          </div>
          
          {/* Win Rate */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-emerald-400/5"></div>
            <div className="relative">
              <div className="text-emerald-400 text-4xl mb-2">♣</div>
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-1">Win Rate</h3>
              <div className="flex items-baseline">
                <div className="text-3xl font-bold">{winRate}%</div>
                <div className="ml-2 text-gray-400 text-sm">({analyticsData.totalHandsWon} wins)</div>
              </div>
            </div>
          </div>
          
          {/* VPIP / PFR Stats */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-orange-400/5"></div>
            <div className="relative">
              <div className="text-purple-400 text-4xl mb-2">♦</div>
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-1">Playing Style</h3>
              <div className="flex flex-col">
                <div className="flex items-baseline">
                  <div className="text-lg font-bold text-purple-400">VPIP: {vpipPercentage}%</div>
                </div>
                <div className="flex items-baseline mt-1">
                  <div className="text-lg font-bold text-orange-400">PFR: {pfrPercentage}%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Total Money Won */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-600/5 to-yellow-400/5"></div>
            <div className="relative">
              <div className="text-yellow-400 text-4xl mb-2">♥</div>
              <h3 className="text-sm uppercase tracking-wider text-gray-400 mb-1">Total Profit</h3>
              <div className="flex items-baseline">
                <div className={`text-3xl font-bold ${analyticsData.totalMoneyWon >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${analyticsData.totalMoneyWon}
                </div>
                <div className="ml-2 text-gray-400 text-sm">lifetime</div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Session Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
          
          <div className="relative">
            <h2 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Session Performance History
            </h2>
            
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getSessionChartData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="session" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" />
                  <Tooltip content={<SessionTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="hands" name="Hands Played" stroke="#10B981" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="won" name="Hands Won" stroke="#F59E0B" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="money" name="Money Won/Lost" stroke="#3B82F6" strokeWidth={2} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Playing Style Chart - New Chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-orange-600/5"></div>
          
          <div className="relative">
            <h2 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-orange-400 bg-clip-text text-transparent">
              Playing Style History (VPIP/PFR)
            </h2>
            
            <div className="w-full h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={getPlayingStyleData()}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="session" stroke="#6B7280" />
                  <YAxis stroke="#6B7280" domain={[0, 100]} label={{ value: '%', position: 'insideLeft', angle: -90, dy: 30, style: { fill: '#9CA3AF' } }} />
                  <Tooltip content={<PlayingStyleTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="VPIP" name="VPIP %" stroke="#A855F7" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="PFR" name="PFR %" stroke="#F97316" strokeWidth={2} activeDot={{ r: 8 }} />
                  <Line type="monotone" dataKey="hands" name="Hands" stroke="#6B7280" strokeWidth={1} strokeDasharray="5 5" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
        
        {/* Two column layout for smaller charts */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8"
        >
          {/* Game Size Distribution */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 to-indigo-600/5"></div>
            
            <div className="relative">
              <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Game Size Distribution
              </h2>
              
              <div className="text-center mb-4">
                <p className="text-gray-300">
                  Most played: <span className="font-bold text-indigo-400">{mostSuccessfulSize.size} Player Games</span>
                  <span className="text-gray-400 text-sm ml-2">({mostSuccessfulSize.count} times)</span>
                </p>
              </div>
              
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getGameSizeData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getGameSizeData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          {/* Bot Selection Distribution */}
          <div className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/5 to-blue-600/5"></div>
            
            <div className="relative">
              <h2 className="text-xl font-bold mb-4 text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Favorite Opponents
              </h2>
              
              <div className="text-center mb-4">
                <p className="text-gray-300">
                  Most frequent opponent: <span className="font-bold text-cyan-400">{favoriteBot.name}</span>
                  <span className="text-gray-400 text-sm ml-2">({favoriteBot.count} times)</span>
                </p>
              </div>
              
              <div className="w-full h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getBotSelectionData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name.substring(0, 6)}... (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getBotSelectionData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Bot Opponents Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 relative overflow-hidden mb-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-rose-600/5 to-orange-600/5"></div>
          
          <div className="relative">
            <h2 className="text-xl font-bold mb-6 text-center bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
              Your Opponent History
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {Object.entries(analyticsData.botSelection)
                .sort((a, b) => b[1] - a[1])
                .map(([botName, count]) => {
                  const botInfo = BOT_INFO[botName] || { color: 'from-gray-500 to-gray-600', icon: '🃏', description: 'Unknown bot' };
                  
                  return (
                    <div 
                      key={botName}
                      className={`bg-gradient-to-br ${botInfo.color} rounded-xl p-4 shadow-lg border border-white/10 transform transition-transform hover:scale-105`}
                    >
                      <div className="flex flex-col items-center text-center">
                        <div className="text-3xl mb-2">{botInfo.icon}</div>
                        <h3 className="font-bold text-white">{botName}</h3>
                        <p className="text-xs text-white/80 mt-1">{botInfo.description}</p>
                        <div className="mt-2 bg-black/30 px-3 py-1 rounded-full">
                          <span className="text-white font-bold">{count}</span>
                          <span className="text-white/80 text-xs ml-1">games</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </motion.div>
        
        {/* Return home button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="flex justify-center"
        >
          <motion.button 
            onClick={handleReturnHome}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="relative px-10 py-4 text-xl font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-600 text-white"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span>Return to Home</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </div>
            
            {/* Button hover effect */}
            <AnimatePresence>
              {isHovering && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10"
                />
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
}