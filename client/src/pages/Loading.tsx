
import React, { useState, useEffect } from 'react';

// 随机提示语
const loadingMessages = [
  { zh: '正在翻阅月老的红线簿...', en: 'Flipping through the book of destiny...' },
  { zh: '星辰正在为你排列...', en: 'The stars are aligning for you...' },
  { zh: '命运之轮开始转动...', en: 'The wheel of fortune is turning...' },
  { zh: '月老正在系红线...', en: 'The matchmaker is tying your red string...' },
  { zh: '前世今生的画面正在浮现...', en: 'Visions of past and present lives...' },
  { zh: 'TA 的轮廓正在显现...', en: "The outline of your destined partner appears..." },
  { zh: '缘分正在穿越时空...', en: 'Destiny travels across time and space...' },
  { zh: '命中注定的那颗星正在闪耀...', en: 'Your destined star is shining bright...' }
];

const Loading: React.FC = () => {
  const [progress, setProgress] = useState(0);
  const [seconds, setSeconds] = useState(25);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    // 进度条：25秒内从0到100
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 0.4; // 25秒完成
      });
    }, 100);

    // 倒计时
    const countdown = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) return 1;
        return prev - 1;
      });
    }, 1000);

    // 切换提示语
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(countdown);
      clearInterval(messageTimer);
    };
  }, []);

  return (
    <div className="bg-background-dark text-white h-screen overflow-hidden flex flex-col relative transition-colors duration-300">
      <div className="absolute inset-0 z-0 bg-background-dark overflow-hidden">
        <div className="stars-bg absolute inset-0 opacity-40"></div>
      </div>

      <header className="relative z-10 p-8 w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center text-white font-bold text-xs shadow-lg">DM</div>
          <span className="text-white/90 font-bold tracking-tight text-lg">Destiny Match</span>
        </div>
        <div className="text-xs font-medium text-white/40 bg-white/5 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm">
          AI Destiny Core v2.4
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto px-6 pb-20">
        <div className="mb-12 flex flex-col items-center animate-pulse">
          <span className="text-primary font-medium tracking-widest text-sm uppercase mb-2">Step 3 of 3</span>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary/30"></div>
            <div className="w-2 h-2 rounded-full bg-primary/30"></div>
            <div className="w-8 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(230,25,93,0.5)]"></div>
          </div>
        </div>

        <div className="relative mb-16 animate-float">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] border border-primary/20 rounded-full animate-pulse"></div>
          <div className="relative w-[280px] h-[280px] rounded-full flex items-center justify-center overflow-hidden glass-panel">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent"></div>
            <span className="material-icons text-6xl text-white/80 drop-shadow-xl animate-spin-slow">auto_awesome</span>
          </div>
        </div>

        <div className="w-full max-w-md flex flex-col items-center gap-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight transition-all duration-500">
            {loadingMessages[messageIndex].zh}
          </h2>
          <p className="text-white/50 text-sm font-light transition-all duration-500">
            {loadingMessages[messageIndex].en}
          </p>
          
          <div className="w-full relative pt-4">
            <div className="flex justify-between text-xs font-medium text-white/60 mb-2 px-1">
              <span>Processing Data</span>
              <span className="text-primary">{Math.min(progress, 100)}%</span>
            </div>
            <div className="h-3 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-primary/60 via-primary to-primary rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-white/40 text-sm bg-background-dark/30 px-4 py-2 rounded-full border border-white/5">
            <span className="material-icons text-base animate-spin">hourglass_empty</span>
            <span>预计还需 <span className="text-white font-mono font-medium">{seconds}</span> 秒</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Loading;
