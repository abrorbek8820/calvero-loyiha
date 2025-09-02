import React from 'react';
import './OnlineDot.css';

const getTimeAgoText = (lastSeen) => {
  if (!lastSeen) return 'nomaʼlum';

  const now = new Date();
  const seen = new Date(lastSeen);
  const diffSec = (now - seen) / 1000;

  if (diffSec <= 120) return null; // online — vaqt yozmaymiz
  if (diffSec <= 3600) return `${Math.floor(diffSec / 60)} daqiqa oldin`;
  if (diffSec <= 86400) return `${Math.floor(diffSec / 3600)} soat oldin`;
  return 'Ancha oldin';
};

export default function OnlineDot({ lastSeen, showTime = false }) {
  const now = new Date();
  const seen = new Date(lastSeen);
  const diffSec = (now - seen) / 1000;
  const isOnline = diffSec <= 120;

  return (
    <span className="dot-container">
      <span className={isOnline ? 'dot blink green' : 'dot red'}></span>
      {showTime && !isOnline && (
        <span className="dot-time">{getTimeAgoText(lastSeen)}</span>
      )}
    </span>
  );
}