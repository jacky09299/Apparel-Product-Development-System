import React, { useState, useEffect } from 'react';
import { BrandFitMatrix } from './components/BrandFitMatrix';
import { BasicStyleDecision } from './components/BasicStyleDecision';
import { TrendyStyleDecision } from './components/TrendyStyleDecision';
import { Step3Dashboard, Step4Designer, Step5QA } from './components/MockPages';
import { Step2CrowdPrediction } from './components/Step2CrowdPrediction';
import { DataDashboard } from './components/DataDashboard';
import { DevelopmentList } from './components/DevelopmentList';
import { DecisionSummaryTable } from './components/DecisionSummaryTable';
import { LayoutDashboard, ListTodo, UserCircle, X, Menu, ChevronRight, CheckCircle2, Circle, FolderArchive } from 'lucide-react';

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
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch (err) { console.error("Error setting localStorage", key, err); if (err.name === "QuotaExceededError") { alert("Local storage is full! Please clear your site data."); } }
  }, [key, value]);
  return [value, setValue];
}

const initialRequirements = [
  { id: 'req-1', role: '設計師', name: '實用', weight: 4 },
  { id: 'req-2', role: '設計師', name: '舒適', weight: 6 },
];

const initialElements = [
  { id: 'el-1', category: '風格', name: '基本休閒' },
  { id: 'el-2', category: '品項', name: 'T恤' },
  { id: 'el-3', category: '版型', name: '常規' },
  { id: 'el-4', category: '面料', name: '棉' },
  { id: 'el-5', category: '主色', name: '白' },
  { id: 'el-6', category: '配色', name: '無' },
  { id: 'el-7', category: '圖騰印花', name: '素面' },
  { id: 'el-8', category: '細節設計', name: '基本款' },
];

const ROLES = ['系統管理員', '設計總監', '趨勢分析師', '商品企劃', '設計師'];


if (typeof window !== 'undefined' && !window.__errorLoggerInjected) {
  window.__errorLoggerInjected = true;
  window.addEventListener('error', (e) => {
    const div = document.createElement('div');
    div.style = "position:fixed;top:0;left:0;z-index:9999;background:red;color:white;padding:10px;font-size:12px;max-width:100vw;word-wrap:break-word;";
    div.innerText = "Error: " + e.message + " @ " + e.filename + ":" + e.lineno + "\n" + (e.error ? e.error.stack : '');
    document.body.appendChild(div);
  });
  window.addEventListener('unhandledrejection', (e) => {
    const div = document.createElement('div');
    div.style = "position:fixed;bottom:0;left:0;z-index:9999;background:orange;color:white;padding:10px;font-size:12px;max-width:100vw;word-wrap:break-word;";
    div.innerText = "Promise Rejection: " + (e.reason ? (e.reason.stack || e.reason.message || e.reason) : 'Unknown');
    document.body.appendChild(div);
  });
}

