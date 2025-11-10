'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';

export type RiotRegion =
  | 'na1'
  | 'euw1'
  | 'eun1'
  | 'kr'
  | 'br1'
  | 'la1'
  | 'la2'
  | 'oc1'
  | 'ru'
  | 'tr1'
  | 'jp1';

interface RegionOption {
  code: RiotRegion;
  name: string;
}

const REGIONS: RegionOption[] = [
  { code: 'na1', name: 'North America' },
  { code: 'euw1', name: 'Europe West' },
  { code: 'eun1', name: 'Europe Nordic & East' },
  { code: 'kr', name: 'Korea' },
  { code: 'br1', name: 'Brazil' },
  { code: 'la1', name: 'Latin America North' },
  { code: 'la2', name: 'Latin America South' },
  { code: 'oc1', name: 'Oceania' },
  { code: 'ru', name: 'Russia' },
  { code: 'tr1', name: 'Turkey' },
  { code: 'jp1', name: 'Japan' },
];

const STORAGE_KEY = 'rift-rewind-region';
const DEFAULT_REGION: RiotRegion = 'na1';

interface RegionSelectorProps {
  value?: RiotRegion;
  onChange?: (region: RiotRegion) => void;
  name?: string;
}

export default function RegionSelector({
  value,
  onChange,
  name = 'region',
}: RegionSelectorProps) {
  const [selectedRegion, setSelectedRegion] = useState<RiotRegion>(
    value || DEFAULT_REGION
  );

  // Load region from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !value) {
      const stored = localStorage.getItem(STORAGE_KEY) as RiotRegion | null;
      if (stored && REGIONS.some((r) => r.code === stored)) {
        setSelectedRegion(stored);
      }
    }
  }, [value]);

  // Handle region change
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRegion = e.target.value as RiotRegion;
    setSelectedRegion(newRegion);

    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, newRegion);
    }

    // Call onChange callback if provided
    if (onChange) {
      onChange(newRegion);
    }
  };

  return (
    <div className="relative">
      <label
        htmlFor={name}
        className="block text-sm font-medium text-slate-300 mb-2"
      >
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4" />
          <span>Region</span>
        </div>
      </label>
      <select
        id={name}
        name={name}
        value={selectedRegion}
        onChange={handleChange}
        className="w-full px-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer hover:border-slate-600 transition-colors"
      >
        {REGIONS.map((region) => (
          <option key={region.code} value={region.code}>
            {region.code.toUpperCase()} - {region.name}
          </option>
        ))}
      </select>
    </div>
  );
}
