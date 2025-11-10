'use client';

import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Copy, Share2, Sparkles, Trophy } from 'lucide-react';
import { toPng } from 'html-to-image';
import type { PlayerAnalytics } from '@/lib/analytics';
import type { AIInsights } from '@/lib/aws-bedrock';

interface ShareableCardProps {
  analytics: PlayerAnalytics;
  insights: AIInsights;
  riotId: string;
  region: string;
}

export default function ShareableCard({
  analytics,
  insights,
  riotId,
  region,
}: ShareableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const { overview, championStats } = analytics;
  const topChampion = championStats[0];

  // Export card as PNG
  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsExporting(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#0f172a',
      });

      const link = document.createElement('a');
      link.download = `rift-rewind-${riotId.replace('#', '-')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Failed to export image:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy quote to clipboard
  const handleCopyQuote = async () => {
    try {
      await navigator.clipboard.writeText(insights.shareableQuote);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex gap-2 justify-end">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleCopyQuote}
          className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors flex items-center gap-2"
        >
          {copySuccess ? (
            <>
              <span className="text-green-400">✓</span>
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Quote
            </>
          )}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDownload}
          disabled={isExporting}
          className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold transition-all flex items-center gap-2"
        >
          {isExporting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Card
            </>
          )}
        </motion.button>
      </div>

      {/* Shareable Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        ref={cardRef}
        className="relative w-full max-w-2xl mx-auto aspect-[1.91/1] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl overflow-hidden shadow-2xl"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col justify-between p-8">
          {/* Header */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Rift Rewind 2025
              </h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-2xl font-bold text-white">{riotId}</div>
              <div className="px-3 py-1 bg-slate-800/80 rounded-full text-sm text-slate-300">
                {region.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Total Games</div>
              <div className="text-3xl font-bold text-white">{overview.totalGames}</div>
            </div>
            
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Win Rate</div>
              <div className="text-3xl font-bold text-white">{overview.winRate.toFixed(1)}%</div>
            </div>
            
            <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-4 border border-slate-700">
              <div className="text-slate-400 text-sm mb-1">Avg KDA</div>
              <div className="text-3xl font-bold text-white">{overview.avgKDA.toFixed(2)}</div>
            </div>
          </div>

          {/* Top Champion */}
          {topChampion && (
            <div className="bg-gradient-to-r from-purple-800/60 to-pink-800/60 backdrop-blur-sm rounded-xl p-4 border border-purple-500/50">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 text-yellow-400" />
                <div className="flex-1">
                  <div className="text-slate-300 text-sm">Most Played Champion</div>
                  <div className="text-2xl font-bold text-white">{topChampion.championName}</div>
                </div>
                <div className="text-right">
                  <div className="text-slate-300 text-sm">{topChampion.games} games</div>
                  <div className="text-lg font-bold text-white">{topChampion.winRate.toFixed(1)}% WR</div>
                </div>
              </div>
            </div>
          )}

          {/* Quote */}
          <div className="bg-slate-800/60 backdrop-blur-sm rounded-xl p-6 border border-slate-700">
            <div className="flex items-start gap-3">
              <div className="text-4xl text-purple-400 leading-none">"</div>
              <p className="text-lg text-white italic flex-1 pt-1">
                {insights.shareableQuote}
              </p>
              <div className="text-4xl text-purple-400 leading-none self-end">"</div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">Share your Rift Rewind</span>
            </div>
            <div className="text-sm text-slate-500">
              riftrewind.gg
            </div>
          </div>
        </div>
      </motion.div>

      {/* Instructions */}
      <div className="text-center text-sm text-slate-400">
        <p>Download and share your recap on social media!</p>
      </div>
    </div>
  );
}
