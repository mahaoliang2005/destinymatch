
import React from 'react';

interface SelectVibeProps {
    userImage: string | null;
    onConfirm: () => void;
    onBack: () => void;
}

const SelectVibe: React.FC<SelectVibeProps> = ({ userImage, onConfirm, onBack }) => {
    return (
        <div className="bg-background-dark text-white font-display min-h-screen flex flex-col">
            <nav className="w-full px-6 py-4 flex justify-between items-center z-50 fixed top-0 left-0 bg-background-dark/90 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-2">
                    <span className="material-icons-round text-primary text-3xl">auto_awesome</span>
                    <span className="font-bold text-xl tracking-tight">Destiny Match</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium opacity-60">
                    <span className="hidden md:block">AI-Powered Romance</span>
                </div>
            </nav>

            <main className="flex-grow flex flex-col justify-center items-center px-4 pt-24 pb-12 w-full max-w-7xl mx-auto">
                <div className="w-full max-w-lg mb-12">
                    <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-primary/60 mb-2">
                        <span>Step 2 of 3</span>
                        <span>Review Photo</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-dark rounded-full overflow-hidden">
                        <div className="h-full bg-primary w-2/3 shadow-[0_0_10px_rgba(230,25,93,0.5)]"></div>
                    </div>
                </div>

                <div className="w-full max-w-2xl">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold mb-2">Preview Your Photo</h2>
                        <p className="text-white/60">Review your uploaded photo before starting the AI analysis</p>
                    </div>

                    <div className="relative bg-[#2d1b21]/40 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
                        {userImage ? (
                            <div className="flex flex-col items-center">
                                <div className="relative w-full max-w-md aspect-[4/5] rounded-xl overflow-hidden bg-black/20">
                                    <img
                                        src={userImage}
                                        alt="Uploaded portrait"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="mt-6 flex items-center gap-2 text-sm text-white/40">
                                    <span className="material-icons-round text-emerald-400 text-lg">check_circle</span>
                                    <span>Photo ready for analysis</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-white/40">
                                <span className="material-icons-round text-6xl mb-4">image_not_supported</span>
                                <p>No photo available</p>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full max-w-xl mx-auto mt-8">
                        <div className="flex-1 w-full bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3 text-left">
                            <span className="text-lg">💡</span>
                            <div>
                                <p className="text-xs font-bold text-blue-200 mb-0.5">What's Next?</p>
                                <p className="text-xs text-blue-300/80 leading-relaxed">AI will analyze your facial features to predict your ideal partner.</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full bg-white/5 border border-white/5 rounded-lg p-4 flex items-start gap-3 text-left">
                            <span className="material-icons-round text-emerald-500 text-lg">shield</span>
                            <div>
                                <p className="text-xs font-bold text-emerald-200 mb-0.5">Privacy Protected</p>
                                <p className="text-xs text-white/40 leading-relaxed">Your photo is processed securely and never stored.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed bottom-0 left-0 w-full bg-background-dark/80 backdrop-blur-lg border-t border-white/5 p-6 z-40">
                    <div className="max-w-4xl mx-auto flex items-center justify-between">
                        <button
                            onClick={onBack}
                            className="text-white/40 hover:text-white flex items-center gap-2 font-medium transition-colors px-4 py-2 rounded-full hover:bg-white/5"
                        >
                            <span className="material-icons-round">arrow_back</span>
                            Back
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={!userImage}
                            className={`font-bold px-10 py-4 rounded-full shadow-lg transition-all transform hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 ${
                                userImage
                                    ? 'bg-primary hover:bg-primary/90 text-white shadow-primary/25 hover:shadow-primary/40'
                                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                            }`}
                        >
                            Start Prediction
                            <span className="text-xs opacity-70 font-normal">(开始预测)</span>
                            <span className="material-icons-round text-sm">arrow_forward</span>
                        </button>
                    </div>
                </div>
                <div className="h-24"></div>
            </main>
        </div>
    );
};

export default SelectVibe;
