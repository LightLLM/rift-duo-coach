'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import type { EnrichedMastery } from '@/lib/types';
import ChestBadge from './ChestBadge';

interface MasteryCardProps {
  mastery: EnrichedMastery;
  index?: number;
}

export default function MasteryCard({ mastery, index = 0 }: MasteryCardProps) {
  const {
    championName,
    championLevel,
    championPoints,
    lastPlayTime,
    championPointsSinceLastLevel,
    championPointsUntilNextLevel,
    chestGranted,
  } = mastery;

  // Calculate progress to next level
  const totalPointsForNextLevel = championPointsSinceLastLevel + championPointsUntilNextLevel;
  const progressPercentage = totalPointsForNextLevel > 0
    ? (championPointsSinceLastLevel / totalPointsForNextLevel) * 100
    : 0;

  // Determine if max level
  const isMaxLevel = championLevel === 7;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 hover:border-purple-500 transition-all hover:shadow-lg hover:shadow-purple-500/20"
    >
      {/* Header with Champion Name and Chest Badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{championName}</h3>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>{formatLastPlayed(lastPlayTime)}</span>
          </div>
        </div>
        <ChestBadge available={!chestGranted} size="md" />
      </div>

      {/* Mastery Level Badge */}
      <div className="flex items-center gap-3 mb-3">
        <MasteryBadge level={championLevel} />
        <div className="flex-1">
          <div className="text-sm text-slate-400">Mastery Points</div>
          <div className="text-xl font-bold text-white">
            {formatMasteryPoints(championPoints)}
          </div>
        </div>
      </div>

      {/* Progress Bar to Next Level */}
      {!isMaxLevel && championPointsUntilNextLevel > 0 && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Progress to Level {championLevel + 1}</span>
            <span>{formatMasteryPoints(championPointsUntilNextLevel)} to go</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
            />
          </div>
        </div>
      )}

      {isMaxLevel && (
        <div className="text-center py-2">
          <span className="text-xs font-semibold text-purple-400 bg-purple-900/30 px-3 py-1 rounded-full">
            MAX MASTERY
          </span>
        </div>
      )}
    </motion.div>
  );
}

function MasteryBadge({ level }: { level: number }) {
  // Color scheme based on mastery level
  const getColorScheme = (level: number) => {
    if (level >= 7) return 'from-cyan-400 to-blue-500';
    if (level >= 6) return 'from-purple-400 to-pink-500';
    if (level >= 5) return 'from-orange-400 to-red-500';
    if (level >= 4) return 'from-yellow-400 to-orange-400';
    return 'from-slate-400 to-slate-500';
  };

  const colorScheme = getColorScheme(level);

  return (
    <div
      className={`relative w-16 h-16 rounded-full bg-gradient-to-br ${colorScheme} flex items-center justify-center shadow-lg`}
    >
      <div className="absolute inset-0.5 bg-slate-900 rounded-full flex items-center justify-center">
        <span className="text-2xl font-bold text-white">{level}</span>
      </div>
      {level >= 5 && (
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full border-2 border-slate-900 animate-pulse" />
      )}
    </div>
  );
}

function formatMasteryPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`;
  }
  return points.toLocaleString();
}

function formatLastPlayed(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (years > 0) return `${years} year${years > 1 ? 's' : ''} ago`;
  if (months > 0) return `${months} month${months > 1 ? 's' : ''} ago`;
  if (weeks > 0) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return 'Just now';
}
