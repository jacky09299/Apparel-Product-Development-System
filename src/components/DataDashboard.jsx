import React from 'react';
import { Target, TrendingUp, Users, Package, AlertTriangle, ArrowUpRight, Activity, CheckCircle2 } from 'lucide-react';
import { DecisionSummaryTable } from './DecisionSummaryTable';

export function DataDashboard({ elements, matrixState, requirements, phase, historicalCombos, setCurrentView, basicDecisions = {}, savedStyles = [] }) {
  const basicCount = Object.values(basicDecisions).filter(v => v === 'approve' || v === 'fine_tune').length;
  // Currently, we consider 'confirmed' trendy styles to be those that bypass crowd prediction. 
  // (In the future this should also include styles approved after crowd prediction).
  const trendyCount = savedStyles.filter(style => style.directToDev).length;
  const totalStyles = basicCount + trendyCount;

  const highRiskCount = savedStyles.filter(s => (s.riskScore || 0) > 50).length;

  const basicRatio = totalStyles > 0 ? Math.round((basicCount / totalStyles) * 100) : 0;
  const trendyRatio = totalStyles > 0 ? Math.round((trendyCount / totalStyles) * 100) : 0;
  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-[#d1d5db] pb-4">
        <h1 className="text-2xl font-bold text-content-main flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" />
          商品開發營運總覽
        </h1>
        <div className="flex gap-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
            Season: 2026 FW
          </span>
          <span className="bg-status-good-bg text-status-good-text px-3 py-1 rounded-full text-sm font-bold border border-status-good-border">
            狀態：開發進行中
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {totalStyles > 0 && (
          <div className="bg-white border border-[#d1d5db] rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-500 font-medium text-sm">已鎖定款式總數</h3>
              <Package className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-black text-gray-800">{totalStyles}<span className="text-base font-medium text-gray-500 ml-1">款</span></div>
            <div className="text-xs text-gray-500 font-medium mt-2 flex items-center gap-1">
              長青款 {basicCount} 款 / 流行款 {trendyCount} 款
            </div>
          </div>
        )}

        {elements && elements.length > 0 && (
          <div className="bg-white border border-[#d1d5db] rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-500 font-medium text-sm">本季候選流行元素</h3>
              <Activity className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-black text-gray-800">{elements.length}<span className="text-base font-medium text-gray-500 ml-1">項</span></div>
            <div className="text-xs text-gray-500 font-medium mt-2 flex items-center gap-1">
              由趨勢分析師預測提供
            </div>
          </div>
        )}

        {requirements && requirements.length > 0 && (
          <div className="bg-white border border-[#d1d5db] rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-gray-500 font-medium text-sm">已設定品牌需求</h3>
              <Target className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-3xl font-black text-gray-800">{requirements.length}<span className="text-base font-medium text-gray-500 ml-1">項</span></div>
            <div className="text-xs text-gray-500 font-medium mt-2 flex items-center gap-1">
              作為跨部門評分基準
            </div>
          </div>
        )}

        {savedStyles.length > 0 && (
          <div className={`bg-white border ${highRiskCount > 0 ? 'border-orange-200 bg-orange-50' : 'border-[#d1d5db]'} rounded-lg p-5 shadow-sm`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className={`${highRiskCount > 0 ? 'text-orange-800' : 'text-gray-500'} font-medium text-sm`}>高風險流行款式</h3>
              <AlertTriangle className={`w-5 h-5 ${highRiskCount > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
            <div className={`text-3xl font-black ${highRiskCount > 0 ? 'text-orange-900' : 'text-gray-800'}`}>{highRiskCount}<span className={`text-base font-medium ${highRiskCount > 0 ? 'text-orange-700' : 'text-gray-500'} ml-1`}>款</span></div>
            <div className={`text-xs font-medium mt-2 ${highRiskCount > 0 ? 'text-orange-700' : 'text-gray-500'}`}>
              {highRiskCount > 0 ? '建議透過群眾預測降低風險' : '目前款式風險皆在可控範圍'}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Activity */}
        <div className={`space-y-6 ${totalStyles > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm overflow-hidden">
            <div className="bg-[#f9fafb] border-b border-[#d1d5db] p-4 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">近期開發進度</h3>
              <button className="text-sm text-primary hover:underline">查看完整報告</button>
            </div>
            <div className="p-6">
              <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-8">
                  {/* Step 1 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${phase >= 1 ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}>
                      {phase > 1 ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">1</span>}
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-bold ${phase >= 1 ? 'text-gray-800' : 'text-gray-400'}`}>流行趨勢與品牌需求評估</h4>
                      <p className="text-xs text-gray-500 mt-1">{phase > 1 ? '已完成元素預測與品牌權重設定' : '進行中：系統正根據市場數據分析趨勢並建立品牌需求'}</p>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${phase >= 2 ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}>
                      {phase > 2 ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">2</span>}
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-bold ${phase >= 2 ? 'text-gray-800' : 'text-gray-400'}`}>跨部門契合度評估</h4>
                      <p className="text-xs text-gray-500 mt-1">{phase > 2 ? '所有部門已全數提交評分' : (phase === 2 ? '進行中：等待各部門進行契合度評分' : '等待前置階段完成')}</p>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${phase >= 3 ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}>
                      {phase > 3 ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">3</span>}
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-bold ${phase >= 3 ? 'text-gray-800' : 'text-gray-400'}`}>商品款式決策</h4>
                      <p className="text-xs text-gray-500 mt-1">{phase > 3 ? '款式決策與資源分配已完成' : (phase === 3 ? '進行中：流行契合表已解鎖，正進行款式決策' : '等待前置階段完成')}</p>
                    </div>
                  </div>

                  {/* Step 4 */}
                  <div className="relative flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 ${phase >= 4 ? 'bg-green-100 text-green-700 border-2 border-green-500' : 'bg-gray-100 text-gray-400 border-2 border-gray-200'}`}>
                      {phase > 4 ? <CheckCircle2 className="w-6 h-6" /> : <span className="font-bold">4</span>}
                    </div>
                    <div className="pt-2">
                      <h4 className={`font-bold ${phase >= 4 ? 'text-gray-800' : 'text-gray-400'}`}>群眾預測與打版生產</h4>
                      <p className="text-xs text-gray-500 mt-1">{phase >= 4 ? '進行中：款式已進入打版與市場預測階段' : '等待前置階段完成'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Stats */}
        {totalStyles > 0 && (
          <div className="space-y-6">
            <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm p-5">
              <h3 className="font-bold text-gray-800 mb-4 border-b pb-2">本季開發配比實況</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">長青基礎款 (建議 40%)</span>
                    <span className="text-gray-800 font-bold">目前 {basicRatio}% ({basicCount}款)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gray-500 h-2 rounded-full" style={{ width: `${basicRatio}%` }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-primary font-medium">流行風險款 (建議 60%)</span>
                    <span className="text-primary font-bold">目前 {trendyRatio}% ({trendyCount}款)</span>
                  </div>
                  <div className="w-full bg-blue-100 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: `${trendyRatio}%` }}></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4 italic">
                * {basicRatio < 40 ? '系統建議：可考慮增加長青基礎款比例，以平衡整體產品線風險。' : (trendyRatio < 60 ? '系統建議：可考慮增加流行款式，以提升品牌市場聲量。' : '系統建議：目前開發配比符合預期。')}
              </p>
            </div>
          </div>
        )}
      </div>
      {elements && elements.length > 0 && (
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-[#d1d5db] overflow-hidden">
          <div className="bg-[#f8fafc] border-b border-[#e5e7eb] px-6 py-4 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              流行契合表
            </h2>
          </div>
          <div className="p-6">
            <DecisionSummaryTable elements={elements} matrixState={matrixState} requirements={requirements} phase={phase} isPreview={true} onExpand={() => setCurrentView({ type: 'summary' })} />
          </div>
        </div>
      )}
    </div>
  );
}
