
import React, { useState, useCallback, useEffect } from 'react';
import { AppStep, PartnerVibe, AnalysisResult, HistoryRecord } from './types';
import Home from './pages/Home';
import Privacy from './pages/Privacy';
import Upload from './pages/Upload';
import SelectVibe from './pages/SelectVibe';
import Loading from './pages/Loading';
import Result from './pages/Result';
import Records from './pages/Records';
import ErrorPage from './pages/ErrorPage';
import RateLimitPage from './pages/RateLimitPage';
import { runDestinyMatch } from './services/destiny';

/**
 * Upload image to server and get URL
 * @param imageBase64 Base64 encoded image
 * @returns Image URL from server
 */
const uploadImage = async (imageBase64: string): Promise<string> => {
  const response = await fetch('/api/upload-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error?.message || `Upload failed: ${response.status}`
    );
  }

  const result = await response.json();

  if (!result.success || !result.data?.imageUrl) {
    throw new Error(result.error?.message || 'Upload failed');
  }

  return result.data.imageUrl;
};

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.HOME);
  const [userImageBase64, setUserImageBase64] = useState<string | null>(null);
  const [userImageUrl, setUserImageUrl] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<PartnerVibe>('gentle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('destiny_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Check if old format (base64) and clear if so
        if (parsed.length > 0 && (parsed[0].userImageBase64 || parsed[0].partnerImageBase64)) {
          console.log('[App] Detected old format history with base64 images, clearing...');
          localStorage.removeItem('destiny_history');
          setHistory([]);
        } else {
          setHistory(parsed);
        }
      } catch (e) {
        console.error("Failed to load history", e);
        localStorage.removeItem('destiny_history');
      }
    }
    setIsLoaded(true);
  }, []);

  // Save history whenever it changes (only after loading)
  useEffect(() => {
    if (!isLoaded) return;
    localStorage.setItem('destiny_history', JSON.stringify(history));
  }, [history, isLoaded]);

  const handleStart = () => setCurrentStep(AppStep.PRIVACY);
  const handlePrivacyAgree = () => setCurrentStep(AppStep.UPLOAD);
  const handlePrivacyDisagree = () => setCurrentStep(AppStep.HOME);
  
  const handleImageUpload = (base64: string) => {
    setUserImageBase64(base64);
    setCurrentStep(AppStep.SELECT_VIBE);
  };

  const handleVibeSelect = (vibe: PartnerVibe) => {
    setSelectedVibe(vibe);
    runAnalysis(vibe);
  };

  const runAnalysis = async (vibe: PartnerVibe) => {
    if (!userImageBase64) return;
    setCurrentStep(AppStep.LOADING);

    try {
      // Step 1: Upload user image to server and get URL
      console.log('[App] Uploading user image...');
      const uploadedImageUrl = await uploadImage(userImageBase64);
      setUserImageUrl(uploadedImageUrl);
      console.log('[App] User image uploaded:', uploadedImageUrl);

      // Step 2: Run analysis with the image URL
      const result = await runDestinyMatch(uploadedImageUrl, vibe);
      setAnalysisResult(result);

      // Step 3: Create history record with URLs (not base64)
      const newRecord: HistoryRecord = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        userName: "Seeker",
        userImageUrl: uploadedImageUrl,
        vibe: vibe
      };

      setHistory(prev => [newRecord, ...prev]);
      setCurrentStep(AppStep.RESULT);
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : '';

      // Check if it's a rate limit error (using error code or Chinese keywords)
      if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('次数已用完')) {
        setCurrentStep(AppStep.RATE_LIMIT);
      } else {
        setCurrentStep(AppStep.ERROR);
      }
    }
  };

  const handleRestart = () => {
    setUserImageBase64(null);
    setUserImageUrl(null);
    setAnalysisResult(null);
    setCurrentStep(AppStep.HOME);
  };

  const handleViewRecords = () => setCurrentStep(AppStep.RECORDS);

  const renderStep = () => {
    switch (currentStep) {
      case AppStep.HOME:
        return <Home onStart={handleStart} onGoToRecords={handleViewRecords} />;
      case AppStep.PRIVACY:
        return <Privacy onAgree={handlePrivacyAgree} onDisagree={handlePrivacyDisagree} />;
      case AppStep.UPLOAD:
        return <Upload onUpload={handleImageUpload} onBack={() => setCurrentStep(AppStep.HOME)} />;
      case AppStep.SELECT_VIBE:
        return (
          <SelectVibe
            userImage={userImageBase64}
            onConfirm={() => {
              if (userImageBase64) {
                // 随机选择一种伴侣风格
                const vibes: PartnerVibe[] = ['gentle', 'sunny', 'intellectual', 'mysterious'];
                const randomVibe = vibes[Math.floor(Math.random() * vibes.length)];
                setSelectedVibe(randomVibe);
                runAnalysis(randomVibe);
              }
            }}
            onBack={() => setCurrentStep(AppStep.UPLOAD)}
          />
        );
      case AppStep.LOADING:
        return <Loading />;
      case AppStep.RESULT:
        return analysisResult && userImageBase64 ? (
          <Result
            result={analysisResult}
            userImage={userImageBase64}
            vibe={selectedVibe}
            onRestart={handleRestart}
          />
        ) : null;
      case AppStep.RECORDS:
        return <Records history={history} onBack={handleRestart} />;
      case AppStep.ERROR:
        return <ErrorPage onRetry={() => setCurrentStep(AppStep.UPLOAD)} onBack={handleRestart} />;
      case AppStep.RATE_LIMIT:
        return <RateLimitPage onBack={handleRestart} />;
      default:
        return <Home onStart={handleStart} onGoToRecords={handleViewRecords} />;
    }
  };

  return (
    <div className="min-h-screen">
      {renderStep()}
    </div>
  );
};

export default App;
