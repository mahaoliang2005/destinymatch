
import React from 'react';

interface HomeProps {
  onStart: () => void;
  onGoToRecords: () => void;
}

const Home: React.FC<HomeProps> = ({ onStart, onGoToRecords }) => {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      {/* Background Orbs */}
      <div className="stars-bg absolute inset-0 z-0 opacity-40"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation */}
      <nav className="relative z-10 w-full px-6 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-icons text-sm">favorite</span>
          </div>
          <span className="font-bold text-lg tracking-tight">Destiny Match</span>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={onGoToRecords}
            className="px-5 py-2 rounded-full text-sm font-medium border border-primary/30 text-primary hover:bg-primary hover:text-white transition-all duration-300"
          >
            Destiny Records
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex flex-col justify-center items-center text-center px-4 py-12 md:py-20">
        <div className="mb-8 animate-float">
          <div className="relative w-24 h-24 md:w-32 md:h-32 mx-auto">
            <div className="absolute inset-0 bg-primary rounded-full blur-2xl opacity-40 animate-pulse-slow"></div>
            <img
              alt="Mystical Sphere"
              className="relative w-full h-full rounded-full object-cover border-2 border-primary/50 shadow-[0_0_30px_rgba(230,25,93,0.3)]"
              src="https://picsum.photos/seed/destiny/400/400"
            />
            <div className="absolute -inset-4 border border-primary/20 rounded-full animate-spin [animation-duration:10s]"></div>
          </div>
        </div>

        <div className="space-y-6 max-w-4xl mx-auto">
          <h2 className="text-primary font-medium tracking-[0.2em] text-sm uppercase">AI-Powered Romance Discovery</h2>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            <span className="font-serif-sc block mb-2 text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">命运匹配</span>
            <span className="text-3xl md:text-5xl block bg-clip-text text-transparent bg-gradient-to-r from-slate-200 to-slate-500 font-display mt-4">
              Destiny Match
            </span>
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed font-light">
            探索你的缘分，预见未来的TA <br className="hidden md:inline"/>
            <span className="text-slate-500 text-base mt-2 block">Explore your destiny, foresee your future partner through the lens of artificial intelligence and ancient wisdom.</span>
          </p>
        </div>

        <div className="mt-12 md:mt-16 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-600 to-primary rounded-full blur opacity-40 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
          <button
            onClick={onStart}
            className="relative px-8 py-4 bg-primary text-white rounded-full font-semibold text-lg md:text-xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center gap-3 mx-auto overflow-hidden"
          >
            <span className="material-icons">auto_awesome</span>
            <span>开启命运之门</span>
            <span className="text-sm font-normal opacity-80 pl-1 border-l border-white/20">Enter Destiny</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full py-8 border-t border-white/5 bg-background-dark/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-full border border-white/5">
            <div className="flex -space-x-2">
              <img className="w-6 h-6 rounded-full border border-background-dark" src="https://picsum.photos/seed/u1/100/100" />
              <img className="w-6 h-6 rounded-full border border-background-dark" src="https://picsum.photos/seed/u2/100/100" />
              <img className="w-6 h-6 rounded-full border border-background-dark" src="https://picsum.photos/seed/u3/100/100" />
            </div>
            <div className="text-xs md:text-sm text-slate-300">
              <span className="text-primary font-bold tabular-nums">12,345</span> people found their destiny
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500 font-medium">
            <span>© 2024 Destiny Match</span>
          </div>
        </div>
        <div className="text-center mt-4">
          <p className="text-[10px] text-slate-600 max-w-lg mx-auto px-4">
            *Results are generated by AI for entertainment purposes. Destiny is in your own hands.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
