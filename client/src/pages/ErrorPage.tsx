
import React from 'react';

interface ErrorProps {
  onRetry: () => void;
  onBack: () => void;
}

const ErrorPage: React.FC<ErrorProps> = ({ onRetry, onBack }) => {
  return (
    <div className="bg-background-dark font-display min-h-screen flex items-center justify-center p-4 relative overflow-hidden text-white">
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-purple/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary-purple/10 rounded-full blur-[120px]"></div>
      </div>

      <main className="w-full max-w-lg relative z-10">
        <div className="bg-[#191022]/60 backdrop-blur-xl border border-primary-purple/15 rounded-lg p-8 md:p-12 text-center shadow-2xl relative">
          <div className="relative w-24 h-24 mx-auto mb-8 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-primary-purple/30 rounded-full"></div>
            <div className="w-20 h-20 bg-primary-purple/20 rounded-full flex items-center justify-center">
              <span className="material-icons text-5xl text-primary-purple/80">person_off</span>
            </div>
            <div className="absolute -right-1 -top-1 bg-background-dark border-2 border-primary-purple rounded-full w-8 h-8 flex items-center justify-center">
              <span className="material-icons text-primary-purple text-sm font-bold">question_mark</span>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-3 tracking-tight">无法识别命运的面容</h1>
          <p className="text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">未能识别到清晰的人脸，请尝试上传一张清晰的正面照</p>

          <div className="bg-primary-purple/5 border border-primary-purple/10 rounded-xl p-6 mb-8 text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-purple mb-4 ml-1 opacity-80">上传建议 Tips</h3>
            <ul className="space-y-4">
              {[
                { icon: 'wb_sunny', title: '光线充足', desc: '避免光线过暗或强烈背光' },
                { icon: 'visibility', title: '直视镜头', desc: '请保持正面直视前方' },
                { icon: 'face', title: '面部无遮挡', desc: '请摘下口罩或墨镜' }
              ].map((tip, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="bg-primary-purple/20 p-1.5 rounded-full shrink-0">
                    <span className="material-icons text-primary-purple text-sm block">{tip.icon}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tip.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{tip.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <button 
              onClick={onRetry}
              className="w-full bg-primary-purple hover:bg-purple-700 text-white font-semibold py-3.5 px-6 rounded-full transition-all duration-200 shadow-lg flex items-center justify-center gap-2 group"
            >
              <span className="material-icons text-lg group-hover:rotate-180 transition-transform duration-500">sync</span>
              重新上传
            </button>
            <button 
              onClick={onBack}
              className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3.5 px-6 rounded-full transition-colors duration-200"
            >
              返回首页
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ErrorPage;
