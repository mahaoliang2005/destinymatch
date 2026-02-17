
import React, { useRef, useState } from 'react';
import heic2any from 'heic2any';

interface UploadProps {
    onUpload: (file: File) => void;
    onBack: () => void;
}

const Upload: React.FC<UploadProps> = ({ onUpload, onBack }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isHeicFile = (file: File): boolean => {
        return file.type === 'image/heic' ||
               file.type === 'image/heif' ||
               file.name.toLowerCase().endsWith('.heic') ||
               file.name.toLowerCase().endsWith('.heif');
    };

    const handleFile = async (file: File) => {
        if (!file) return;
        setError(null);

        try {
            let processedFile = file;

            // 检测并转换 HEIC/HEIF 格式
            if (isHeicFile(file)) {
                setIsConverting(true);
                console.log('[Upload] Converting HEIC to JPEG...');

                try {
                    const result = await heic2any({
                        blob: file,
                        toType: 'image/jpeg',
                        quality: 0.9
                    });

                    // heic2any 返回单个 Blob 或 Blob[]
                    const blob = Array.isArray(result) ? result[0] : result;
                    processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), {
                        type: 'image/jpeg'
                    });

                    console.log('[Upload] HEIC conversion completed:', processedFile.name, processedFile.size);
                } catch (convError) {
                    console.warn('[Upload] HEIC conversion failed:', convError);
                    setIsConverting(false);
                    setError('HEIC conversion failed. Please convert to JPG manually and try again.');
                    return; // 中断上传，不继续处理
                }
                setIsConverting(false);
            }

            // Pass the processed File object directly instead of base64
            onUpload(processedFile);
        } catch (error) {
            console.error('[Upload] File processing failed:', error);
            setIsConverting(false);
            setError('HEIC conversion failed. Please try converting to JPG manually.');
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) {
            await handleFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden bg-background-dark font-display">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-20"></div>
                <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] bg-primary/10 rounded-full blur-[120px] mix-blend-screen"></div>
            </div>

            <header className="relative z-10 px-6 py-6 md:px-12 md:py-8 flex justify-between items-center">
                <button
                    onClick={onBack}
                    className="group flex items-center gap-2 text-slate-400 hover:text-primary transition-colors"
                >
                    <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-primary/50 group-hover:bg-primary/10 transition-all">
                        <span className="material-icons text-xl group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                    </div>
                    <span className="text-sm font-medium hidden sm:block">Back</span>
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-pink-600 flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-icons text-white text-sm">favorite</span>
                    </div>
                    <span className="font-bold text-lg tracking-tight">Destiny Match</span>
                </div>
                <div className="w-20 hidden sm:block"></div>
            </header>

            <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-4 md:px-6 w-full max-w-5xl mx-auto py-4">
                <div className="w-full max-w-md mb-12">
                    <div className="flex justify-between items-end mb-3 px-1">
                        <span className="text-sm font-semibold text-primary">Step 1 of 3</span>
                        <span className="text-xs text-slate-500 font-medium">Your Portrait</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-primary rounded-full shadow-[0_0_15px_rgba(230,25,93,0.5)]"></div>
                    </div>
                </div>

                <div className="text-center w-full max-w-2xl">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
                        Upload Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-400">Photo</span>
                    </h1>
                    <p className="text-slate-400 mb-8 max-w-lg mx-auto">
                        Let our AI analyze your features to find your perfect astrological match.
                    </p>

                    <div
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`group relative w-full aspect-[4/3] md:aspect-[2/1] bg-white/5 border-2 border-dashed ${isDragging ? 'border-primary bg-white/[0.1]' : 'border-white/10'} rounded-xl hover:border-primary/50 hover:bg-white/[0.07] transition-all duration-300 cursor-pointer flex flex-col items-center justify-center p-8 mb-8 overflow-hidden`}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={async (e) => e.target.files?.[0] && await handleFile(e.target.files[0])}
                        />
                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl pointer-events-none"></div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                <span className="material-icons text-4xl text-primary">add_a_photo</span>
                            </div>
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                {isConverting ? 'Converting HEIC...' : 'Click or drag to upload'}
                            </h3>
                            <p className="text-sm text-slate-400 mb-6">Supports JPG, PNG, WEBP up to 5MB</p>
                            <button
                                className="bg-white text-background-dark font-semibold py-3 px-8 rounded-full hover:shadow-lg hover:shadow-primary/20 transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isConverting}
                            >
                                {isConverting ? 'Converting...' : 'Select File'}
                            </button>
                            {error && (
                                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm max-w-xs">
                                    <span className="material-icons text-sm align-middle mr-1">error_outline</span>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 justify-center items-center w-full max-w-xl mx-auto">
                        <div className="flex-1 w-full bg-blue-900/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3 text-left">
                            <span className="text-lg">💡</span>
                            <div>
                                <p className="text-xs font-bold text-blue-200 mb-0.5">Pro Tip</p>
                                <p className="text-xs text-blue-300/80 leading-relaxed">Clear front-facing photos with good lighting work best.</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full bg-white/5 border border-white/5 rounded-lg p-4 flex items-start gap-3 text-left">
                            <span className="material-icons text-emerald-500 text-lg">shield</span>
                            <div>
                                <p className="text-xs font-bold text-emerald-200 mb-0.5">Privacy First</p>
                                <p className="text-xs text-slate-400 leading-relaxed">Photos are deleted immediately after analysis.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Upload;
