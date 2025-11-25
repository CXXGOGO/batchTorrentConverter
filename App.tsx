import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import Dropzone from './components/Dropzone';
import ResultsList from './components/ResultsList';
import { parseTorrentToMagnet, TorrentInfo } from './utils/torrentUtils';

export type Language = 'zh' | 'en';

export const translations = {
  zh: {
    appTitle: "磁力转换专业版",
    appSubtitle: "安全的文件解析工具",
    clientSide: "仅客户端本地处理",
    introTitle: "种子文件转磁力链接转换器",
    introDesc: "一个安全、基于浏览器的实用工具，用于从标准 .torrent 文件生成磁力链接。所有处理均在您的设备本地完成；不会将任何文件上传到服务器。",
    dropTitle: "点击上传或拖拽文件至此",
    dropSub: "支持格式：",
    dropActive: "松开鼠标开始转换",
    processing: "正在处理文件...",
    resultsTitle: "转换结果",
    processed: "已处理",
    clearAll: "清空列表",
    copyAll: "一键复制所有链接",
    copy: "复制",
    copied: "已复制",
    hash: "哈希值",
    errors: "处理错误",
    footer: "MagnetConverter Pro. 所有处理均为客户端本地完成。",
    errorPrefix: "解析失败",
    invalidFile: "请上传有效的 .torrent 文件",
    magnetLink: "磁力链接",
    toggleLang: "English",
    successCopyAll: "所有链接已复制到剪贴板",
    failCopy: "复制失败"
  },
  en: {
    appTitle: "MagnetConverter Pro",
    appSubtitle: "Secure File Parsing Utility",
    clientSide: "Client-Side Only Processing",
    introTitle: "Torrent to Magnet Converter",
    introDesc: "A secure, browser-based utility for generating magnet links from standard .torrent files. All processing is performed locally on your device; no files are uploaded to any server.",
    dropTitle: "Click to upload or drag and drop",
    dropSub: "Supported format:",
    dropActive: "Drop files to convert",
    processing: "Processing files...",
    resultsTitle: "Conversion Results",
    processed: "processed",
    clearAll: "Clear All",
    copyAll: "Copy All Links",
    copy: "Copy",
    copied: "Copied",
    hash: "Hash",
    errors: "Processing Errors",
    footer: "MagnetConverter Pro. All processing is client-side.",
    errorPrefix: "Failed to parse",
    invalidFile: "Please upload valid .torrent files.",
    magnetLink: "Magnet Link",
    toggleLang: "中文",
    successCopyAll: "All links copied to clipboard",
    failCopy: "Failed to copy"
  }
};

export type Translation = typeof translations.zh;

function App() {
  const [lang, setLang] = useState<Language>('zh');
  const [results, setResults] = useState<TorrentInfo[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const t = translations[lang];

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsProcessing(true);
    setErrors([]); 
    
    const newResults: TorrentInfo[] = [];
    const newErrors: string[] = [];

    const promises = files.map(async (file) => {
      try {
        const info = await parseTorrentToMagnet(file);
        return { status: 'success', data: info, fileName: file.name } as const;
      } catch (err: any) {
        return { status: 'error', error: err.message, fileName: file.name } as const;
      }
    });

    const outcomes = await Promise.all(promises);

    outcomes.forEach(outcome => {
      if (outcome.status === 'success') {
        newResults.push(outcome.data);
      } else {
        newErrors.push(`${t.errorPrefix} ${outcome.fileName}: ${outcome.error}`);
      }
    });

    setResults(prev => [...newResults, ...prev]);
    setErrors(prev => [...newErrors, ...prev]);
    setIsProcessing(false);
  }, [t]);

  const handleClear = useCallback(() => {
    setResults([]);
    setErrors([]);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLang(prev => prev === 'zh' ? 'en' : 'zh');
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header 
        t={t} 
        lang={lang} 
        onToggleLang={toggleLanguage} 
      />

      <main className="flex-grow w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro / Instruction Section */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-bold text-slate-800 mb-3">
            {t.introTitle}
          </h2>
          <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.introDesc}
          </p>
        </div>

        {/* Uploader Card */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
          <div className="p-6 sm:p-8">
            <Dropzone 
              onFilesSelected={handleFilesSelected} 
              isProcessing={isProcessing} 
              t={t}
            />
            
            {isProcessing && (
              <div className="mt-4 flex items-center justify-center text-sm text-gov-blue animate-pulse">
                <div className="w-2 h-2 bg-gov-blue rounded-full mr-2 animate-bounce"></div>
                <div className="w-2 h-2 bg-gov-blue rounded-full mr-2 animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gov-blue rounded-full mr-2 animate-bounce delay-150"></div>
                {t.processing}
              </div>
            )}
          </div>
        </div>

        {/* Results Section */}
        <ResultsList 
          results={results} 
          errors={errors} 
          onClear={handleClear} 
          t={t}
        />
        
      </main>

      <footer className="bg-slate-100 border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-500 text-sm">
          <p>&copy; {new Date().getFullYear()} {t.footer}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;