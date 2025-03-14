import React from 'react';
import { motion } from 'framer-motion';

const PlayingCard = ({ card }) => {
  const isHidden = card === "";
  
  if (card === null || card === undefined) return null;
  
  let suit = "";
  let rank = "";
  let textColor = "";
  
  if (!isHidden) {
    suit = card.slice(-1);
    rank = card.slice(0, -1);
    const isRed = suit === '♥' || suit === '♦';
    textColor = isRed ? 'text-red-600' : 'text-black';
  }
  
  return (
    <motion.div 
      initial={{ rotateY: 90 }}
      animate={{ rotateY: 0 }}
      transition={{ duration: 0.3 }}
      className={`w-14 h-20 rounded-md shadow-md border-2 relative flex items-center justify-center transform hover:scale-105 transition-transform ${
        isHidden ? 'bg-blue-500 border-blue-700' : 'bg-white border-gray-200'
      }`}
    >
      {isHidden ? (
        // Back of card design
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-10 h-16 border-2 border-blue-300 rounded-sm bg-blue-400 flex items-center justify-center">
          </div>
        </div>
      ) : (
        // Front of card design
        <>
          <div className={`absolute top-1 left-1 font-mono font-bold text-md ${textColor}`}>
            {rank}
          </div>
          
          <div className={`absolute bottom-1 right-1 font-mono font-bold text-md rotate-180 ${textColor}`}>
            {rank}
          </div>
          
          <div className={`font-bold text-3xl ${textColor}`}>
            {suit}
          </div>
        </>
      )}
    </motion.div>
  );
};

export default PlayingCard;