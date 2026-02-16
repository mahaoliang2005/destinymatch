
import React from 'react';
import { HistoryRecord } from '../types';

interface RecordsProps {
  history: HistoryRecord[];
  onBack: () => void;
}

const Records: React.FC<RecordsProps> = ({ history, onBack }) => {
  return (
    <div className="bg-background-dark text-slate-100 font-display min-h-screen transition-colors duration-300">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-purple/20 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary-purple/10 rounded-full blur-[100px] opacity-30"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-50 py-6 backdrop-blur-md bg-background-dark/80 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button 
                onClick={onBack}
                className="group flex items-center gap-2 px-4 py-2 rounded-full bg-surface-dark border border-white/10 hover:border-primary-purple/50 transition-all shadow-sm"
              >
                <span className="material-symbols-rounded text-gray-400 group-hover:text-primary-purple">arrow_back</span>
                <span className="text-sm font-medium text-gray-300 group-hover:text-primary-purple hidden sm:inline">Home</span>
              </button>
              <div className="flex items-center gap-2">
                <span className="material-symbols-rounded text-primary-purple text-2xl">auto_awesome</span>
                <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary-purple to-purple-400">Destiny Match</h1>
              </div>
            </div>
            <h2 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg font-semibold tracking-wide hidden md:block">
              命运记录 <span className="text-xs font-normal text-gray-400 ml-1 opacity-75">Destiny Records</span>
            </h2>
          </div>
        </header>

        <main className="flex-grow py-8">
          <div className="flex flex-wrap gap-3 mb-8">
            <button className="px-5 py-2 rounded-full bg-primary-purple text-white text-sm font-medium shadow-lg shadow-primary-purple/25 border border-primary-purple">全部 (All)</button>
            <button className="px-5 py-2 rounded-full bg-surface-dark text-gray-300 text-sm font-medium border border-white/5">高匹配度 (High Match)</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.map((record) => (
              <div key={record.id} className="group relative rounded-lg overflow-hidden bg-surface-dark border border-white/5 transition-all duration-500 hover:-translate-y-1">
                <div className="aspect-[3/4] relative overflow-hidden">
                  <img
                    src={record.partnerImageBase64 || record.userImageBase64}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt="生成的伴侣"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-transparent to-transparent opacity-80"></div>
                  <div className="absolute top-4 right-4 bg-background-dark/80 backdrop-blur-md px-3 py-1 rounded-full border border-primary-purple/30 flex items-center gap-1">
                    <span className="text-gold text-sm font-bold">{record.score}%</span>
                    <span className="material-symbols-rounded text-gold text-xs">favorite</span>
                  </div>
                  {/* 风格标签 */}
                  <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md px-2 py-1 rounded-full text-xs text-white">
                    {record.vibe === 'gentle' ? '温柔型' :
                      record.vibe === 'sunny' ? '阳光型' :
                      record.vibe === 'intellectual' ? '知性型' : '神秘型'}
                  </div>
                </div>
                <div className="p-5 relative text-left">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display font-semibold text-lg text-white">{record.partnerType}</h3>
                      <p className="text-xs text-primary-purple font-medium tracking-wide">{new Date(record.timestamp).toLocaleDateString()}</p>
                    </div>
                    <span className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md">
                      {record.score >= 91 ? '命中注定' :
                        record.score >= 81 ? '天作之合' :
                        record.score >= 71 ? '情投意合' : '有缘相识'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4">
                    {record.interpretation}
                  </p>
                </div>
              </div>
            ))}

            {history.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-60">
                <span className="material-symbols-rounded text-6xl text-primary-purple/50">menu_book</span>
                <h3 className="text-xl font-medium mt-4">您的命运之书尚待开启...</h3>
                <p className="text-sm">Your book of destiny is yet to be opened...</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Records;
