import React from 'react';
import { Globe } from 'lucide-react';

interface TimezoneSelectorProps {
  selectedTimezone: string;
  onTimezoneChange: (timezone: string) => void;
}

const TIMEZONES = [
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Nova York (EDT)' },
  { value: 'Europe/London', label: 'Londres (BST)' },
  { value: 'Asia/Tokyo', label: 'Tóquio (JST)' },
];

const TimezoneSelector: React.FC<TimezoneSelectorProps> = ({ selectedTimezone, onTimezoneChange }) => {
  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-slate-400" />
      <select
        value={selectedTimezone}
        onChange={(e) => onTimezoneChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {TIMEZONES.map(tz => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default TimezoneSelector;
