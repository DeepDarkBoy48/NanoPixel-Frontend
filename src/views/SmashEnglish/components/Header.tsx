
import React from 'react';
import { Sparkles, Book, PenTool, Home } from 'lucide-react';

interface HeaderProps {
  activeTab: 'analyzer' | 'dictionary' | 'writing';
  onNavigate: (tab: 'analyzer' | 'dictionary' | 'writing') => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onNavigate }) => {
  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-10">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => onNavigate('analyzer')}
        >
          <div className="w-8 h-8 bg-gradient-to-tr from-pink-500 to-rose-400 rounded-lg flex items-center justify-center text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 hidden md:block">GrammaViz</span>
          <span className="font-bold text-xl tracking-tight text-slate-800 md:hidden">GV</span>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <nav className="flex gap-1 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => onNavigate('analyzer')}
              className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'analyzer'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Sparkles className="w-4 h-4 hidden sm:block" />
              句法
            </button>
            <button
              onClick={() => onNavigate('dictionary')}
              className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'dictionary'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <Book className="w-4 h-4 hidden sm:block" />
              词典
            </button>
            <button
              onClick={() => onNavigate('writing')}
              className={`px-3 md:px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === 'writing'
                ? 'bg-white text-pink-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
                }`}
            >
              <PenTool className="w-4 h-4 hidden sm:block" />
              写作
            </button>
          </nav>

        </div>

        {/* Back to Home Button */}
        <button
          onClick={() => window.location.href = '/login'}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-lg text-sm font-medium hover:from-pink-600 hover:to-rose-500 transition-all shadow-sm hover:shadow-md"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">返回主页</span>
        </button>

      </div>
    </header>
  );
};