function App() {
  const [currentRole, setCurrentRole] = useStickyState('系統管理員', 'erp2_currentRole_v4');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentView, setCurrentView] = useState({ type: 'dashboard', readOnly: true });

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
  const [elements, setElements] = useStickyState(initialElements, 'erp2_elems_v2');
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
  }, 'erp2_matrixState_v2');

  // Dummy mock state for Step 2/3 progress
  const [step2Completed, setStep2Completed] = useStickyState(false, 'erp2_step2_completed');
  const [step3Completed, setStep3Completed] = useStickyState(false, 'erp2_step3_completed');
  const [subStep, setSubStep] = useStickyState(1, 'erp2_subStep');

  // Determine Overall Progress Statuses
  const progressState = {
    brandFit: phase >= 3,
    basicStyle: phase >= 4 || Object.keys(basicDecisions).length > 0,
    trendyStyle: savedStyles.length > 0,
    crowdPrediction: step2Completed,
    finalPlan: step3Completed
  };

  const getMyTasks = () => {
    let tasks = [];
    if (currentRole === '趨勢分析師' || currentRole === '系統管理員') {
      if (!trendAnalystSubmitted) tasks.push({ id: 'brand_fit', name: '填寫品牌契合度預測', readOnly: false });
      if (progressState.basicStyle && progressState.trendyStyle && !progressState.crowdPrediction) tasks.push({ id: 'step2', name: '建立群眾預測活動', readOnly: false });
    }
    if (currentRole === '設計師' || currentRole === '系統管理員') {
      if (phase < 3) tasks.push({ id: 'brand_fit', name: '設定品牌需求權重', readOnly: false });
      if (progressState.brandFit) tasks.push({ id: 'trendy_style', name: '組合本季流行款元素', readOnly: false });
    }
    if (currentRole === '商品企劃' || currentRole === '系統管理員') {
      if (!plannerSubmitted) tasks.push({ id: 'brand_fit', name: '部門契合度評估', readOnly: false });
      if (progressState.brandFit && !progressState.basicStyle) tasks.push({ id: 'basic_style', name: '審核長青基礎款利潤', readOnly: false });
      if (progressState.crowdPrediction && !progressState.finalPlan) tasks.push({ id: 'final', name: '最終決定開發計畫', readOnly: false });
    }
    if (currentRole === '設計總監' || currentRole === '系統管理員') {
       if (progressState.finalPlan) tasks.push({ id: 'final', name: '總監最終審核', readOnly: false });
    }
    return tasks;
  };

  const myTasks = getMyTasks();

  const handleTaskClick = (task) => {
    setCurrentView({ type: task.id, readOnly: task.readOnly });
  };

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
    subStep, setSubStep,
    globalReadOnly: currentView.readOnly,
    setCurrentView
  };



  const renderContent = () => {
    return (
      <>
        <div style={{ display: currentView.type === 'dashboard' ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
          <DataDashboard {...matrixProps} setCurrentView={setCurrentView} />
        </div>
        <div style={{ display: currentView.type === 'brand_fit' ? 'flex' : 'none', height: '100%', flexDirection: 'column', minHeight: 0 }}>
          <BrandFitMatrix {...matrixProps} />
        </div>
        <div style={{ display: currentView.type === 'basic_style' ? 'flex' : 'none', height: '100%', flexDirection: 'column', minHeight: 0 }}>
          <BasicStyleDecision elements={elements} matrixState={matrixState} requirements={requirements} historicalCombos={historicalCombos} basicDecisions={basicDecisions} setBasicDecisions={setBasicDecisions} onSubmit={() => { if (phase < 4) setPhase(4); setCurrentView({type: 'dashboard', readOnly: true}); }} isReadOnly={currentView.readOnly} />
        </div>
        <div style={{ display: currentView.type === 'trendy_style' ? 'flex' : 'none', height: '100%', flexDirection: 'column', minHeight: 0 }}>
          <TrendyStyleDecision elements={elements} savedStyles={savedStyles} setSavedStyles={setSavedStyles} matrixState={matrixState} requirements={requirements} isReadOnly={currentView.readOnly} onSubmit={() => setCurrentView({type: "dashboard", readOnly: true})} />
        </div>
        <div style={{ display: currentView.type === 'step2' ? 'flex' : 'none', height: '100%', flexDirection: 'column', minHeight: 0 }}>
          <Step2CrowdPrediction savedStyles={savedStyles} setSavedStyles={setSavedStyles} />
        </div>
        <div style={{ display: currentView.type === 'final' ? 'flex' : 'none', height: '100%', flexDirection: 'column', minHeight: 0 }}>
          <Step3Dashboard />
        </div>
        <div style={{ display: currentView.type === 'development_list' ? 'block' : 'none', height: '100%', overflowY: 'auto' }}>
          <DevelopmentList historicalCombos={historicalCombos} basicDecisions={basicDecisions} savedStyles={savedStyles} setCurrentView={setCurrentView} />
        </div>
        <div style={{ display: currentView.type === 'summary' ? 'flex' : 'none', height: '100%', flexDirection: 'column', minHeight: 0 }}>
          <div className="flex-1 overflow-auto bg-white">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">完整流行契合表</h2>
              <button onClick={() => setCurrentView({ type: 'dashboard' })} className="text-gray-500 hover:text-gray-700 font-bold">
                返回首頁
              </button>
            </div>
            <DecisionSummaryTable elements={elements} matrixState={matrixState} requirements={requirements} phase={phase} isPreview={false} />
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-[#f3f4f6] font-sans text-content-main overflow-hidden">
      {/* Top Navbar */}
      <header className="h-14 bg-[#111827] text-white flex items-center px-6 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setCurrentView({ type: 'dashboard', readOnly: true })}>
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center font-bold text-lg border border-white/20">AP</div>
          <span className="font-bold text-sm tracking-wide hidden sm:block">
            Apparel Product Development System
          </span>
        </div>
        
        <div className="flex items-center ml-8">
          <button 
            onClick={() => setCurrentView({ type: 'development_list', readOnly: true })}
            className={`text-sm px-3 py-1.5 rounded-md transition-colors flex items-center gap-2 ${currentView.type === 'development_list' ? 'bg-white/20 text-white font-bold' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
          >
            <FolderArchive className="w-4 h-4" />
            開發款式庫
          </button>
        </div>

        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-md border border-white/10">
            <UserCircle className="w-4 h-4 text-gray-300" />
            <select 
              value={currentRole} 
              onChange={e => { setCurrentRole(e.target.value); setCurrentView({ type: 'dashboard', readOnly: true }); }}
              className="bg-transparent text-sm font-bold text-white outline-none cursor-pointer"
            >
              {ROLES.map(r => <option key={r} value={r} className="text-black">{r}</option>)}
            </select>
          </div>
          
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/10 rounded-md transition-colors relative"
            title="開關任務欄"
          >
            <ListTodo className="w-5 h-5" />
            {myTasks.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-status-bad-text rounded-full border-2 border-[#111827]"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Center Content */}
        <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${isSidebarOpen ? 'mr-[320px]' : ''}`}>
          
          {/* Top Info Bar when not in dashboard */}
          {currentView.type !== 'dashboard' && (
            <div className="h-10 bg-white border-b border-[#d1d5db] flex items-center px-6 text-sm shrink-0 shadow-sm z-10">
              <button onClick={() => setCurrentView({ type: 'dashboard', readOnly: true })} className="text-gray-500 hover:text-primary hover:underline font-medium flex items-center gap-1">
                &larr; 返回中央看板
              </button>
              <div className="ml-auto font-bold flex items-center gap-2">
                {currentView.readOnly && (
                  <span className="text-status-warn-text bg-status-warn-bg px-2 py-0.5 rounded border border-status-warn-border text-xs">唯讀檢視模式 (不可編輯)</span>
                )}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto relative">
            {renderContent()}
          </div>
        </div>

        {/* Right Collapsible Task Sidebar */}
        <div 
          className={`absolute right-0 top-0 bottom-0 w-[320px] bg-white border-l border-[#d1d5db] shadow-xl transition-transform duration-300 z-10 flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="h-14 bg-[#f9fafb] border-b border-[#d1d5db] flex items-center justify-between px-4 shrink-0">
            <h2 className="font-bold text-gray-800 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-primary" />
              我的任務
              {myTasks.length > 0 && <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{myTasks.length}</span>}
            </h2>
            <button onClick={() => setIsSidebarOpen(false)} className="text-gray-400 hover:text-gray-700 p-1 rounded-md hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
            {myTasks.length === 0 ? (
              <div className="text-center text-gray-400 mt-10 text-sm">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>目前沒有需要您處理的任務！</p>
                <p className="mt-1 text-xs">請等候其他部門推進進度。</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map((task, i) => (
                  <div 
                    key={i}
                    onClick={() => handleTaskClick(task)}
                    className="bg-white border border-primary border-l-4 rounded-md p-4 shadow-sm hover:shadow cursor-pointer transition-shadow group"
                  >
                    <div className="text-xs text-primary font-bold mb-1">待處理任務</div>
                    <div className="font-bold text-gray-800 group-hover:text-primary transition-colors">
                      {task.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      點擊進入編輯 &rarr;
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-[#d1d5db] bg-white shrink-0">
             <button 
                onClick={() => {
                  window.localStorage.clear();
                  window.location.reload();
                }}
                className="w-full text-xs text-gray-400 hover:text-red-500 hover:underline text-center"
              >
                [開發人員] 重置系統資料
              </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;
