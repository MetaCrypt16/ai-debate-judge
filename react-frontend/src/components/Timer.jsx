import React, { useState, useEffect, useCallback } from 'react';
import { Clock } from 'lucide-react';

export default function Timer({ 
  remainingTime,
  isActive,
  onTimeUpdate,
  onTimeUp,
  className = "" 
}) {
  // Format time as mm:ss
  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Start timer when active
  useEffect(() => {
    let interval;
    if (isActive && remainingTime > 0) {
      interval = setInterval(() => {
        const newTime = remainingTime - 1;
        onTimeUpdate(newTime);
        
        if (newTime <= 0) {
          clearInterval(interval);
          onTimeUp?.();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, remainingTime, onTimeUpdate, onTimeUp]);

  return (
    <div className={`flex items-center gap-2 font-mono ${className}`}>
      <Clock className={`w-4 h-4 ${isActive ? 'text-green-500' : 'text-gray-400'}`} />
      <span className={`
        ${remainingTime < 30 ? 'text-red-600 animate-pulse' : 
          remainingTime < 60 ? 'text-orange-500' : 
          isActive ? 'text-green-600' : 'text-gray-500'}
      `}>
        {formatTime(remainingTime)}
      </span>
    </div>
  );
}