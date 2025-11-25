import React, { useState } from 'react';
import { Copy, Check, Magnet, AlertCircle, CopyCheck } from 'lucide-react';
import { TorrentInfo } from '../utils/torrentUtils';
import { Translation } from '../App';

interface ResultItemProps {
  info: TorrentInfo;
  t: Translation;
}

const ResultItem: React.FC<ResultItemProps> = ({ info, t }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(info.magnetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <Magnet className="w-4 h-4 text-gov-blue flex-shrink-0" />
            <h3 className="text-sm font-semibold text-gray-900 truncate font-serif">
              {info.name}
            </h3>
          </div>
          <div className="bg-gray-50 rounded border border-gray-100 p-2 mt-2">
             <p className="text-xs text-gray-500 font-mono break-all line-clamp-2">
                {info.magnetLink}
             </p>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 font-mono uppercase">
            {t.hash}: {info.infoHash.substring(0, 8)}...
          </p>
        </div>

        <button
          onClick={handleCopy}
          className={`
            flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 min-w-[100px] h-10
            ${copied 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-gov-blue text-white hover:bg-blue-800'
            }
          `}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2" />
              {t.copied}
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 mr-2" />
              {t.copy}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface ResultsListProps {
  results: TorrentInfo[];
  errors: string[];
  onClear: () => void;
  t: Translation;
}

const ResultsList: React.FC<ResultsListProps> = ({ results, errors, onClear, t }) => {
  const [allCopied, setAllCopied] = useState(false);

  if (results.length === 0 && errors.length === 0) return null;

  const handleCopyAll = async () => {
    if (results.length === 0) return;
    const allLinks = results.map(r => r.magnetLink).join('\n');
    try {
      await navigator.clipboard.writeText(allLinks);
      setAllCopied(true);
      setTimeout(() => setAllCopied(false), 2000);
    } catch (e) {
      console.error(e);
      alert(t.failCopy);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-gray-200 pb-4 gap-4">
        <h2 className="text-lg font-serif font-bold text-gray-800">
          {t.resultsTitle} <span className="text-gray-400 font-normal text-sm ml-2">({results.length} {t.processed})</span>
        </h2>
        
        <div className="flex items-center space-x-3">
            {results.length > 0 && (
                <button
                    onClick={handleCopyAll}
                    className={`
                        flex items-center text-sm font-medium px-3 py-1.5 rounded-md border transition-colors
                        ${allCopied 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'text-gov-blue border-blue-200 hover:bg-blue-50'
                        }
                    `}
                >
                    {allCopied ? <Check className="w-4 h-4 mr-2" /> : <CopyCheck className="w-4 h-4 mr-2" />}
                    {allCopied ? t.copied : t.copyAll}
                </button>
            )}
            <button 
              onClick={onClear}
              className="text-sm text-gray-500 hover:text-red-600 transition-colors px-2"
            >
              {t.clearAll}
            </button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-md">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-800">{t.errors}</h3>
              <ul className="mt-1 list-disc list-inside text-sm text-red-700">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {results.map((result, index) => (
          <ResultItem key={`${result.infoHash}-${index}`} info={result} t={t} />
        ))}
      </div>
    </div>
  );
};

export default ResultsList;