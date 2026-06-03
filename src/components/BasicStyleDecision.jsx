import React, { useMemo, useState } from 'react';

// Mock Historical Combinations
const HISTORICAL_COMBOS = [
  {
    id: 'hc-1',
    name: '經典素色工裝套組',
    sales: '18,500件',
    elements: [
      { id: 'ai-i-2', label: '寬鬆T恤' },
      { id: 'ai-c-2', label: '黑色' },
      { id: 'ai-p-1', label: '素色簡約' },
      { id: 'ai-d-1', label: '工裝大口袋' }
    ]
  },
  {
    id: 'hc-2',
    name: '復古格紋修身洋裝',
    sales: '12,000件',
    elements: [
      { id: 'ai-i-5', label: '緊身洋裝' },
      { id: 'ai-c-8', label: '櫻桃紅' },
      { id: 'ai-p-3', label: '復古格紋' },
      { id: 'ai-d-2', label: '抽繩抓皺' }
    ]
  },
  {
    id: 'hc-3',
    name: '透氣休閒短裙',
    sales: '9,800件',
    elements: [
      { id: 'ai-i-7', label: 'A字短裙' },
      { id: 'ai-c-1', label: '白色' },
      { id: 'ai-m-2', label: '高透氣亞麻' },
      { id: 'ai-p-8', label: '直條紋' }
    ]
  }
];

