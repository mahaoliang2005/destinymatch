
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
import { runDestinyMatch } from './services/destiny';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.HOME);
  const [userImage, setUserImage] = useState<string | null>(null);
  const [selectedVibe, setSelectedVibe] = useState<PartnerVibe>('gentle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('destiny_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load history", e);
      }
    }
  }, []);

  // Save history whenever it changes
  useEffect(() => {
    localStorage.setItem('destiny_history', JSON.stringify(history));
  }, [history]);

  const handleStart = () => setCurrentStep(AppStep.PRIVACY);
  const handlePrivacyAgree = () => setCurrentStep(AppStep.UPLOAD);
  const handlePrivacyDisagree = () => setCurrentStep(AppStep.HOME);
  
  const handleImageUpload = (base64: string) => {
    setUserImage(base64);
    setCurrentStep(AppStep.SELECT_VIBE);
  };

  const handleVibeSelect = (vibe: PartnerVibe) => {
    setSelectedVibe(vibe);
    runAnalysis(vibe);
  };

  const runAnalysis = async (vibe: PartnerVibe) => {
    if (!userImage) return;
    setCurrentStep(AppStep.LOADING);

    try {
      const result = await runDestinyMatch(userImage, vibe);
      setAnalysisResult(result);
      
      const newRecord: HistoryRecord = {
        ...result,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        userName: "Seeker",
        userImageBase64: userImage,
        vibe: vibe
      };
      
      setHistory(prev => [newRecord, ...prev]);
      setCurrentStep(AppStep.RESULT);
    } catch (error) {
      console.error(error);
      setCurrentStep(AppStep.ERROR);
    }
  };

  const handleRestart = () => {
    setUserImage(null);
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
            userImage={userImage}
            onConfirm={() => {
              if (userImage) {
                runAnalysis(selectedVibe);
              }
            }}
            onBack={() => setCurrentStep(AppStep.UPLOAD)}
          />
        );
      case AppStep.LOADING:
        return <Loading />;
      case AppStep.RESULT:
        return analysisResult && userImage ? (
          <Result 
            result={analysisResult} 
            userImage={userImage} 
            vibe={selectedVibe}
            onRestart={handleRestart} 
          />
        ) : null;
      case AppStep.RECORDS:
        return <Records history={history} onBack={handleRestart} />;
      case AppStep.ERROR:
        return <ErrorPage onRetry={() => setCurrentStep(AppStep.UPLOAD)} onBack={handleRestart} />;
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
