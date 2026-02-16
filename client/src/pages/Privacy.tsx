
import React from 'react';

interface PrivacyProps {
  onAgree: () => void;
  onDisagree: () => void;
}

const Privacy: React.FC<PrivacyProps> = ({ onAgree, onDisagree }) => {
  return (
    <div className="font-display bg-background-dark text-white min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-gold/20 rounded-full blur-[100px] animate-pulse"></div>
      </div>

      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"></div>

      <main className="relative z-50 w-full max-w-md mx-auto">
        <div className="bg-[#221e10]/85 backdrop-blur-xl border border-white/10 rounded-lg p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary-gold/50 to-transparent"></div>
          
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-primary-gold/10 flex items-center justify-center mb-6 border border-primary-gold/20">
              <span className="material-icons-round text-3xl text-primary-gold">lock</span>
            </div>
            
            <h2 className="text-2xl font-bold mb-2 tracking-tight">🔒 隐私保护</h2>
            <p className="text-sm text-gray-400 mb-8 font-medium">您的信任对我们至关重要 (Your trust is vital to us)</p>
            
            <div className="w-full space-y-4 mb-8 text-left">
              {[
                { zh: "您的照片仅用于生成", en: "Your photo is only used for generation" },
                { zh: "照片不会保存到我们的服务器", en: "Photos are not saved to our servers" },
                { zh: "临时文件立即删除", en: "Temporary files are deleted immediately" },
                { zh: "我们尊重您的隐私", en: "We respect your privacy" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                  <div className="flex-shrink-0 mt-0.5 w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30">
                    <span className="material-icons-round text-sm text-green-400 font-bold">check</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-200">{item.zh}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.en}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex w-full gap-4">
              <button 
                onClick={onDisagree}
                className="flex-1 py-3.5 px-6 rounded-full border border-white/10 text-gray-400 font-medium hover:bg-white/5 hover:text-gray-200 transition-all active:scale-[0.98]"
              >
                不同意
                <span className="block text-[10px] font-normal opacity-70">Disagree</span>
              </button>
              <button 
                onClick={onAgree}
                className="flex-1 py-3.5 px-6 rounded-full bg-primary-gold text-background-dark font-bold shadow-lg hover:bg-yellow-400 transition-all active:scale-[0.98] transform hover:-translate-y-0.5"
              >
                我同意
                <span className="block text-[10px] font-semibold opacity-70 text-background-dark/80">I Agree</span>
              </button>
            </div>
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-600 mt-6 max-w-xs mx-auto">
          点击"我同意"即表示您已阅读并接受我们的服务条款。
        </p>
      </main>
    </div>
  );
};

export default Privacy;
