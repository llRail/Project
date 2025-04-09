import React from 'react';

function Points({ user, onBackToHome }) {
  return (
    <div>
      <h1>Your Points</h1>
      <p>Current points: {user.points}</p>
      <button onClick={onBackToHome}>Back to Home</button>
    </div>
  );
}

export default Points;
