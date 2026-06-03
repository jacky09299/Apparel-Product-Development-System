import React, { useState, useEffect } from 'react';
import { BrandFitMatrix } from './components/BrandFitMatrix';
import { Step3Dashboard, Step4Designer, Step5QA } from './components/MockPages';
import { Step2CrowdPrediction } from './components/Step2CrowdPrediction';
// Custom hook to persist state in localStorage so it survives logout/refresh
function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      if (stickyValue !== null && stickyValue !== "undefined") {
        return JSON.parse(stickyValue);
      }
    } catch (e) {
      console.warn('Error reading localStorage for key', key, e);
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });
  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);
  return [value, setValue];
}

const initialRequirements = [
  { id: 'req-1', role: '設計師', name: '實用', weight: 4 },
  { id: 'req-2', role: '設計師', name: '舒適', weight: 6 },
];

const initialElements = [
  { id: 'c-white', category: '主色', name: '白' },
  { id: 'm-cotton', category: '面料', name: '棉' },
];


function Dashboard({ onStepChange }) {
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-content-main border-b border-[#d1d5db] pb-4">商品開發中心</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 開發決策輔助 */}
        <div className="bg-white border border-primary rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="bg-primary text-white p-4 font-bold text-lg">開發決策輔助</div>
          <div className="p-4 flex-1 flex flex-col gap-3">
            <button onClick={() => onStepChange(1)} className="w-full text-left p-3 border border-[#d1d5db] rounded hover:border-primary hover:bg-primary-50 transition-colors flex items-center justify-between group">
              <span className="font-medium text-[#374151] group-hover:text-primary">初步決定開發方向</span>
              <span className="text-primary opacity-0 group-hover:opacity-100">&rarr;</span>
            </button>
            <button onClick={() => onStepChange(2)} className="w-full text-left p-3 border border-[#d1d5db] rounded hover:border-primary hover:bg-primary-50 transition-colors flex items-center justify-between group">
              <span className="font-medium text-[#374151] group-hover:text-primary">建立群眾預測活動</span>
              <span className="text-primary opacity-0 group-hover:opacity-100">&rarr;</span>
            </button>
            <button onClick={() => onStepChange(3)} className="w-full text-left p-3 border border-[#d1d5db] rounded hover:border-primary hover:bg-primary-50 transition-colors flex items-center justify-between group">
              <span className="font-medium text-[#374151] group-hover:text-primary">最終決定開發計畫</span>
              <span className="text-primary opacity-0 group-hover:opacity-100">&rarr;</span>
            </button>
          </div>
        </div>

        {/* 設計開發 */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm overflow-hidden flex flex-col opacity-75">
          <div className="bg-[#f3f4f6] text-[#4b5563] p-4 font-bold text-lg border-b border-[#d1d5db]">設計開發</div>
          <div className="p-4 flex-1 flex flex-col gap-3 justify-center items-center text-[#9ca3af] text-sm">
            建置中...
          </div>
        </div>

        {/* 版型開發 */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm overflow-hidden flex flex-col opacity-75">
          <div className="bg-[#f3f4f6] text-[#4b5563] p-4 font-bold text-lg border-b border-[#d1d5db]">版型開發</div>
          <div className="p-4 flex-1 flex flex-col gap-3 justify-center items-center text-[#9ca3af] text-sm">
            建置中...
          </div>
        </div>

        {/* 優化系統 */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm overflow-hidden flex flex-col opacity-75">
          <div className="bg-[#f3f4f6] text-[#4b5563] p-4 font-bold text-lg border-b border-[#d1d5db]">優化系統</div>
          <div className="p-4 flex-1 flex flex-col gap-3 justify-center items-center text-[#9ca3af] text-sm">
            建置中...
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentRole, setCurrentRole] = useStickyState(null, 'erp2_currentRole');
  const [currentStep, setCurrentStep] = useStickyState(0, 'erp2_currentStep_v3');
  const [subStep, setSubStep] = useStickyState(1, 'erp2_subStep'); // 1 = Matrix, 2 = BasicStyle

  // Matrix Global State
  const [phase, setPhase] = useStickyState(1, 'erp2_phase');
  const [plannerSubmitted, setPlannerSubmitted] = useStickyState(false, 'erp2_plannerSub');
  const [trendAnalystSubmitted, setTrendAnalystSubmitted] = useStickyState(false, 'erp2_trendSub');
  const [evalSubmissions, setEvalSubmissions] = useStickyState({
    '設計師': false,
    '數據分析師': false,
    '採購': false,
  }, 'erp2_evalSubs');

  const [requirements, setRequirements] = useStickyState(initialRequirements, 'erp2_reqs');
  const [elements, setElements] = useStickyState(initialElements, 'erp2_elems');
  const [basicDecisions, setBasicDecisions] = useStickyState({}, 'erp2_basicDecisions');
  const [historicalCombos, setHistoricalCombos] = useStickyState([], 'erp2_historicalCombos_v3');
  const [savedStyles, setSavedStyles] = useStickyState([], 'erp2_savedStyles_v3');

  const [matrixState, setMatrixState] = useStickyState(() => {
    const initial = {};
    initialRequirements.forEach(req => {
      initial[req.id] = {};
      initialElements.forEach(el => {
        initial[req.id][el.id] = '-';
      });
    });
    return initial;
  }, 'erp2_matrixState');

  const matrixProps = {
    currentRole, phase, setPhase,
    plannerSubmitted, setPlannerSubmitted,
    trendAnalystSubmitted, setTrendAnalystSubmitted,
    evalSubmissions, setEvalSubmissions,
    matrixState, setMatrixState,
    requirements, setRequirements,
    elements, setElements,
    basicDecisions, setBasicDecisions,
    historicalCombos, setHistoricalCombos,
    savedStyles, setSavedStyles,
    setSubStep
  };

  if (!currentRole) {
    return (
      <div className="min-h-screen bg-[#f3f4f6] flex items-center justify-center p-4">
        <div className="bg-white p-8 border border-[#d1d5db] shadow-md w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-content-main">Apparel Product Development System</h1>
            <p className="text-sm text-[#6b7280] mt-1">請選擇您的職位以登入系統</p>
          </div>
          <div className="space-y-3">
            {['商品企劃', '趨勢分析師', '設計師', '數據分析師', '採購', '財務'].map(role => (
              <button
                key={role}
                onClick={() => setCurrentRole(role)}
                className="w-full text-left px-4 py-3 border border-[#d1d5db] rounded hover:border-primary hover:bg-primary-50 transition-colors text-[#374151] font-medium flex justify-between items-center group"
              >
                <span>{role}</span>
                <span className="text-primary opacity-0 group-hover:opacity-100 text-sm">登入 &rarr;</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (currentStep) {
      case 0: return <Dashboard onStepChange={setCurrentStep} />;
      case 1: return <BrandFitMatrix {...matrixProps} subStep={subStep} />;
      case 2: return <Step2CrowdPrediction savedStyles={savedStyles} />;
      case 3: return <Step3Dashboard />;
      case 4: return <Step4Designer />;
      case 5: return <Step5QA />;
      default: return <Dashboard onStepChange={setCurrentStep} />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-surface-base font-sans text-content-main overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-primary text-white flex items-center px-4 shrink-0 shadow z-10">
        <div className="flex items-center gap-4">
          <span className="font-bold text-sm tracking-wide cursor-pointer" onClick={() => setCurrentStep(0)}>
            Apparel Product Development System
          </span>
        </div>
        <div className="ml-auto text-xs flex items-center gap-4">
          <span>登入身分: {currentRole}</span>
          <button onClick={() => setCurrentRole(null)} className="hover:underline">登出</button>
        </div>
      </header>

      {/* Breadcrumb / Top Bar */}
      <div className="h-10 bg-white border-b border-[#d1d5db] flex items-center px-4 text-sm text-[#4b5563] shrink-0">
        <button onClick={() => setCurrentStep(0)} className="hover:text-primary hover:underline">商品開發</button>
        <span className="mx-2 text-[#9ca3af]">&gt;</span>
        {currentStep === 0 ? (
          <span className="font-semibold text-content-main">總覽</span>
        ) : (
          <>
            <button onClick={() => setCurrentStep(0)} className="hover:text-primary hover:underline">開發決策輔助</button>
            <span className="mx-2 text-[#9ca3af]">&gt;</span>
            <span className="font-semibold text-content-main">
              {currentStep === 1 && "初步決定開發方向"}
              {currentStep === 2 && "建立群眾預測活動"}
              {currentStep === 3 && "最終決定開發計畫"}
              {currentStep > 3 && `步驟 ${currentStep}`}
            </span>
            
            {currentStep === 1 && (
              <div className="flex items-center ml-6 gap-2 bg-[#f3f4f6] p-1 rounded">
                <button 
                  onClick={() => setSubStep(1)}
                  className={`px-3 py-1 text-xs rounded font-bold ${subStep === 1 ? 'bg-white text-primary shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'}`}
                >
                  品牌契合度評估矩陣
                </button>
                {phase >= 3 && (
                  <button 
                    onClick={() => setSubStep(2)}
                    className={`px-3 py-1 text-xs rounded font-bold ${subStep === 2 ? 'bg-white text-primary shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'}`}
                  >
                    基礎款決策
                  </button>
                )}
                {phase >= 4 && (
                  <button 
                    onClick={() => setSubStep(3)}
                    className={`px-3 py-1 text-xs rounded font-bold ${subStep === 3 ? 'bg-white text-primary shadow-sm' : 'text-[#6b7280] hover:text-[#374151]'}`}
                  >
                    流行款決策
                  </button>
                )}
              </div>
            )}
          </>
        )}
        
        <button 
          onClick={() => {
            window.localStorage.clear();
            window.location.reload();
          }}
          className="ml-auto text-xs text-red-600 hover:underline"
        >
          [開發人員] 清除所有資料並重置流程
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 min-h-0 bg-[#f3f4f6] flex flex-col">
        {currentStep !== 0 ? (
          <div className="p-4 flex-1 min-h-0 flex flex-col">
            {renderContent()}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {renderContent()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
