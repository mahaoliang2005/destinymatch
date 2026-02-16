
import React, { useState } from 'react';
import { AnalysisResult, PartnerVibe } from '../types';

interface ResultProps {
  result: AnalysisResult;
  userImage: string;
  vibe: PartnerVibe;
  onRestart: () => void;
}

const vibeNames: Record<PartnerVibe, string> = {
  gentle: '温柔型',
  sunny: '阳光型',
  intellectual: '知性型',
  mysterious: '神秘型'
};

const Result: React.FC<ResultProps> = ({ result, userImage, vibe, onRestart }) => {
  const [showShare, setShowShare] = useState(false);
  const [showUserPhoto, setShowUserPhoto] = useState(false);

  return (
    <div className="bg-background-dark font-display text-white min-h-screen selection:bg-primary selection:text-white flex flex-col relative">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen opacity-40"></div>
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] mix-blend-screen opacity-30"></div>
      </div>

      <main className="relative z-10 flex-grow flex flex-col items-center justify-center py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <header className="absolute top-6 left-6 md:left-12 flex items-center gap-2 opacity-80 cursor-pointer" onClick={onRestart}>
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
            <span className="material-icons-round text-sm">favorite</span>
          </div>
          <span className="font-bold tracking-tight text-lg">Destiny Match</span>
        </header>

        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center mt-12 lg:mt-0">
          <div className="flex flex-col items-center relative group">
            <div className="absolute inset-0 border border-primary/20 rounded-full scale-105 transform translate-y-4"></div>
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl shadow-primary/20 border-4 border-surface-dark ring-2 ring-primary/30">
              <img
                src={showUserPhoto ? userImage : (result.partnerImageBase64 || userImage)}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                alt={showUserPhoto ? "你的照片" : "未来伴侣"}
              />
              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/10 flex items-center gap-1">
                <span className="material-icons-round text-base text-pink-300">spa</span>
                {showUserPhoto ? '你的照片' : result.partnerType}
              </div>
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background-dark/90 to-transparent"></div>

              {/* 照片切换按钮 */}
              {result.partnerImageBase64 && (
                <button
                  onClick={() => setShowUserPhoto(!showUserPhoto)}
                  className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md hover:bg-black/70 text-white px-3 py-2 rounded-full text-xs font-medium border border-white/20 flex items-center gap-1.5 transition-colors"
                >
                  <span className="material-icons-round text-sm">{showUserPhoto ? 'face' : 'person'}</span>
                  {showUserPhoto ? '看结果' : '看原图'}
                </button>
              )}
            </div>
            <div className="absolute -bottom-8 glass-panel p-6 rounded-3xl shadow-xl flex flex-col items-center max-w-[280px] w-full transform transition-transform hover:-translate-y-1">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-1">Compatibility</div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-extrabold text-primary drop-shadow-[0_0_15px_rgba(230,25,93,0.5)]">{result.score}</span>
                <span className="text-2xl font-bold text-primary/80">%</span>
              </div>
              <div className="mt-2 px-4 py-1.5 bg-gradient-to-r from-primary/10 via-primary/20 to-primary/10 rounded-full border border-primary/20">
                <span className="text-sm font-bold text-gold tracking-wider flex items-center gap-2">
                  <span className="text-[10px]">★</span>
                  {result.score >= 91 ? '命中注定' :
                    result.score >= 81 ? '天作之合' :
                    result.score >= 71 ? '情投意合' : '有缘相识'}
                  <span className="text-[10px]">★</span>
                </span>
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-0 flex flex-col gap-6 w-full">
            <div className="glass-panel p-8 rounded-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <span className="material-icons-round text-8xl text-primary">auto_awesome</span>
              </div>
              <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-4">
                <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-icons-round text-lg">history_edu</span>
                </span>
                Destiny Interpretation (缘分解读)
              </h2>
              <p className="text-slate-300 leading-relaxed text-lg font-light">
                {result.interpretation}
              </p>
            </div>

            <div className="glass-panel p-8 rounded-xl">
              <h2 className="flex items-center gap-3 text-xl font-bold text-white mb-6">
                <span className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
                  <span className="material-icons-round text-lg">psychology</span>
                </span>
                Personality Compatibility (性格互补分析)
              </h2>
              <div className="space-y-5">
                {[
                  { label: "Emotional Resonance", value: result.emotionalResonance, color: "gold" },
                  { label: "Communication Style", value: result.communicationStyle, color: "primary" },
                  { label: "Core Values", value: result.coreValues, color: "indigo-400" }
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4 text-left">
                    <div className={`mt-1 w-2 h-2 rounded-full bg-${item.color}`}></div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base mb-1">{item.label}</h3>
                      <p className="text-slate-400 text-sm">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4">
        <div className="bg-[#2D1A20]/90 backdrop-blur-xl border border-white/10 p-2 pr-3 rounded-full shadow-2xl flex items-center gap-2 max-w-full overflow-x-auto no-scrollbar">
          <button 
            onClick={onRestart}
            className="flex items-center gap-2 px-5 py-3 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
          >
            <span className="material-icons-round text-xl">restart_alt</span>
            <span className="font-medium">Test Again</span>
          </button>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button 
            onClick={() => setShowShare(true)}
            className="ml-2 flex items-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg transition-all transform hover:scale-105 active:scale-95 whitespace-nowrap"
          >
            <span className="material-icons-round text-xl">share</span>
            <span className="font-bold">Share</span>
          </button>
        </div>
      </div>

      {showShare && (
        <div className="fixed inset-0 z-[60] bg-background-dark/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#1a0d10] border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
            <div className="relative z-10 pt-8 pb-4 text-center">
              <h2 className="text-2xl font-bold">Share Your Destiny</h2>
              <p className="text-white/40 text-sm mt-1">Let the stars align for your friends too</p>
            </div>
            <div className="relative z-10 px-8 py-4 flex justify-center">
              <div className="animate-float relative bg-gradient-to-b from-white/10 to-white/5 border border-white/20 p-4 rounded-xl w-64 aspect-[3/4] flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mt-2 mb-3">
                  <div className="relative w-16 h-16">
                    <img src={userImage} className="w-full h-full object-cover rounded-full border-2 border-primary/50" alt="User" />
                  </div>
                  <span className="text-2xl text-primary">+</span>
                  <div className="relative w-16 h-16">
                    <img
                      src={result.partnerImageBase64 || userImage}
                      className="w-full h-full object-cover rounded-full border-2 border-primary"
                      alt="Partner"
                    />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-primary">{result.score}%</div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Soul Match</div>
                  <div className="text-xs text-white/70 mt-1">{vibeNames[vibe]} · {result.partnerType}</div>
                </div>
                <div className="w-full h-px bg-white/20 my-2"></div>
                <div className="flex-1 flex flex-col justify-end items-center">
                  <div className="bg-white p-1 rounded-lg mb-2">
                    <div className="w-16 h-16 bg-black flex items-center justify-center text-[8px] text-white">QR CODE</div>
                  </div>
                  <p className="text-[9px] text-white/40">Scan to find your love</p>
                </div>
              </div>
            </div>
            <div className="relative z-10 px-8 py-6 flex justify-between">
              {['chat', 'camera_aperture', 'visibility', 'cruelty_free'].map(icon => (
                <button key={icon} className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10">
                  <span className="material-icons text-white">{icon}</span>
                </button>
              ))}
            </div>
            <div className="relative z-10 px-8 pb-8 pt-2">
              <button onClick={() => setShowShare(false)} className="w-full text-white/40 hover:text-white py-3 text-sm font-medium">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Result;
