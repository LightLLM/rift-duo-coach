'use client';

import { useState, useTransition } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  Sparkles,
  AlertCircle,
  Share2,
  X,
} from 'lucide-react';
import type { RecapResponse } from '@/lib/types';
import type { RiotRegion } from '@/lib/riot-api';
import RegionSelector from './RegionSelector';
import RecapCard from './RecapCard';
import ShareableCard from './ShareableCard';

interface RiftRewindProps {
  action: (formData: FormData) => Promise<RecapResponse>;
}

export default function RiftRewind({ action }: RiftRewindProps) {
  const [recapData, setRecapData] = useState<RecapResponse | null>(null);
  const [riotId, setRiotId] = useState<string>('');
  const [region, setRegion] = useState<RiotRegion>('na1');
  const [isPending, startTransition] = useTransition();
  const [showShareModal, setShowShareModal] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('riotId', riotId);
    formData.set('region', region);
    
    setProgress('Fetching account data...');
    startTransition(async () => {
      try {
        setProgress('Loading match history...');
        const response = await action(formData);
        setRecapData(response);
        setProgress('');
      } catch (error) {
        console.error('Error generating recap:', error);
        setRecapData({
          success: false,
          data: null,
          error: 'An unexpected error occurred. Please try again.',
        });
        setProgress('');
      }
    });
  };

  const hasData = recapData?.success && recapData.data;
  const hasError = recapData && !recapData.success;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            Rift Rewind
          </h1>
          <p className="text-slate-300 text-lg">
            Your personalized League of Legends year-end recap
          </p>
        </motion.div>

        {/* Input Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="mb-8 max-w-2xl mx-auto"
        >
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-6 border border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label
                  htmlFor="riotId"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Riot ID
                </label>
                <input
                  id="riotId"
                  type="text"
                  value={riotId}
                  onChange={(e) => setRiotId(e.target.value)}
                  placeholder="PlayerName#NA1"
                  className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  disabled={isPending}
                />
              </div>
              <RegionSelector
                value={region}
                onChange={setRegion}
                name="region"
              />
            </div>
            <button
              type="submit"
              disabled={isPending || !riotId.trim()}
              className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all flex items-center justify-center gap-2"
            >
              {isPending ? (
                <>
                  <RotateCcw className="w-5 h-5 animate-spin" />
                  Generating Recap...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate My Recap
                </>
              )}
            </button>
          </div>
        </motion.form>

        {/* Loading State */}
        <AnimatePresence>
          {isPending && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-8 border border-slate-700">
                <div className="flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                    <Sparkles className="w-8 h-8 text-purple-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div className="text-center">
                    <p className="text-xl font-semibold text-white mb-2">
                      Generating Your Recap
                    </p>
                    {progress && (
                      <p className="text-sm text-slate-400 animate-pulse">
                        {progress}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-2">
                      This may take 20-45 seconds...
                    </p>
                  </div>
                  {/* Skeleton UI */}
                  <div className="w-full max-w-2xl space-y-3 mt-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 bg-slate-700/30 rounded-lg animate-pulse"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {hasError && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <div className="bg-red-900/30 backdrop-blur-sm rounded-lg p-6 border border-red-500/50">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">
                      Oops! Something went wrong
                    </h3>
                    <p className="text-slate-200 mb-4">{recapData.error}</p>
                    <button
                      onClick={() => setRecapData(null)}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {!hasData && !hasError && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">
              Ready to see your year in review?
            </h2>
            <p className="text-slate-400 max-w-md mx-auto">
              Enter your Riot ID above to generate your personalized League of
              Legends recap with AI-powered insights and coaching tips.
            </p>
          </motion.div>
        )}

        {/* Recap Data Display */}
        <AnimatePresence>
          {hasData && recapData.data && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Share Button */}
              <div className="flex justify-end mb-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowShareModal(true)}
                  className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold transition-all flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share Your Recap
                </motion.button>
              </div>

              {/* Recap Card */}
              <RecapCard
                analytics={recapData.data.analytics}
                insights={recapData.data.insights}
                riotId={recapData.data.account.riotId}
                region={recapData.data.account.region}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Share Modal */}
        <AnimatePresence>
          {showShareModal && hasData && recapData.data && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowShareModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-700"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-white">
                    Share Your Recap
                  </h2>
                  <button
                    onClick={() => setShowShareModal(false)}
                    className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                <ShareableCard
                  analytics={recapData.data.analytics}
                  insights={recapData.data.insights}
                  riotId={recapData.data.account.riotId}
                  region={recapData.data.account.region}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

