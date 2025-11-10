'use client';

import { motion } from 'framer-motion';
import {
  Trophy,
  TrendingUp,
  Target,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Flame,
  Award,
} from 'lucide-react';
import type { PlayerAnalytics } from '@/lib/analytics';
import type { AIInsights } from '@/lib/aws-bedrock';

interface RecapCardProps {
  analytics: PlayerAnalytics;
  insights: AIInsights;
  riotId: string;
  region: string;
}

export default function RecapCard({
  analytics,
  insights,
  riotId,
  region,
}: RecapCardProps) {
  const { overview, championStats, temporalTrends, performanceMetrics, streaks, highlightMatches } = analytics;

  return (
    <div className="space-y-6">
      {/* Year in Review Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-lg p-6 border border-purple-500/50"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold">Your Year in Review</h2>
        </div>
        <p className="text-lg text-slate-200 leading-relaxed">{insights.yearInReview}</p>
      </motion.div>

      {/* Key Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          icon={<Trophy className="w-5 h-5" />}
          label="Total Games"
          value={overview.totalGames.toString()}
          color="from-yellow-500 to-orange-500"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Win Rate"
          value={`${overview.winRate.toFixed(1)}%`}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={<Target className="w-5 h-5" />}
          label="Avg KDA"
          value={overview.avgKDA.toFixed(2)}
          color="from-purple-500 to-pink-500"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Playtime"
          value={`${overview.totalPlaytime.toFixed(0)}h`}
          color="from-green-500 to-emerald-500"
        />
      </motion.div>

      {/* Top Champions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-400" />
          Top Champions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {championStats.slice(0, 6).map((champ, idx) => (
            <div
              key={champ.championId}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-purple-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-bold">{champ.championName}</h3>
                {champ.masteryLevel && (
                  <span className="text-xs bg-purple-600 px-2 py-1 rounded font-semibold">
                    M{champ.masteryLevel}
                  </span>
                )}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Games:</span>
                  <span className="font-semibold">{champ.games}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Win Rate:</span>
                  <span className="font-semibold">{champ.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">KDA:</span>
                  <span className="font-semibold">{champ.avgKDA.toFixed(2)}</span>
                </div>
                {champ.masteryPoints && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mastery:</span>
                    <span className="font-semibold">{formatMasteryPoints(champ.masteryPoints)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-green-900/30 backdrop-blur-sm rounded-lg p-6 border border-green-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-400" />
            <h2 className="text-2xl font-bold">Strengths</h2>
          </div>
          <ul className="space-y-2">
            {insights.strengths.map((strength, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200">
                <span className="text-green-400 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-orange-900/30 backdrop-blur-sm rounded-lg p-6 border border-orange-500/50"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-orange-400" />
            <h2 className="text-2xl font-bold">Areas to Improve</h2>
          </div>
          <ul className="space-y-2">
            {insights.weaknesses.map((weakness, idx) => (
              <li key={idx} className="flex items-start gap-2 text-slate-200">
                <span className="text-orange-400 mt-1">!</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Coaching Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
      >
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-400" />
          Coaching Tips
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {insights.coachingTips.map((tip, idx) => (
            <div
              key={idx}
              className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-blue-500 transition-colors"
            >
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-bold text-sm mt-0.5">{idx + 1}.</span>
                <p className="text-slate-200 text-sm">{tip}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Roast & Boast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-red-900/30 backdrop-blur-sm rounded-lg p-6 border border-red-500/50"
        >
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-6 h-6 text-red-400" />
            <h2 className="text-2xl font-bold">The Roast</h2>
          </div>
          <p className="text-slate-200 italic">{insights.roast}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-yellow-900/30 backdrop-blur-sm rounded-lg p-6 border border-yellow-500/50"
        >
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-6 h-6 text-yellow-400" />
            <h2 className="text-2xl font-bold">The Boast</h2>
          </div>
          <p className="text-slate-200 italic">{insights.boast}</p>
        </motion.div>
      </div>

      {/* Highlight Matches */}
      {(highlightMatches.bestKDA || highlightMatches.mostKills || highlightMatches.longestGame || highlightMatches.highestDamage) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
        >
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-400" />
            Highlight Matches
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highlightMatches.bestKDA && (
              <HighlightMatch
                title="Best KDA"
                match={highlightMatches.bestKDA}
                stat={calculateKDA(
                  highlightMatches.bestKDA.participant.kills,
                  highlightMatches.bestKDA.participant.deaths,
                  highlightMatches.bestKDA.participant.assists
                ).toFixed(2)}
                icon={<Trophy className="w-5 h-5 text-yellow-400" />}
              />
            )}
            {highlightMatches.mostKills && (
              <HighlightMatch
                title="Most Kills"
                match={highlightMatches.mostKills}
                stat={`${highlightMatches.mostKills.participant.kills} kills`}
                icon={<Target className="w-5 h-5 text-red-400" />}
              />
            )}
            {highlightMatches.longestGame && (
              <HighlightMatch
                title="Longest Game"
                match={highlightMatches.longestGame}
                stat={formatDuration(highlightMatches.longestGame.gameDuration)}
                icon={<Clock className="w-5 h-5 text-blue-400" />}
              />
            )}
            {highlightMatches.highestDamage && (
              <HighlightMatch
                title="Highest Damage"
                match={highlightMatches.highestDamage}
                stat={formatNumber(highlightMatches.highestDamage.participant.totalDamageDealt)}
                icon={<Flame className="w-5 h-5 text-orange-400" />}
              />
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-lg p-4 backdrop-blur-sm`}>
      <div className="flex items-center gap-2 mb-2">{icon}</div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm opacity-90">{label}</div>
    </div>
  );
}

function HighlightMatch({
  title,
  match,
  stat,
  icon,
}: {
  title: string;
  match: any;
  stat: string;
  icon: React.ReactNode;
}) {
  const { participant } = match;
  const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
  
  return (
    <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-400">Champion:</span>
          <span className="font-semibold">{participant.championName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">KDA:</span>
          <span className="font-semibold">{kda}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Result:</span>
          <span className={`font-semibold ${participant.win ? 'text-green-400' : 'text-red-400'}`}>
            {participant.win ? 'Victory' : 'Defeat'}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-slate-600">
          <span className="text-purple-400 font-bold">{stat}</span>
        </div>
      </div>
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
  return points.toString();
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`;
  }
  return num.toString();
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function calculateKDA(kills: number, deaths: number, assists: number): number {
  if (deaths === 0) {
    return kills + assists;
  }
  return (kills + assists) / deaths;
}
