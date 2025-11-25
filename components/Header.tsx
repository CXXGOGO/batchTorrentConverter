import React from 'react';
import { ShieldCheck, FileDigit, Languages } from 'lucide-react';
import { Translation, Language } from '../App';

interface HeaderProps {
  t: Translation;
  lang: Language;
  onToggleLang: () => void;
}

const Header: React.FC<HeaderProps> = ({ t, lang, onToggleLang }) => {
  return (
    <header className="gov-header text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/10 rounded-lg">
            <FileDigit className="w-8 h-8 text-blue-100" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-wide">{t.appTitle}</h1>
            <p className="text-xs text-blue-200 font-sans tracking-wider uppercase">{t.appSubtitle}</p>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 text-sm text-blue-100">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.clientSide}</span>
          </div>
          <button 
            onClick={onToggleLang}
            className="flex items-center space-x-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium border border-white/20"
          >
            <Languages className="w-4 h-4" />
            <span>{t.toggleLang}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;