import React, { useMemo, useState, useEffect } from 'react';
import { BarChart3, CheckCircle2, TrendingUp, Activity, Target, ThumbsUp, ThumbsDown, Package } from 'lucide-react';

export function FinalDecisionDashboard({ savedStyles, setSavedStyles, onSubmit }) {
  // Styles that went to crowd prediction
  const predictionStyles = useMemo(() => savedStyles.filter(s => s.needsPrediction), [savedStyles]);
  
  const [activeTab, setActiveTab] = useState(predictionStyles.length > 0 ? predictionStyles[0].id : null);

  // Auto-select first tab if activeTab is not found
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
        // pseudo-random logic based on index
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

  // Calculate extended properties for the summary table
  const extendedStyles = useMemo(() => {
    return predictionStyles.map((style, index) => {
      // Pick the winning variant (highest sales) for the summary logic
      const variants = campaignDataMap[style.id] || [];
      const winner = variants[0];
      
      const price = Math.round(winner?.cost / (1 - (winner?.margin / 100))) || 800;
      const sales = winner?.sales || 0;
      const unitCost = winner?.cost || 300;
      const fixedCost = 15000 + (index * 2000); // Mock fixed cost
      
      // Calculate competition score mock
      const compScore = 0.4 + ((index % 3) * 0.2);

      return {
        ...style,
        estSales: sales,
        estPrice: price,
        estUnitCost: unitCost,
        estFixedCost: fixedCost,
        estVariableCost: unitCost,
        competitionScore: compScore,
        estMargin: winner?.margin || 40
      };
    });
  }, [predictionStyles, campaignDataMap]);

  const handleDecision = (id, decision) => {
    setSavedStyles(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          predictionApproved: decision === 'approve',
          predictionRejected: decision === 'reject'
        };
      }
      return s;
    }));
  };

  const handleDemoFill = () => {
    setSavedStyles(prev => prev.map((s, index) => {
      if (!s.needsPrediction || s.predictionApproved || s.predictionRejected) return s;
      const approved = index % 3 !== 2;
      return {
        ...s,
        predictionApproved: approved,
        predictionRejected: !approved
      };
    }));
  };

  // Compute Summary logic for approved items
  const approvedList = extendedStyles.filter(s => s.predictionApproved);
  const pendingCount = extendedStyles.filter(s => !s.predictionApproved && !s.predictionRejected).length;
  
  const totalFixedCost = approvedList.reduce((acc, curr) => acc + curr.estFixedCost, 0);
  const totalVariableCost = approvedList.reduce((acc, curr) => acc + (curr.estVariableCost * curr.estSales), 0);
  const totalCost = totalFixedCost + totalVariableCost;
  const totalRevenue = approvedList.reduce((acc, curr) => acc + (curr.estPrice * curr.estSales), 0);
  const totalAvgMargin = totalRevenue > 0 ? (totalRevenue - totalCost) / totalRevenue : 0;

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 animate-in fade-in duration-200">
      <div className="mb-6 flex justify-between items-end shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            預測結果與最終開發計畫 (商品企劃)
          </h2>
          <p className="text-sm text-gray-500 mt-1">請檢視各活動之組合數據，並於右側決策總表進行最終開發決議。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-bold text-gray-700">待決策：</span>
            <span className={`font-mono ml-1 ${pendingCount > 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{pendingCount}</span> 款
          </div>
          <button
            onClick={handleDemoFill}
            className="px-4 py-2 rounded-md font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm"
          >
            ✨ DEMO 自動決策
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
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50 shrink-0 hide-scrollbar">
            {predictionStyles.map(style => (
              <button
                key={style.id}
                onClick={() => setActiveTab(style.id)}
                className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-colors border-b-2 ${
                  activeTab === style.id 
                    ? 'border-primary text-primary bg-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {style.name}
              </button>
            ))}
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {activeTab ? (
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  活動預測數據明細
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(campaignDataMap[activeTab] || []).map((variant, idx) => (
                        <tr key={variant.id} className={`${idx === 0 ? 'bg-blue-50/50' : ''} hover:bg-gray-50 transition-colors`}>
                          <td className="px-3 py-3 font-bold text-gray-800 flex items-center gap-2">
                            {idx === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-black border border-blue-200">WIN</span>}
                            {variant.name}
                          </td>
                          <td className="px-2 py-3 text-right font-black text-blue-700">{variant.sales.toLocaleString()}</td>
                          <td className="px-2 py-3 text-right font-medium">{variant.conf}%</td>
                          <td className="px-2 py-3 text-right font-medium">${variant.cost}</td>
                          <td className="px-2 py-3 text-right font-medium text-purple-600">{variant.margin}%</td>
                          <td className="px-2 py-3 text-right font-medium">{variant.trendScore}</td>
                          <td className="px-2 py-3 text-right font-medium">{variant.fitScore}</td>
                        </tr>
                      ))}
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
          <div className="p-4 border-b border-[#e5e7eb] bg-[#f9fafb] rounded-t-lg shrink-0">
            <h3 className="text-lg font-bold text-content-main">開發決策總表</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-0">
            <table className="w-full text-left text-sm text-[#374151]">
              <thead className="bg-white sticky top-0 text-xs text-[#6b7280] shadow-sm z-10">
                <tr>
                  <th className="px-3 py-2 font-medium">款式名稱</th>
                  <th className="px-2 py-2 font-medium text-right">單件總成本</th>
                  <th className="px-2 py-2 font-medium text-right">預估銷量</th>
                  <th className="px-2 py-2 font-medium text-right">預估售價</th>
                  <th className="px-2 py-2 font-medium text-right">競爭值</th>
                  <th className="px-3 py-2 font-medium text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {extendedStyles.map(combo => (
                  <tr key={`dev-${combo.id}`} className={`hover:bg-gray-50 transition-colors ${combo.predictionApproved ? 'bg-green-50/30' : combo.predictionRejected ? 'bg-gray-50/50 opacity-60' : ''}`}>
                    <td className="px-3 py-3 font-medium text-content-main max-w-[140px] truncate" title={combo.name}>
                      {combo.name}
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
                    <td className={`px-2 py-3 text-right font-bold ${combo.competitionScore > 0.6 ? 'text-status-warn-text' : 'text-status-good-text'}`}>
                      {combo.competitionScore.toFixed(2)}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {combo.predictionApproved && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold border border-green-200">已核准</span>}
                        {combo.predictionRejected && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-bold border border-gray-200">已淘汰</span>}
                        {!combo.predictionApproved && !combo.predictionRejected && (
                          <>
                            <button 
                              onClick={() => handleDecision(combo.id, 'approve')}
                              className="text-white bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-xs font-bold transition-colors"
                            >
                              核准
                            </button>
                            <button 
                              onClick={() => handleDecision(combo.id, 'reject')}
                              className="text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold transition-colors"
                            >
                              淘汰
                            </button>
                          </>
                        )}
                        {(combo.predictionApproved || combo.predictionRejected) && (
                           <button 
                             onClick={() => handleDecision(combo.id, 'reset')}
                             className="text-gray-400 hover:text-gray-600 text-xs ml-1 underline"
                           >
                             重設
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {extendedStyles.length === 0 && (
                  <tr>
                     <td colSpan={6} className="text-center py-8 text-gray-400">目前沒有需要決策的項目</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Portfolio Summary Dashboard */}
          <div className="bg-[#111827] text-white rounded-b-lg shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] p-5">
            <div className="text-xs font-bold text-gray-400 mb-3 border-b border-gray-700 pb-2">核准預測開發 - 綜合財務預估 (Summary)</div>
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
                <span className="text-xl font-bold text-primary">{(totalAvgMargin * 100).toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
