'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Check } from 'lucide-react';

interface ChestBadgeProps {
  available: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function ChestBadge({ available, size = 'md' }: ChestBadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: 'w-6 h-6',
      icon: 'w-3 h-3',
      checkmark: 'w-2 h-2',
      tooltip: 'text-xs',
    },
    md: {
      container: 'w-8 h-8',
      icon: 'w-4 h-4',
      checkmark: 'w-3 h-3',
      tooltip: 'text-sm',
    },
    lg: {
      container: 'w-10 h-10',
      icon: 'w-5 h-5',
      checkmark: 'w-4 h-4',
      tooltip: 'text-base',
    },
  };

  const config = sizeConfig[size];

  return (
    <div className="relative inline-block">
      <motion.div
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        whileHover={{ scale: 1.1 }}
        className={`${config.container} rounded-lg flex items-center justify-center cursor-help transition-all ${
          available
            ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg shadow-yellow-500/50 animate-pulse'
            : 'bg-slate-600'
        }`}
      >
        {available ? (
          <Package className={`${config.icon} text-white`} />
        ) : (
          <div className="relative">
            <Package className={`${config.icon} text-slate-400`} />
            <div className="absolute -bottom-0.5 -right-0.5 bg-slate-800 rounded-full p-0.5">
              <Check className={`${config.checkmark} text-green-400`} />
            </div>
          </div>
        )}
      </motion.div>

      {/* Tooltip */}
      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className={`absolute z-50 ${
            size === 'sm' ? 'bottom-full mb-1' : 'bottom-full mb-2'
          } left-1/2 transform -translate-x-1/2 whitespace-nowrap`}
        >
          <div className={`bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 shadow-xl ${config.tooltip}`}>
            <div className="font-semibold text-white mb-0.5">
              {available ? 'Chest Available' : 'Chest Earned'}
            </div>
            <div className="text-slate-400">
              {available
                ? 'Play this champion to earn a chest'
                : 'Chest already earned this season'}
            </div>
          </div>
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-slate-700" />
          </div>
        </motion.div>
      )}
    </div>
  );
}
