import React, { useMemo, useState } from 'react';
import { Package } from 'lucide-react';

export function TrendyStyleReview({ savedStyles, setSavedStyles, onSubmit }) {
  const [sortBy, setSortBy] = useState('none');
  const [rightSortBy, setRightSortBy] = useState('none');

  // Enrich savedStyles with deterministic financial metrics if missing
  const analyzedStyles = useMemo(() => {
    return savedStyles.map(s => {
      const charCode = (s.id || s.name).charCodeAt(0) || 1;
      const seed = (charCode % 10) / 10;
      
      const sales = s.estSales || Math.floor(500 + seed * 3000);
      const price = s.estPrice || Math.floor(800 + seed * 2000);
      const fixedCost = s.estFixedCost || Math.floor(15000 + seed * 10000);
      const variableCost = s.estVariableCost || Math.floor(200 + seed * 300);
      
      const totalCost = fixedCost + (variableCost * sales);
      const totalRevenue = price * sales;
      const estMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0;
      const estUnitCost = Math.round(totalCost / sales);

      // Get risk score as a stable value
      const riskScore = s.riskScore || Math.floor(30 + seed * 60);
      const totalScore = s.totalScore || (6 + seed * 4).toFixed(1);
      const totalFitScore = s.totalFitScore || Math.floor(5 + seed * 10);

      return {
        ...s,
        estSales: sales,
        estPrice: price,
        estFixedCost: fixedCost,
        estVariableCost: variableCost,
        estUnitCost,
        estMargin,
        riskScore,
        totalScore,
        totalFitScore
      };
    });
  }, [savedStyles]);

  const handleDecision = (id, decision) => {
    setSavedStyles(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          directToDev: decision === 'dev',
          needsPrediction: decision === 'predict',
          rejected: decision === 'reject'
        };
      }
      return s;
    }));
  };

  const handleAutoDemo = () => {
    const sortedIds = [...analyzedStyles].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0)).map(s => s.id);
    setSavedStyles(prev => prev.map(s => {
      const index = sortedIds.indexOf(s.id);
      if (index === -1) return s;
      
      // The user wants exactly 5 styles sent to crowd prediction.
      const decision = index < 5 ? 'predict' : index < 10 ? 'dev' : 'reject';
      
      return {
        ...s,
        directToDev: decision === 'dev',
        needsPrediction: decision === 'predict',
        rejected: decision === 'reject'
      };
    }));
  };

  const pendingCount = analyzedStyles.filter(s => !s.directToDev && !s.needsPrediction && !s.rejected).length;

  return (
    <div className="w-full mx-auto h-full min-h-0 flex flex-col animate-in fade-in duration-200">
      <div className="mb-4 flex flex-col">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />
          流行款審核
        </h2>
        <p className="text-sm text-gray-500 mt-1">請針對設計部提交的流行組合進行初審。與基礎款不同，高風險款式可送入「群眾預測」。</p>
      </div>

      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
        
        {/* Left Side: Catalog */}
        <div className="xl:col-span-1 flex flex-col h-full min-h-0">
          <div className="flex justify-between items-center bg-[#f9fafb] p-3 border border-[#d1d5db] rounded-t-lg mb-2 shrink-0">
             <div className="flex items-center gap-2">
               <h3 className="font-bold text-content-main">流行款式清單</h3>
               {pendingCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded font-bold">待審核: {pendingCount}</span>}
             </div>
             <div className="flex items-center gap-4">
                 <button 
                   onClick={handleAutoDemo}
                   className="px-3 py-1.5 text-xs rounded-md bg-primary text-white font-bold hover:bg-primary-hover shadow-sm transition-colors flex items-center gap-1"
                 >
                   ✨ AI 智慧決策 (Demo)
                 </button>
                 <div className="flex gap-2">
                    <span className="text-xs text-gray-500 font-bold self-center mr-1">排序:</span>
                <button 
                  onClick={() => setSortBy('risk')} 
                  className={`px-2 py-1 text-[10px] rounded border ${sortBy === 'risk' ? 'bg-primary-50 text-primary border-primary font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >風險</button>
                <button 
                  onClick={() => setSortBy('margin')} 
                  className={`px-2 py-1 text-[10px] rounded border ${sortBy === 'margin' ? 'bg-primary-50 text-primary border-primary font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >毛利率</button>
                <button 
                  onClick={() => setSortBy('score')} 
                  className={`px-2 py-1 text-[10px] rounded border ${sortBy === 'score' ? 'bg-status-good-bg text-status-good-text border-status-good-border font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >設計總分</button>
             </div>
             </div>
          </div>
          
          <div className="overflow-y-auto pr-2 space-y-4 flex-1">
          {(() => {
            let leftList = [...analyzedStyles];
            if (sortBy === 'risk') {
              leftList.sort((a, b) => b.riskScore - a.riskScore);
            } else if (sortBy === 'score') {
              leftList.sort((a, b) => parseFloat(b.totalScore) - parseFloat(a.totalScore));
            } else if (sortBy === 'margin') {
              leftList.sort((a, b) => b.estMargin - a.estMargin);
            }
            return leftList.map(style => {
              const currentDecision = style.directToDev ? 'dev' : style.needsPrediction ? 'predict' : style.rejected ? 'reject' : null;
              
              return (
                <div key={style.id} className={`border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-4 ${
                  currentDecision === 'dev' ? 'border-status-good-border ring-1 ring-status-good-border' :
                  currentDecision === 'predict' ? 'border-blue-400 ring-1 ring-blue-400' :
                  currentDecision === 'reject' ? 'border-status-bad-border opacity-75 ring-1 ring-status-bad-border' : 'border-[#d1d5db]'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-content-main">{style.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#6b7280]">系統判定風險:</span>
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${style.riskScore > 60 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                          {style.riskScore} 分
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDecision(style.id, 'reject')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentDecision === 'reject' ? 'bg-status-bad-bg text-status-bad-text border border-status-bad-border font-bold' : 'bg-white border border-[#d1d5db] text-[#4b5563]'} hover:bg-status-bad-bg hover:text-status-bad-text hover:border-status-bad-border`}
                      >
                        淘汰
                      </button>
                      <button 
                        onClick={() => handleDecision(style.id, 'predict')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentDecision === 'predict' ? 'bg-blue-50 text-blue-700 border border-blue-400 font-bold' : 'bg-white border border-[#d1d5db] text-[#4b5563]'} hover:bg-blue-50 hover:text-blue-700 hover:border-blue-400`}
                      >
                        送去預測
                      </button>
                      <button 
                        onClick={() => handleDecision(style.id, 'dev')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentDecision === 'dev' ? 'bg-status-good-bg text-status-good-text border border-status-good-border font-bold' : 'bg-white border border-[#d1d5db] text-[#4b5563]'} hover:border-status-good-border hover:text-status-good-text hover:bg-status-good-bg`}
                      >
                        開發此款
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">
                    <div>
                      <div className="text-xs font-bold text-[#4b5563] mb-2 border-b pb-1">組合元素</div>
                      <div className="flex flex-wrap gap-2">
                        {style.elements?.map((el, idx) => (
                          <span key={`${el.id || idx}`} className="text-[10px] px-1.5 py-0.5 rounded border bg-white text-[#374151] border-[#d1d5db]">
                            {el.name || el.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#4b5563] mb-2 border-b pb-1">設計表現</div>
                      <div className="flex items-center gap-3 h-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">總流行分數</span>
                          <span className="text-sm font-bold text-[#374151]">{style.totalScore}</span>
                        </div>
                        <div className="w-px h-6 bg-[#d1d5db]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">總契合分數</span>
                          <span className="text-sm font-bold text-[#374151]">{style.totalFitScore} 分</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#4b5563] mb-2 border-b pb-1">預估財務 (風險未定)</div>
                      <div className="flex items-center gap-3 h-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">預估毛利</span>
                          <span className="text-sm font-bold text-primary">{(style.estMargin * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-px h-6 bg-[#d1d5db]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">單件成本</span>
                          <span className="text-sm font-bold text-[#374151]">${style.estUnitCost}</span>
                        </div>
                        <div className="w-px h-6 bg-[#d1d5db]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">預估售價</span>
                          <span className="text-sm font-bold text-[#374151]">${style.estPrice}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}
          </div>
        </div>
        
        {/* Right Side: Development Portfolio Summary */}
        <div className="xl:col-span-1 bg-white border border-[#d1d5db] rounded-lg shadow-sm flex flex-col h-full min-h-0">
          {(() => {
            let devListRaw = analyzedStyles.filter(s => s.directToDev || s.needsPrediction);
            
            // Calculate similarity (competition value) for each item in devList
            const devListWithComp = devListRaw.map(itemA => {
              let compScore = 0;
              devListRaw.forEach(itemB => {
                if (itemA.id !== itemB.id) {
                  const setA = new Set(itemA.elements?.map(e => e.name || e.label) || []);
                  const setB = new Set(itemB.elements?.map(e => e.name || e.label) || []);
                  let intersection = 0;
                  for (let a of setA) {
                    if (setB.has(a)) intersection++;
                  }
                  const union = setA.size + setB.size - intersection;
                  const sim = union === 0 ? 0 : intersection / union;
                  compScore += sim;
                }
              });
              return { ...itemA, competitionScore: compScore };
            });

            let devList = [...devListWithComp];
            
            if (rightSortBy === 'risk') {
              devList.sort((a, b) => b.riskScore - a.riskScore);
            } else if (rightSortBy === 'margin') {
              devList.sort((a, b) => b.estMargin - a.estMargin);
            } else if (rightSortBy === 'comp') {
              devList.sort((a, b) => b.competitionScore - a.competitionScore);
            }
            
            // Recalculate totals for all selected styles (both directToDev and needsPrediction)
            const selectedStyles = devList;
            const totalFixedCost = selectedStyles.reduce((acc, curr) => acc + (curr.estFixedCost || 0), 0);
            const totalVariableCost = selectedStyles.reduce((acc, curr) => acc + (curr.estVariableCost || 0) * (curr.estSales || 0), 0);
            const totalCost = totalFixedCost + totalVariableCost;
            const totalRevenue = selectedStyles.reduce((acc, curr) => acc + (curr.estPrice || 0) * (curr.estSales || 0), 0);
            const totalAvgMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0;
            
            const predictCount = devList.filter(s => s.needsPrediction).length;
            const devCount = devList.filter(s => s.directToDev).length;

            return (
              <>
                <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb] rounded-t-lg shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-content-main">流行款決策總表</h3>
                      <span className="text-xs text-gray-700 font-bold bg-gray-200 px-2 py-1 rounded-full">直接開發 {devCount} 款</span>
                      <span className="text-xs text-blue-700 font-bold bg-blue-100 px-2 py-1 rounded-full">群眾預測 {predictCount} 款</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 font-bold self-center mr-1">排序:</span>
                      <button 
                        onClick={() => setRightSortBy('risk')} 
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'risk' ? 'bg-primary-50 text-primary border-primary font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >風險</button>
                      <button
                        onClick={() => setRightSortBy('margin')}
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'margin' ? 'bg-primary-50 text-primary border-primary font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >毛利率</button>
                      <button
                        onClick={() => setRightSortBy('comp')}
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'comp' ? 'bg-primary-50 text-primary border-primary font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >競爭值</button>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0">
                  {devList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-[#9ca3af] p-8">
                      <div className="text-sm font-medium">尚未選擇任何款式</div>
                    </div>
                  ) : (
                    <table className="w-full text-left text-sm text-[#374151]">
                      <thead className="bg-white sticky top-0 text-xs text-[#6b7280] shadow-sm z-10">
                        <tr>
                          <th className="px-3 py-2 font-medium">款式名稱</th>
                          <th className="px-2 py-2 font-medium text-center">狀態</th>
                          <th className="px-2 py-2 font-medium text-right">單件總成本</th>
                          <th className="px-2 py-2 font-medium text-right">預估銷量</th>
                          <th className="px-2 py-2 font-medium text-right">預估售價</th>
                          <th className="px-2 py-2 font-medium text-right">風險值</th>
                          <th className="px-2 py-2 font-medium text-right" title="和其他選進款式的相似度總和">競爭值</th>
                          <th className="px-2 py-2 font-medium text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {devList.map(style => (
                          <tr key={`dev-${style.id}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 font-medium text-content-main max-w-[140px] truncate" title={style.name}>
                              {style.name}
                            </td>
                            <td className="px-2 py-3 text-center">
                              {style.directToDev ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-status-good-bg text-status-good-text">直接開發</span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-blue-100 text-blue-700">市場預測</span>
                              )}
                            </td>
                            <td className="px-2 py-3 text-right font-medium text-[#374151]">
                              ${style.estUnitCost}
                            </td>
                            <td className="px-2 py-3 text-right font-medium text-[#374151]">
                              {style.estSales?.toLocaleString()}
                            </td>
                            <td className="px-2 py-3 text-right font-medium text-[#374151]">
                              ${style.estPrice}
                            </td>
                            <td className={`px-2 py-3 text-right font-bold ${style.riskScore > 60 ? 'text-red-500' : 'text-[#6b7280]'}`}>
                              {style.riskScore}
                            </td>
                            <td className={`px-2 py-3 text-right font-bold ${style.competitionScore > 1.0 ? 'text-status-bad-text' : style.competitionScore > 0.5 ? 'text-status-warn-text' : 'text-status-good-text'}`}>
                              {style.competitionScore.toFixed(2)}
                            </td>
                            <td className="px-2 py-3 text-center">
                              <button 
                                onClick={() => handleDecision(style.id, 'reject')}
                                className="text-status-bad-border hover:text-status-bad-text hover:bg-status-bad-bg p-1 rounded transition-colors text-xs font-bold"
                              >
                                移除
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Portfolio Summary Dashboard */}
                <div className="bg-[#111827] text-white rounded-b-lg shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-5">
                  <div className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">「直接開發」與「群眾預測」款式 - 綜合財務預估 (Summary)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">總固定成本</span>
                      <span className="text-lg font-bold">${totalFixedCost.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">總變動成本</span>
                      <span className="text-lg font-bold">${totalVariableCost.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-700 pl-4">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">總預估營收</span>
                      <span className="text-xl font-bold text-status-good-text">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">綜合預估毛利率</span>
                      <span className="text-xl font-bold text-purple-400">{(totalAvgMargin * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-700 pt-3 text-right">
                    <button 
                      onClick={onSubmit}
                      disabled={pendingCount > 0}
                      className={`text-sm font-bold py-2 px-6 rounded shadow transition-colors border ${
                        pendingCount === 0 
                          ? 'bg-[#374151] hover:bg-[#4b5563] text-white border-[#4b5563]' 
                          : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                      }`}
                    >
                      {pendingCount > 0 ? `尚有 ${pendingCount} 款未審核` : '完成初審，推進流程 \u2192'}
                    </button>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