export function BasicStyleDecision({ elements, matrixState, requirements, historicalCombos, basicDecisions, setBasicDecisions, onSubmit }) {
  const [sortBy, setSortBy] = useState('none');
  const [rightSortBy, setRightSortBy] = useState('none');

  const analyzedCombos = useMemo(() => {
    if (!elements || !matrixState || !requirements || !historicalCombos) return [];

    const activeElementNames = new Set(elements.map(e => e.name || e.label));
    const activeElementIdsMap = new Map(elements.map(e => [e.name || e.label, e.id]));
    const elementDataMap = new Map(elements.map(e => [e.name || e.label, e]));
    const maxReqScore = requirements.reduce((sum, req) => sum + req.weight, 0);

    return historicalCombos.map(combo => {
      let matchCount = 0;
      let trendHitCount = 0;
      let totalFitScore = 0;
      let totalTrendScore = 0;
      let missingElements = [];

      combo.elements.forEach(el => {
        const elName = el.name || el.label;
        if (!activeElementNames.has(elName)) {
          missingElements.push(elName);
        } else {
          matchCount++;
          const matrixElementData = elementDataMap.get(elName);
          if (matrixElementData) {
            totalTrendScore += (matrixElementData.trendScore || 0);
            if (matrixElementData.trendScore >= 5) {
              trendHitCount++;
            }
          }
          // Get the unified ID from the matrix
          const matrixElementId = activeElementIdsMap.get(elName);
          // Calculate brand fit
          requirements.forEach(req => {
            const state = matrixState[req.id]?.[matrixElementId];
            if (state === 'O') totalFitScore += req.weight;
            if (state === 'X') totalFitScore -= req.weight;
          });
        }
      });

      let suggestion = 'neutral';
      let suggestionText = '需要人工評估';
      const hasEnoughMatches = trendHitCount >= 1;

      if (hasEnoughMatches && totalFitScore >= 10) {
        suggestion = 'positive';
        suggestionText = '建議送去開發';
      } else if (!hasEnoughMatches || totalFitScore <= 0) {
        suggestion = 'negative';
        suggestionText = '建議停產或改款';
      }

      const sales = combo.salesVolume || Math.floor(1000 + Math.random() * 9000);
      const price = combo.estPrice || Math.floor(500 + Math.random() * 2500);
      const unitCost = combo.estVariableCost || Math.floor(150 + Math.random() * 400);
      
      const unitProfit = price - unitCost;
      const estMargin = unitProfit / price;

      return {
        ...combo,
        sales,
        estSales: sales,
        estPrice: price,
        estUnitCost: unitCost,
        estMargin,
        hasEnoughMatches,
        matchCount,
        trendHitCount,
        totalTrendScore,
        missingElements,
        totalFitScore,
        suggestion,
        suggestionText
      };
    });
  }, [elements, matrixState, requirements]);

  const handleDecision = (id, status) => {
    setBasicDecisions(prev => ({ ...prev, [id]: status }));
  };

  const handleAutoDemo = () => {
    const candidates = [...analyzedCombos].sort((a, b) => {
      const scoreA = (a.estMargin * 100) + (a.totalFitScore * 5);
      const scoreB = (b.estMargin * 100) + (b.totalFitScore * 5);
      return scoreB - scoreA;
    });

    const newDecisions = {};
    const selected = [];

    const getSimilarity = (itemA, itemB) => {
      const setA = new Set(itemA.elements.map(e => e.name || e.label));
      const setB = new Set(itemB.elements.map(e => e.name || e.label));
      let intersection = 0;
      for (let a of setA) if (setB.has(a)) intersection++;
      const union = setA.size + setB.size - intersection;
      return union === 0 ? 0 : intersection / union;
    };

    for (const combo of candidates) {
      if (selected.length >= 12) {
        newDecisions[combo.id] = 'reject';
        continue;
      }

      let tooSimilar = false;
      for (const sel of selected) {
        if (getSimilarity(combo, sel) > 0.3) {
          tooSimilar = true;
          break;
        }
      }

      if (!tooSimilar && combo.estMargin > 0.1 && combo.totalFitScore > 0) {
        selected.push(combo);
        newDecisions[combo.id] = 'approve';
      } else {
        newDecisions[combo.id] = 'reject';
      }
    }

    setBasicDecisions(newDecisions);
  };

  return (
    <div className="w-full mx-auto h-full min-h-0 flex flex-col">
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 h-full min-h-0">
        
        {/* Left Side: Catalog */}
        <div className="xl:col-span-1 flex flex-col h-full min-h-0">
          <div className="flex justify-between items-center bg-[#f9fafb] p-3 border border-[#d1d5db] rounded-t-lg mb-2 shrink-0">
             <h3 className="font-bold text-[#111827]">基礎款式清單</h3>
             <div className="flex items-center gap-4">
                 <button 
                   onClick={handleAutoDemo}
                   className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-1"
                 >
                   ✨ AI 智慧決策 (Demo)
                 </button>
                 <div className="flex gap-2">
                    <span className="text-xs text-gray-500 font-bold self-center mr-1">排序:</span>
                <button 
                  onClick={() => setSortBy('trend')} 
                  className={`px-2 py-1 text-[10px] rounded border ${sortBy === 'trend' ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >流行度</button>
                <button 
                  onClick={() => setSortBy('margin')} 
                  className={`px-2 py-1 text-[10px] rounded border ${sortBy === 'margin' ? 'bg-purple-100 text-purple-700 border-purple-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >預估毛利率</button>
                <button 
                  onClick={() => setSortBy('fit')} 
                  className={`px-2 py-1 text-[10px] rounded border ${sortBy === 'fit' ? 'bg-green-100 text-green-700 border-green-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                >契合度</button>
             </div>
             </div>
          </div>
          <div className="overflow-y-auto pr-2 space-y-4 flex-1">
          {(() => {
            let leftList = [...analyzedCombos];
            if (sortBy === 'trend') {
              leftList.sort((a, b) => b.totalTrendScore - a.totalTrendScore);
            } else if (sortBy === 'fit') {
              leftList.sort((a, b) => b.totalFitScore - a.totalFitScore);
            } else if (sortBy === 'margin') {
              leftList.sort((a, b) => b.estMargin - a.estMargin);
            }
            return leftList.map(combo => {
              const currentDecision = basicDecisions[combo.id];
              return (
                <div key={combo.id} className={`border rounded-lg p-4 bg-white shadow-sm flex flex-col gap-4 ${
                  currentDecision === 'approve' ? 'border-green-500 ring-1 ring-green-500' :
                  currentDecision === 'reject' ? 'border-red-400 opacity-75' : 'border-[#d1d5db]'
                }`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-[#111827]">{combo.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-[#6b7280]">歷史銷量:</span>
                        <span className="text-xs font-semibold text-[#374151]">{combo.sales}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDecision(combo.id, 'reject')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentDecision === 'reject' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-gray-50'}`}
                      >
                        淘汰
                      </button>
                      <button 
                        onClick={() => handleDecision(combo.id, 'fine_tune')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentDecision === 'fine_tune' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' : 'bg-white border border-[#d1d5db] text-[#4b5563] hover:bg-gray-50'}`}
                      >
                        嘗試微調
                      </button>
                      <button 
                        onClick={() => handleDecision(combo.id, 'approve')}
                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${currentDecision === 'approve' ? 'bg-green-600 text-white border border-green-600' : 'bg-[#2563eb] text-white hover:bg-[#1d4ed8]'}`}
                      >
                        {currentDecision === 'approve' ? '已加至決策' : '開發此款'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#f9fafb] p-3 rounded border border-[#e5e7eb]">
                    <div>
                      <div className="text-xs font-bold text-[#4b5563] mb-2 border-b pb-1">組合元素</div>
                      <div className="flex flex-wrap gap-2">
                        {combo.elements.map((el, idx) => {
                          const elName = el.name || el.label;
                          const isMissing = combo.missingElements.includes(elName);
                          return (
                            <span key={`${el.id}-${idx}`} className={`text-[10px] px-1.5 py-0.5 rounded border ${isMissing ? 'bg-red-50 text-red-600 border-red-200 line-through' : 'bg-white text-[#374151] border-[#d1d5db]'}`}>
                              {elName}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#4b5563] mb-2 border-b pb-1">系統判定</div>
                      <div className="flex items-center gap-3 h-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">趨勢命中 (流行度≥5)</span>
                          <span className={`text-sm font-bold ${combo.hasEnoughMatches ? 'text-green-600' : 'text-red-500'}`}>
                            {combo.trendHitCount} 個 (需≥1)
                          </span>
                        </div>
                        <div className="w-px h-6 bg-[#d1d5db]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">總契合分數</span>
                          <span className={`text-sm font-bold ${combo.totalFitScore >= 10 ? 'text-green-600' : combo.totalFitScore > 0 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {combo.totalFitScore} 分
                          </span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#4b5563] mb-2 border-b pb-1">預估單款財務表現</div>
                      <div className="flex items-center gap-3 h-8">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">預估毛利率</span>
                          <span className="text-sm font-bold text-purple-600">{(combo.estMargin * 100).toFixed(0)}%</span>
                        </div>
                        <div className="w-px h-6 bg-[#d1d5db]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">預估銷量</span>
                          <span className="text-sm font-bold text-[#374151]">{combo.estSales?.toLocaleString()}件</span>
                        </div>
                        <div className="w-px h-6 bg-[#d1d5db]"></div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-[#6b7280]">單件製造成本</span>
                          <span className="text-sm font-bold text-[#374151]">${combo.estUnitCost}</span>
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
            let devListRaw = analyzedCombos.filter(c => basicDecisions[c.id] === 'approve' || basicDecisions[c.id] === 'fine_tune');
            
            // Calculate similarity (competition value) for each item in devList
            const devListWithComp = devListRaw.map(itemA => {
              let compScore = 0;
              devListRaw.forEach(itemB => {
                if (itemA.id !== itemB.id) {
                  const setA = new Set(itemA.elements.map(e => e.name || e.label));
                  const setB = new Set(itemB.elements.map(e => e.name || e.label));
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
            
            if (rightSortBy === 'trend') {
              devList.sort((a, b) => b.totalTrendScore - a.totalTrendScore);
            } else if (rightSortBy === 'fit') {
              devList.sort((a, b) => b.totalFitScore - a.totalFitScore);
            } else if (rightSortBy === 'margin') {
              devList.sort((a, b) => b.estMargin - a.estMargin);
            } else if (rightSortBy === 'comp') {
              devList.sort((a, b) => b.competitionScore - a.competitionScore);
            }
            
            const totalCost = devList.reduce((acc, curr) => acc + (curr.estUnitCost || 0) * (curr.estSales || 0), 0);
            const totalRevenue = devList.reduce((acc, curr) => acc + (curr.estPrice || 0) * (curr.estSales || 0), 0);
            const totalAvgMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0;
            
            return (
              <>
                <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb] rounded-t-lg shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-[#111827]">開發決策總表</h3>
                      <span className="text-xs text-[#6b7280] font-bold bg-[#e5e7eb] px-2 py-1 rounded-full">已選 {devList.length} 款</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-xs text-gray-500 font-bold self-center mr-1">排序:</span>
                      <button 
                        onClick={() => setRightSortBy('trend')} 
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'trend' ? 'bg-blue-100 text-blue-700 border-blue-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >流行度</button>
                      <button 
                        onClick={() => setRightSortBy('margin')} 
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'margin' ? 'bg-purple-100 text-purple-700 border-purple-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >預估毛利率</button>
                      <button 
                        onClick={() => setRightSortBy('fit')} 
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'fit' ? 'bg-green-100 text-green-700 border-green-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                      >契合度</button>
                      <button 
                        onClick={() => setRightSortBy('comp')} 
                        className={`px-2 py-1 text-[10px] rounded border ${rightSortBy === 'comp' ? 'bg-orange-100 text-orange-700 border-orange-200 font-bold' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                        title="款式元素相似度總和，越高表示互相競爭越激烈"
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
                          <th className="px-2 py-2 font-medium text-right">單件製造成本</th>
                          <th className="px-2 py-2 font-medium text-right">預估銷量</th>
                          <th className="px-2 py-2 font-medium text-right">預估售價</th>
                          <th className="px-2 py-2 font-medium text-right" title="和其他選進款式的相似度總和">競爭值</th>
                          <th className="px-2 py-2 font-medium text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e5e7eb]">
                        {devList.map(combo => (
                          <tr key={`dev-${combo.id}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 font-medium text-[#111827] max-w-[140px] truncate" title={combo.name}>
                              {combo.name}
                            </td>
                            <td className="px-2 py-3 text-center">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${basicDecisions[combo.id] === 'approve' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {basicDecisions[combo.id] === 'approve' ? '開發' : '微調'}
                              </span>
                            </td>
                            <td className="px-2 py-3 text-right font-medium text-[#374151]">
                              ${combo.estUnitCost}
                            </td>
                            <td className="px-2 py-3 text-right font-medium text-[#374151]">
                              {combo.estSales?.toLocaleString()}
                            </td>
                            <td className="px-2 py-3 text-right font-medium text-[#374151]">
                              ${combo.estPrice}
                            </td>
                            <td className={`px-2 py-3 text-right font-bold ${combo.competitionScore > 1.0 ? 'text-red-500' : combo.competitionScore > 0.5 ? 'text-orange-500' : 'text-green-600'}`}>
                              {combo.competitionScore.toFixed(2)}
                            </td>
                            <td className="px-2 py-3 text-center">
                              <button 
                                onClick={() => handleDecision(combo.id, null)}
                                className="text-red-400 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors text-xs font-bold"
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
                  <div className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">本季開發計畫 - 綜合財務預估 (Summary)</div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">總開發件數</span>
                      <span className="text-lg font-bold">{devList.reduce((acc, curr) => acc + (curr.estSales || 0), 0).toLocaleString()} 件</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">總製造成本</span>
                      <span className="text-lg font-bold">${totalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col border-l border-gray-700 pl-4">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">總預估營收</span>
                      <span className="text-xl font-bold text-green-400">${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">綜合預估毛利率</span>
                      <span className="text-xl font-bold text-purple-400">{(totalAvgMargin * 100).toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 border-t border-gray-700 pt-3 text-right">
                    <button 
                      onClick={onSubmit}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold py-2 px-6 rounded shadow transition-colors"
                    >
                      確認基礎款清單，前往流行款決策 &rarr;
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
