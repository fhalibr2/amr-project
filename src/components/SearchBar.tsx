import React from 'react';
import { Search, X, Volume2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  didYouMean?: string;
  onApplySuggestion?: (suggestion: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  didYouMean,
  onApplySuggestion,
}) => {
  return (
    <div className="w-full space-y-2">
      <div className="relative flex items-center bg-slate-100 hover:bg-slate-100/80 focus-within:bg-white transition-all rounded-2xl border border-slate-200 focus-within:border-rose-500 focus-within:ring-4 focus-within:ring-rose-500/10 h-12 px-4 shadow-inner">
        <Search className="text-slate-400 shrink-0 w-5 h-5" />

        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="O que você procura hoje?"
          className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 font-medium px-3 text-sm"
        />

        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 shrink-0 transition"
            aria-label="Limpar busca"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Typo Correction Suggestion Banner */}
      {didYouMean && onApplySuggestion && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-3.5 py-2 rounded-xl text-xs flex items-center justify-between animate-fadeIn shadow-xs">
          <div className="flex items-center gap-1.5 font-medium">
            <Volume2 className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Você quis dizer: <strong className="underline text-rose-700 font-bold">{didYouMean}</strong>?
            </span>
          </div>
          <button
            onClick={() => onApplySuggestion(didYouMean)}
            className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition shrink-0 ml-2"
          >
            Buscar {didYouMean}
          </button>
        </div>
      )}
    </div>
  );
};
