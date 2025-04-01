// src/pages/Home.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [isAnalyticsHovering, setIsAnalyticsHovering] = useState(false);

  const handlePlayGame = () => {
    navigate('/choose-bot-count');
  };

  const handleViewAnalytics = () => {
    navigate('/analytics');
  };

  // For the card icon animations in background
  const cardSuits = ['♠', '♥', '♦', '♣'];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-4 sm:p-6 overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute -inset-[10%] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent blur-3xl"></div>
        
        {/* Animated playing card symbols - FIXED with improved visibility */}
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
        className="relative z-10 max-w-xl w-full bg-gray-900/90 backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800 overflow-hidden"
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
          className="text-center mb-10"
        >
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-4xl sm:text-5xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent drop-shadow"
          >
            Aice High
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-lg sm:text-xl text-gray-300 max-w-md mx-auto"
          >
            Challenge AI opponents with different play styles and difficulty levels
          </motion.p>
        </motion.div>
        
        {/* Game features section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-8 border border-gray-700/30 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/5 to-blue-600/5"></div>
          
          <div className="relative flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-center text-emerald-300">Game Features</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
              <div className="flex items-start space-x-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Multiple Opponents</h3>
                  <p className="text-sm text-gray-300">Play against up to 5 AI opponents with unique strategies</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-cyan-500/20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Difficulty Levels</h3>
                  <p className="text-sm text-gray-300">Choose from easy, medium, and hard AI players</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                    <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                    <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Starting Chips</h3>
                  <p className="text-sm text-gray-300">Everyone starts with an equal stack of chips</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Game Settings</h3>
                  <p className="text-sm text-gray-300">No-Limit Texas Hold'em rules</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Buttons container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          {/* Play game button */}
          <motion.button 
            onClick={handlePlayGame}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="relative px-8 py-4 text-xl font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-emerald-600 to-cyan-600 text-white flex-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/40 to-cyan-600/40 opacity-50 animate-pulse"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span>Play Now</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
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

          {/* Analytics button */}
          <motion.button 
            onClick={handleViewAnalytics}
            onMouseEnter={() => setIsAnalyticsHovering(true)}
            onMouseLeave={() => setIsAnalyticsHovering(false)}
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            className="relative px-8 py-4 text-xl font-bold rounded-xl shadow-xl overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex-1"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 opacity-50 animate-pulse"></div>
            <div className="relative flex items-center justify-center gap-2">
              <span>Analytics</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
            </div>
            
            {/* Button hover effect */}
            <AnimatePresence>
              {isAnalyticsHovering && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-indigo-400/10"
                />
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
        
        {/* Card animation at the bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 flex justify-center gap-2"
        >
          {['♠', '♥', '♦', '♣'].map((suit, index) => (
            <motion.div
              key={suit}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
              className="text-2xl"
              style={{
                color: suit === '♥' || suit === '♦' ? 'rgba(248, 113, 113, 0.6)' : 'rgba(248, 248, 248, 0.6)'
              }}
            >
              {suit}
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}