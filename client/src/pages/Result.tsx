
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AnalysisResult, PartnerVibe } from '../types';
import {
    generateShareCard,
    downloadImage,
    generateQRCode,
    copyToClipboard,
    isWeChat,
    isMobile,
    generateShareText,
    getShareUrl,
} from '../services/share';

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
    const [isGenerating, setIsGenerating] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [showWeChatGuide, setShowWeChatGuide] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
    const [partnerImageBase64, setPartnerImageBase64] = useState<string>('');
    const [userImageBase64, setUserImageBase64] = useState<string>(userImage);
    const cardRef = useRef<HTMLDivElement>(null);

    // Generate QR code on mount
    useEffect(() => {
        const generateQR = async () => {
            try {
                const url = await generateQRCode(getShareUrl());
                setQrCodeUrl(url);
            } catch (error) {
                console.error('Failed to generate QR code:', error);
            }
        };
        generateQR();
    }, []);

    // Fetch partner image from URL and convert to base64 for share card compatibility
    useEffect(() => {
        const fetchPartnerImage = async () => {
            if (result.partnerImageUrl) {
                try {
                    // Fetch the image from the server URL and convert to base64
                    const response = await fetch(result.partnerImageUrl);
                    const blob = await response.blob();
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setPartnerImageBase64(reader.result as string);
                    };
                    reader.readAsDataURL(blob);
                } catch (error) {
                    console.error('Failed to fetch partner image:', error);
                    // Fallback to URL if fetch fails
                    setPartnerImageBase64(result.partnerImageUrl);
                }
            }
        };

        fetchPartnerImage();

        if (userImage) {
            setUserImageBase64(userImage);
        }
    }, [userImage, result.partnerImageUrl]);

    // Show toast message
    const showToastMessage = useCallback((message: string) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    }, []);

    // Handle download share card
    const handleDownload = async () => {
        if (!cardRef.current) {
            console.error('Card ref not found');
            showToastMessage('生成失败：找不到卡片元素');
            return;
        }

        setIsGenerating(true);
        try {
            console.log('Starting share card generation...');
            const dataUrl = await generateShareCard(cardRef.current);
            console.log('Share card generated, downloading...');
            downloadImage(dataUrl, `DestinyMatch_${result.score}_${Date.now()}.png`);
            showToastMessage(isMobile() ? '长按图片保存到相册' : '图片已保存');
        } catch (error) {
            console.error('Download failed:', error);
            showToastMessage(`生成失败：${error instanceof Error ? error.message : '请重试'}`);
        } finally {
            setIsGenerating(false);
        }
    };

    // Handle copy share text
    const handleCopyText = async () => {
        const text = generateShareText(result.score, result.partnerType, vibe);
        const success = await copyToClipboard(text);
        showToastMessage(success ? '文案已复制，去粘贴分享吧' : '复制失败');
    };

    // Handle WeChat share
    const handleWeChatShare = () => {
        setShowWeChatGuide(true);
    };

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
                                src={showUserPhoto ? (userImageBase64 || userImage) : (result.partnerImageUrl || partnerImageBase64 || userImage)}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={showUserPhoto ? "你的照片" : "未来伴侣"}
                            />
                            <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-sm font-medium border border-white/10 flex items-center gap-1">
                                <span className="material-icons-round text-base text-pink-300">spa</span>
                                {showUserPhoto ? '你的照片' : result.partnerType}
                            </div>
                            <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background-dark/90 to-transparent"></div>

                            {/* 照片切换按钮 */}
                            {result.partnerImageUrl && (
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
                                            src={partnerImageBase64 || result.partnerImageUrl || userImage}
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
                                        {qrCodeUrl ? (
                                            <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
                                        ) : (
                                            <div className="w-16 h-16 bg-black flex items-center justify-center text-[8px] text-white">QR CODE</div>
                                        )}
                                    </div>
                                    <p className="text-[9px] text-white/40">Scan to find your love</p>
                                </div>
                            </div>
                        </div>
                        <div className="relative z-10 px-8 py-6 flex justify-between">
                            <button
                                onClick={handleWeChatShare}
                                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                                title="微信好友"
                            >
                                <span className="material-icons-round text-white">chat</span>
                            </button>
                            <button
                                onClick={handleWeChatShare}
                                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                                title="朋友圈"
                            >
                                <span className="material-icons-round text-white">camera</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                disabled={isGenerating}
                                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
                                title="保存图片"
                            >
                                <span className="material-icons-round text-white">{isGenerating ? 'hourglass_empty' : 'download'}</span>
                            </button>
                            <button
                                onClick={handleCopyText}
                                className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors"
                                title="复制文案"
                            >
                                <span className="material-icons-round text-white">link</span>
                            </button>
                        </div>
                        <div className="relative z-10 px-8 pb-8 pt-2">
                            <button onClick={() => setShowShare(false)} className="w-full text-white/40 hover:text-white py-3 text-sm font-medium transition-colors">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Hidden share card for image generation - positioned off-screen */}
            <div
                ref={cardRef}
                className="fixed w-[300px] bg-gradient-to-b from-[#1a0d10] to-[#2D1A20] p-6 flex flex-col items-center"
                style={{ width: '300px', height: '540px', left: '-9999px', top: '0', zIndex: -9999 }}
            >
                {/* Card Header */}
                <div className="text-center mb-4">
                    <div className="mb-1">
                        <span className="text-white/80 text-xs font-bold tracking-wider">Destiny Match</span>
                    </div>
                    <p className="text-white/40 text-[10px]">Find Your Soulmate</p>
                </div>

                {/* Photos */}
                <div className="flex items-center justify-center gap-3 mb-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/50 bg-[#2D1A20]">
                        <img
                            src={userImageBase64 || userImage}
                            className="w-full h-full object-cover"
                            alt="User"
                            crossOrigin="anonymous"
                        />
                    </div>
                    <span className="text-2xl text-primary font-light">+</span>
                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary bg-[#2D1A20]">
                        <img
                            src={partnerImageBase64 || result.partnerImageUrl || userImage}
                            className="w-full h-full object-cover"
                            alt="Partner"
                            crossOrigin="anonymous"
                        />
                    </div>
                </div>

                {/* Score */}
                <div className="text-center mb-4">
                    <div className="text-4xl font-extrabold text-primary drop-shadow-lg">{result.score}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-white/50 mt-1">Soul Match</div>
                    <div className="text-xs text-white/70 mt-1">{vibeNames[vibe]} · {result.partnerType}</div>
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-4"></div>

                {/* Quote */}
                <p className="text-white/60 text-xs text-center italic mb-4 leading-relaxed px-2">
                    "{result.interpretation.slice(0, 60)}..."
                </p>

                {/* QR Code */}
                <div className="mt-auto flex flex-col items-center">
                    <div className="bg-white p-1.5 rounded-lg mb-2">
                        {qrCodeUrl ? (
                            <img src={qrCodeUrl} alt="QR Code" className="w-16 h-16" />
                        ) : (
                            <div className="w-16 h-16 bg-black flex items-center justify-center text-[6px] text-white">QR</div>
                        )}
                    </div>
                    <p className="text-[8px] text-white/40">Scan to find your love</p>
                </div>
            </div>

            {/* Toast */}
            {showToast && (
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] bg-black/80 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm font-medium animate-fade-in">
                    {toastMessage}
                </div>
            )}

            {/* WeChat Share Guide */}
            {showWeChatGuide && (
                <div
                    className="fixed inset-0 z-[70] bg-black/80 flex flex-col items-center justify-center p-8"
                    onClick={() => setShowWeChatGuide(false)}
                >
                    <div className="text-center">
                        <div className="text-white text-lg font-bold mb-4">分享到微信</div>
                        <div className="text-white/70 text-sm space-y-3 text-left max-w-xs mx-auto">
                            <p>1. 点击下方"保存图片"按钮</p>
                            <p>2. 长按图片保存到相册</p>
                            <p>3. 打开微信，选择图片发送给朋友</p>
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={isGenerating}
                            className="mt-8 px-8 py-3 bg-primary text-white rounded-full font-medium disabled:opacity-50"
                        >
                            {isGenerating ? '生成中...' : '保存图片'}
                        </button>
                        <button
                            onClick={() => setShowWeChatGuide(false)}
                            className="block mt-4 text-white/50 text-sm hover:text-white"
                        >
                            取消
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Result;
