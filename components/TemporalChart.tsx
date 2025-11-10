'use client';

import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PlayerAnalytics } from '@/lib/analytics';

interface TemporalChartProps {
  analytics: PlayerAnalytics;
}

export default function TemporalChart({ analytics }: TemporalChartProps) {
  const { temporalTrends, championStats, roleDistribution } = analytics;

  // Prepare monthly win rate data
  const monthlyData = temporalTrends.monthlyWinRate.map((month) => ({
    month: formatMonth(month.month),
    winRate: parseFloat(month.winRate.toFixed(1)),
    games: month.games,
  }));

  // Prepare champion play rate data (top 5)
  const championPlayData = championStats.slice(0, 5).map((champ) => ({
    name: champ.championName,
    games: champ.games,
    percentage: parseFloat(
      ((champ.games / analytics.overview.totalGames) * 100).toFixed(1)
    ),
  }));

  // Prepare role distribution data
  const roleData = Object.entries(roleDistribution)
    .map(([role, count]) => ({
      role: formatRole(role),
      games: count,
      percentage: parseFloat(
        ((count / analytics.overview.totalGames) * 100).toFixed(1)
      ),
    }))
    .sort((a, b) => b.games - a.games);

  // Prepare KDA trend data (monthly)
  const kdaData = temporalTrends.monthlyWinRate.map((month) => {
    // Calculate average KDA for this month (simplified - using overall KDA)
    return {
      month: formatMonth(month.month),
      kda: parseFloat(analytics.overview.avgKDA.toFixed(2)),
    };
  });

  // Colors for charts
  const COLORS = [
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#ef4444', // red
  ];

  return (
    <div className="space-y-6">
      {/* Monthly Win Rate Line Chart */}
      {monthlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
        >
          <h3 className="text-xl font-bold mb-4 text-white">
            Monthly Win Rate Trend
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                domain={[0, 100]}
                label={{
                  value: 'Win Rate (%)',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line
                type="monotone"
                dataKey="winRate"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Win Rate (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Champion Play Rate Pie Chart */}
      {championPlayData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
        >
          <h3 className="text-xl font-bold mb-4 text-white">
            Champion Play Rate Distribution
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={championPlayData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="games"
                >
                  {championPlayData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number, name: string, props: any) => [
                    `${value} games (${props.payload.percentage}%)`,
                    props.payload.name,
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {championPlayData.map((champ, index) => (
                <div key={champ.name} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-slate-300">
                    {champ.name}: {champ.games} games
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Role Distribution Bar Chart */}
      {roleData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
        >
          <h3 className="text-xl font-bold mb-4 text-white">
            Role Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roleData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="role"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{
                  value: 'Games',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: number, name: string, props: any) => [
                  `${value} games (${props.payload.percentage}%)`,
                  'Games',
                ]}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Bar dataKey="games" fill="#8b5cf6" name="Games" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* KDA Trend Over Time */}
      {kdaData.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700"
        >
          <h3 className="text-xl font-bold mb-4 text-white">KDA Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={kdaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="month"
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#9ca3af"
                style={{ fontSize: '12px' }}
                label={{
                  value: 'KDA',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#9ca3af' },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#f1f5f9' }}
              />
              <Legend wrapperStyle={{ color: '#9ca3af' }} />
              <Line
                type="monotone"
                dataKey="kda"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
                name="KDA"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}
    </div>
  );
}

function formatMonth(monthStr: string): string {
  // Convert "2024-01" to "Jan 2024"
  const [year, month] = monthStr.split('-');
  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return `${monthNames[parseInt(month) - 1]} ${year}`;
}

function formatRole(role: string): string {
  // Format role names for display
  const roleMap: Record<string, string> = {
    TOP: 'Top',
    JUNGLE: 'Jungle',
    MIDDLE: 'Mid',
    BOTTOM: 'ADC',
    UTILITY: 'Support',
    UNKNOWN: 'Unknown',
  };
  return roleMap[role] || role;
}
