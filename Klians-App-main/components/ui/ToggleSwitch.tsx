import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, checkedIcon, uncheckedIcon }) => {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative inline-flex items-center h-8 w-14 rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900 ${
        checked ? 'bg-red-500' : 'bg-slate-300'
      }`}
    >
      <span
        className={`inline-block h-6 w-6 rounded-full bg-white transform transition-transform duration-300 ease-in-out ${
          checked ? 'translate-x-7' : 'translate-x-1'
        }`}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2">
        <div className={`transition-opacity duration-300 ${checked ? 'opacity-100' : 'opacity-0'}`}>
          {checkedIcon}
        </div>
        <div className={`transition-opacity duration-300 ${!checked ? 'opacity-100' : 'opacity-0'}`}>
          {uncheckedIcon}
        </div>
      </div>
    </button>
  );
};