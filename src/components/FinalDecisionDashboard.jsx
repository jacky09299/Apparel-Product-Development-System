import React, { useMemo, useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, TrendingUp, Activity, Plus, Trash2 } from 'lucide-react';

export function FinalDecisionDashboard({ savedStyles, setSavedStyles, onSubmit }) {
  // Styles that went to crowd prediction
  const predictionStyles = useMemo(() => savedStyles.filter(s => s.needsPrediction), [savedStyles]);
  
  const [activeTab, setActiveTab] = useState(predictionStyles.length > 0 ? predictionStyles[0].id : null);

  useEffect(() => {
    if (predictionStyles.length > 0 && !predictionStyles.find(s => s.id === activeTab)) {
      setActiveTab(predictionStyles[0].id);
    }
  }, [predictionStyles, activeTab]);

  // Generate mock variants for each campaign
  const campaignDataMap = useMemo(() => {
    const map = {};
    predictionStyles.forEach((style, index) => {
      const baseSales = 10000 + (index * 2500) + ((style.id.charCodeAt(style.id.length-1) % 5) * 1000);
      const baseCost = 200 + ((style.id.charCodeAt(0) % 5) * 50);
      
      const extraElements = ['金屬扣環', '特殊剪裁', '漸層染色', '異材質拼接', '刺繡圖騰', '高飽和撞色', '防水塗層', '防風面料', '仿舊處理', '機能口袋', '不對稱設計', '鏤空細節', '反光條', '抽繩抓皺', '編織綁帶'];
      const combinations = [];
      for (let i = 1; i <= 16; i++) {
        const salesDelta = (i % 2 === 0 ? 1 : -1) * (i * 300) + ((i * 17) % 500);
        const costDelta = (i % 3) * 15 - 10;
        const trendBonus = (i % 5);
        const fitBonus = (i % 4);
        
        const el1 = extraElements[(i * 3 + index) % extraElements.length];
        const el2 = extraElements[(i * 7 + index) % extraElements.length];
        const comboName = i === 1 ? `${style.name} (原組合)` : `${style.name} x ${el1}` + (i % 3 === 0 ? ` x ${el2}` : '');
        
        combinations.push({
          id: `${style.id}-${i}`,
          name: comboName,
          sales: baseSales + salesDelta,
          conf: 70 + (i % 25),
          cost: baseCost + costDelta,
          margin: 35 + (i % 20),
          trendScore: 5 + trendBonus,
          fitScore: 8 + fitBonus
        });
      }
      map[style.id] = combinations.sort((a, b) => b.sales - a.sales);
    });
    return map;
  }, [predictionStyles]);

  const handleSelectCombo = (styleId, comboId, comboName) => {
    setSavedStyles(prev => prev.map(s => {
      if (s.id === styleId) {
        return {
          ...s,
          selectedPredictionComboId: comboId,
          selectedPredictionComboName: comboName,
          predictionApproved: true // Marks it as approved for DevelopmentList
        };
      }
      return s;
    }));
  };

  const handleRemoveCombo = (styleId) => {
    setSavedStyles(prev => prev.map(s => {
      if (s.id === styleId) {
        return {
          ...s,
          selectedPredictionComboId: null,
          predictionApproved: false
        };
      }
      return s;
    }));
  };

  const handleDemoFill = () => {
    setSavedStyles(prev => prev.map(s => {
      if (!s.needsPrediction) return s;
      const combos = campaignDataMap[s.id];
      if (!combos || combos.length === 0) return s;
      // Auto-select the top combination (highest sales) for each campaign
      return {
        ...s,
        selectedPredictionComboId: combos[0].id,
        selectedPredictionComboName: combos[0].name,
        predictionApproved: true
      };
    }));
  };

  // Build the list of selected combinations for the right panel
  const selectedList = useMemo(() => {
    const list = [];
    predictionStyles.forEach((style, index) => {
      if (style.selectedPredictionComboId) {
        const combos = campaignDataMap[style.id] || [];
        const selectedCombo = combos.find(c => c.id === style.selectedPredictionComboId);
        if (selectedCombo) {
          const price = Math.round(selectedCombo.cost / (1 - (selectedCombo.margin / 100))) || 800;
          const fixedCost = 15000 + (index * 2000);
          
          list.push({
            ...style,
            comboData: selectedCombo,
            estSales: selectedCombo.sales,
            estPrice: price,
            estUnitCost: selectedCombo.cost,
            estFixedCost: fixedCost,
            estVariableCost: selectedCombo.cost,
            estMargin: selectedCombo.margin
          });
        }
      }
    });

    // Calculate competition score dynamically
    return list.map(itemA => {
      let compScore = 0;
      list.forEach(itemB => {
        if (itemA.id !== itemB.id) {
           // Mock similarity based on character overlap in combo name
           const setA = new Set(itemA.comboData.name.split(''));
           const setB = new Set(itemB.comboData.name.split(''));
           let intersection = 0;
           for (let char of setA) {
             if (setB.has(char)) intersection++;
           }
           const union = setA.size + setB.size - intersection;
           const sim = union === 0 ? 0 : intersection / union;
           compScore += (sim * 1.5); // scaling for realistic look
        }
      });
      return { ...itemA, competitionScore: compScore };
    });
  }, [predictionStyles, campaignDataMap]);

  const pendingCount = predictionStyles.length - selectedList.length;
  
  const totalFixedCost = selectedList.reduce((acc, curr) => acc + curr.estFixedCost, 0);
  const totalVariableCost = selectedList.reduce((acc, curr) => acc + (curr.estVariableCost * curr.estSales), 0);
  const totalCost = totalFixedCost + totalVariableCost;
  const totalRevenue = selectedList.reduce((acc, curr) => acc + (curr.estPrice * curr.estSales), 0);
  const totalAvgMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0;

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 animate-in fade-in duration-200">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            預測結果與最終開發計畫 (商品企劃)
          </h2>
          <p className="text-sm text-gray-500 mt-1">從左側各活動中挑選最適合的「一個組合」加入右側決策總表，系統將動態計算競爭值。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-bold text-gray-700">尚未決策活動：</span>
            <span className={`font-mono ml-1 ${pendingCount > 0 ? 'text-red-500 font-bold' : 'text-green-600 font-bold'}`}>{pendingCount}</span> 個
          </div>
          <button
            onClick={handleDemoFill}
            className="px-4 py-2 rounded-md font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm"
          >
            ✨ DEMO 自動選取最高銷量
          </button>
          <button
            onClick={onSubmit}
            disabled={pendingCount > 0}
            className={`px-4 py-2 rounded-md font-bold flex items-center gap-2 transition-colors ${
              pendingCount === 0 
                ? 'bg-primary text-white hover:bg-primary/90 shadow' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <CheckCircle2 size={18} />
            完成計畫並送出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 overflow-hidden flex-1 pb-4">
        
        {/* Left Side: Campaign Data */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm flex flex-col h-full min-h-0">
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 shrink-0 hide-scrollbar">
            {predictionStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setActiveTab(style.id)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 flex items-center gap-2 ${
                  activeTab === style.id 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {style.selectedPredictionComboId && <CheckCircle2 size={14} className="text-green-500" />}
                {style.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {activeTab ? (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-blue-600" />
                    組合預測明細
                  </div>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-[#374151]">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs text-[#6b7280]">
                      <tr>
                        <th className="px-3 py-2 font-medium">組合名稱</th>
                        <th className="px-2 py-2 font-medium text-right">預測銷量</th>
                        <th className="px-2 py-2 font-medium text-right">預測信心值</th>
                        <th className="px-2 py-2 font-medium text-right">預估成本</th>
                        <th className="px-2 py-2 font-medium text-right">預估毛利率</th>
                        <th className="px-2 py-2 font-medium text-right">總流行分數</th>
                        <th className="px-2 py-2 font-medium text-right">總契合度</th>
                        <th className="px-2 py-2 font-medium text-center">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(campaignDataMap[activeTab] || []).map((variant, idx) => {
                        const isSelected = predictionStyles.find(s => s.id === activeTab)?.selectedPredictionComboId === variant.id;
                        return (
                          <tr key={variant.id} className={`${isSelected ? 'bg-green-50/50 ring-1 ring-green-200' : 'hover:bg-gray-50'} transition-colors`}>
                            <td className="px-3 py-3 font-bold text-gray-800">
                              {variant.name}
                            </td>
                            <td className="px-2 py-3 text-right font-black text-blue-700">{variant.sales.toLocaleString()}</td>
                            <td className="px-2 py-3 text-right font-medium">{variant.conf}%</td>
                            <td className="px-2 py-3 text-right font-medium">${variant.cost}</td>
                            <td className="px-2 py-3 text-right font-medium text-purple-600">{variant.margin}%</td>
                            <td className="px-2 py-3 text-right font-medium">{variant.trendScore}</td>
                            <td className="px-2 py-3 text-right font-medium">{variant.fitScore}</td>
                            <td className="px-2 py-3 text-center">
                              {isSelected ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded border border-green-200">
                                  <CheckCircle2 size={12} /> 已選取
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleSelectCombo(activeTab, variant.id, variant.name)}
                                  className="text-xs font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-primary px-3 py-1 rounded transition-colors flex items-center justify-center gap-1 w-full"
                                >
                                  <Plus size={12} /> 加入決策
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                尚未建立任何預測活動
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Decision Summary Table */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm flex flex-col h-full min-h-0">
          <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb] rounded-t-lg shrink-0 flex justify-between items-center">
            <h3 className="text-lg font-bold text-content-main">開發決策總表</h3>
            <span className="text-xs text-gray-500 font-bold bg-white px-2 py-1 rounded border border-gray-200">
              已選定 {selectedList.length} / {predictionStyles.length} 款
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            {selectedList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                尚未從左側活動中選取任何組合
              </div>
            ) : (
              <table className="w-full text-left text-sm text-[#374151]">
                <thead className="bg-white sticky top-0 text-xs text-[#6b7280] shadow-sm z-10">
                  <tr>
                    <th className="px-3 py-2 font-medium">選定組合名稱</th>
                    <th className="px-2 py-2 font-medium text-right">單件總成本</th>
                    <th className="px-2 py-2 font-medium text-right">預估銷量</th>
                    <th className="px-2 py-2 font-medium text-right">預估售價</th>
                    <th className="px-2 py-2 font-medium text-right" title="依據和其他已選組合的相似度動態計算">競爭值</th>
                    <th className="px-3 py-2 font-medium text-center">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {selectedList.map(item => (
                    <tr key={`dev-${item.id}`} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 py-3 font-medium text-content-main max-w-[140px] truncate" title={item.comboData.name}>
                        {item.comboData.name}
                      </td>
                      <td className="px-2 py-3 text-right font-medium text-[#374151]">
                        ${item.estUnitCost}
                      </td>
                      <td className="px-2 py-3 text-right font-medium text-[#374151]">
                        {item.estSales?.toLocaleString()}
                      </td>
                      <td className="px-2 py-3 text-right font-medium text-[#374151]">
                        ${item.estPrice}
                      </td>
                      <td className={`px-2 py-3 text-right font-bold ${item.competitionScore > 0.6 ? 'text-status-warn-text' : 'text-status-good-text'}`}>
                        {item.competitionScore.toFixed(2)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <button 
                          onClick={() => handleRemoveCombo(item.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors"
                          title="移除此組合"
                        >
                          <Trash2 size={16} />
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
            <div className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">本季最終決策 - 綜合財務預估 (Summary)</div>
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
          </div>
        </div>

      </div>
    </div>
  );
}
