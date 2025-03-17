// file: Recommendation.jsx
import React, { useState, useEffect } from 'react';
import api from './api'; // same axios instance

const Recommendation = () => {
  const [advice, setAdvice] = useState('');
  const [error, setError] = useState(null);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    const localGameIdObj = JSON.parse(localStorage.getItem("game_id"));
    const gameId = localGameIdObj?.value || null;

    if (!gameId) {
      console.log("No gameId found in localStorage.");
      setHasFetched(true);
      return;
    }

    const fetchAdvice = async () => {
      console.log("Fetching coach recommendation with gameId:", gameId);

      try {
        const response = await api.post("/games/coach-recommendation", {
          game_id: gameId
        });
        const data = await response.data;
        console.log("Coach Recommendation Data:", data);

        setAdvice(data.advice || "");
      } catch (err) {
        console.error("Error fetching advice:", err);
        setError(err.message);
      } finally {
        setHasFetched(true);
      }
    };

    fetchAdvice();
  }, []);

  if (!hasFetched && !error) {
    return (
      <div className="bg-gray-700 text-white p-4 rounded-lg w-full max-w-3xl">
        <h2 className="text-lg font-bold mb-2">Coach Recommendation</h2>
        <p className="text-sm">Loading advice...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-600 text-white p-2 rounded w-full max-w-3xl">
        Error: {error}
      </div>
    );
  }

  if (hasFetched && !advice) {
    return (
      <div className="bg-gray-700 text-white p-4 rounded-lg w-full max-w-3xl">
        <h2 className="text-lg font-bold mb-2">Coach Recommendation</h2>
        <p className="text-sm">No recommendation available at this time.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-700 text-white p-4 rounded-lg w-full max-w-3xl">
      <h2 className="text-lg font-bold mb-2">Coach Recommendation</h2>
      {/* Limit height so it scrolls instead of pushing everything up */}
      <div className="text-sm whitespace-pre-line max-h-60 overflow-y-auto">
        {advice}
      </div>
    </div>
  );
};

export default Recommendation;
