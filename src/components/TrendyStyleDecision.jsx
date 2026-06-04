import React, { useState } from 'react';
import { predictPrice } from '../utils/pricePredictor';

const CATEGORY_ORDER = ['風格', '品項', '版型', '面料', '主色', '配色', '圖騰印花', '細節設計'];

export function TrendyStyleDecision({ elements, savedStyles, setSavedStyles, matrixState, requirements, isReadOnly = false, onSubmit }) {
  const [activeCategory, setActiveCategory] = useState(CATEGORY_ORDER[0]);
  const [selectedElements, setSelectedElements] = useState([]);
  const [styleName, setStyleName] = useState('');
  const [riskScore, setRiskScore] = useState(50);
  const [isPredicting, setIsPredicting] = useState(false);

  // Group elements by category
  const elementsByCategory = {};
  CATEGORY_ORDER.forEach(cat => {
    elementsByCategory[cat] = [];
  });
  
  if (elements) {
    elements.forEach(el => {
      let fitScore = 0;
      if (matrixState && requirements) {
        requirements.forEach(req => {
          const state = matrixState[req.id]?.[el.id];
          if (state === 'O') fitScore += req.weight;
          if (state === 'X') fitScore -= req.weight;
        });
      }
      el.fitScore = fitScore;
      
      if (elementsByCategory[el.category]) {
        elementsByCategory[el.category].push(el);
      }
    });
  }

  // Sort elements: trendy (score >= 5) first, then by score descending
  Object.keys(elementsByCategory).forEach(cat => {
    elementsByCategory[cat].sort((a, b) => {
      const scoreA = a.trendScore || 0;
      const scoreB = b.trendScore || 0;
      return scoreB - scoreA;
    });
  });

  const toggleElement = (el) => {
    if (selectedElements.find(e => e.id === el.id)) {
      setSelectedElements(selectedElements.filter(e => e.id !== el.id));
    } else {
      // Replace any existing element in the same category
      const nextSelected = selectedElements.filter(e => e.category !== el.category);
      nextSelected.push(el);
      setSelectedElements(nextSelected);
    }
  };

  const getMercariCategory = (itemName) => {
    if (!itemName) return 'Women/Other/Other';
    if (itemName.includes('外套') || itemName.includes('大衣')) return 'Women/Coats & Jackets/Other';
    if (itemName.includes('褲')) return 'Women/Pants/Other';
    if (itemName.includes('裙')) return 'Women/Skirts/Other';
    if (itemName.includes('洋裝') || itemName.includes('連身')) return 'Women/Dresses/Other';
    if (itemName.includes('T恤') || itemName.includes('上衣') || itemName.includes('襯衫')) return 'Women/Tops/T-shirts';
    return 'Women/Other/Other';
  };

  const handleSaveStyle = async () => {
    if (!styleName || selectedElements.length === 0) return;

    const requiredCategories = ['品項', '主色', '面料', '版型'];
    const missing = requiredCategories.filter(cat => !selectedElements.find(e => e.category === cat));
    if (missing.length > 0) {
      alert(`請完成必填類別才能構成服裝：${missing.join('、')}`);
      return;
    }

    setIsPredicting(true);
    
    let potentialScore = 0;
    const elementNames = [];
    selectedElements.forEach(el => {
      potentialScore += (typeof el.trendScore === 'number' ? el.trendScore : 0);
      elementNames.push(el.name);
    });

    const desc = selectedElements.map(e => e.enName || e.name).join(' ');
    const itemEl = selectedElements.find(e => e.category === '品項');
    const mappedCat = getMercariCategory(itemEl ? itemEl.name : '');
    
    // Convert name to english for prediction if possible (simple heuristic)
    let englishName = styleName;
    if (itemEl) englishName = englishName.replace(itemEl.name, itemEl.enName || itemEl.name);
    
    let estPrice = 0;
    try {
      estPrice = await predictPrice(englishName, desc, 'Nike', mappedCat, 1, 1);
      estPrice = estPrice * (0.85 + Math.random() * 0.3); // add 15% random noise
    } catch (e) {
      console.error(e);
      estPrice = Math.floor(1800 + Math.random() * 1200); // Random realistic price if AI fails
    }

    setSavedStyles([...savedStyles, {
      id: Date.now().toString(),
      name: styleName,
      elements: [...selectedElements],
      totalScore: potentialScore.toFixed(1),
      estPrice: estPrice,
      riskScore: riskScore
    }]);
    setStyleName('');
    setRiskScore(50);
    setSelectedElements([]);
    setIsPredicting(false);
  };

  const handleAutoDemo = async () => {
    setIsPredicting(true);
    const demoStyles = [];
    const stylePrefixes = ['初秋', '春日', '都會', '街頭', '復古', '未來', '極簡', '度假', '派對', '運動'];
    
    for (let i = 0; i < 20; i++) {
      const selected = [];
      let potentialScore = 0;
      let uncertainCount = 0;
      
      CATEGORY_ORDER.forEach(cat => {
        const els = elementsByCategory[cat] || [];
        if (els.length > 0) {
          const pickIndex = Math.floor(Math.pow(Math.random(), 2) * els.length); 
          const pickedEl = els[pickIndex];
          selected.push(pickedEl);
          potentialScore += (typeof pickedEl.trendScore === 'number' ? pickedEl.trendScore : 0);
          

        }
      });
      
      const itemEl = selected.find(e => e.category === '品項');
      const styleEl = selected.find(e => e.category === '風格');
      const prefix = stylePrefixes[Math.floor(Math.random() * stylePrefixes.length)];
      
      const prefixEnMap = {
        '初秋': 'fall', '春日': 'spring', '都會': 'urban', '街頭': 'streetwear', 
        '復古': 'vintage', '未來': 'futuristic', '極簡': 'minimalist', '度假': 'vacation', 
        '派對': 'party', '運動': 'athletic'
      };
      
      const name = `${prefix}${styleEl ? styleEl.name : ''}${itemEl ? itemEl.name : '新款設計'}`;
      const englishNameForAI = `${prefixEnMap[prefix] || 'new'} ${styleEl ? (styleEl.enName || styleEl.name) : ''} ${itemEl ? (itemEl.enName || itemEl.name) : 'design'}`;
      
      const descEn = selected.map(e => e.enName || e.name).join(' ');
      const mappedCat = getMercariCategory(itemEl ? itemEl.name : '');
      
      let estPrice = 0;
      try {
        estPrice = await predictPrice(englishNameForAI, descEn, 'Nike', mappedCat, 1, 1);
        estPrice = estPrice * (0.85 + Math.random() * 0.3); // add 15% random noise
      } catch (e) {
        estPrice = Math.floor(1800 + Math.random() * 1200); // Random realistic price if AI fails
      }
      
      demoStyles.push({
        id: `demo-${Date.now()}-${i}`,
        name: name,
        elements: selected,
        totalScore: potentialScore.toFixed(1),
        estPrice: estPrice,
        riskScore: Math.floor(Math.random() * 101)
      });
    }
    
    setSavedStyles(prev => [...prev, ...demoStyles]);
    setIsPredicting(false);
  };

  const handleDeleteStyle = (id) => {
    setSavedStyles(prev => prev.filter(style => style.id !== id));
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left: Element Library */}
      <div className="w-1/2 flex flex-col bg-white border border-[#d1d5db] rounded-lg shadow-sm overflow-hidden">
        <div className="bg-[#f3f4f6] px-4 py-3 border-b border-[#d1d5db] flex items-center justify-between shrink-0">
          <h2 className="font-bold text-content-main">設計元素庫</h2>
          <span className="text-xs text-[#6b7280]">結合數據與直覺，自由搭配</span>
        </div>
        
        {/* Category Tabs */}
        <div className="flex border-b border-[#d1d5db] bg-[#f9fafb] px-2 pt-2 shrink-0 overflow-x-auto gap-1">
          {CATEGORY_ORDER.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 border-b-2 font-medium text-xs whitespace-nowrap ${activeCategory === cat ? 'border-primary text-primary' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {elementsByCategory[activeCategory]?.map(el => {
              const isTrendy = el.trendScore >= 5;
              const isSelected = selectedElements.some(e => e.id === el.id);
              
              let spreadUp = null;
              let spreadDown = null;
              if (el.interval && el.trendScore !== undefined) {
                const ts = parseFloat(el.trendScore);
                if (Array.isArray(el.interval) && el.interval.length === 2) {
                  spreadUp = (el.interval[1] - ts).toFixed(1);
                  spreadDown = (ts - el.interval[0]).toFixed(1);
                } else if (el.interval.upper !== undefined && el.interval.lower !== undefined) {
                  spreadUp = (el.interval.upper - ts).toFixed(1);
                  spreadDown = (ts - el.interval.lower).toFixed(1);
                }
              }
              
              const safeTrendScore = typeof el.trendScore === 'number' ? el.trendScore : parseFloat(el.trendScore || 0);

              return (
                <div 
                  key={el.id}
                  onClick={() => toggleElement(el)}
                  className={`relative p-3 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'border-primary bg-primary-50 shadow-sm' 
                      : 'border-[#d1d5db] bg-white hover:border-[#9ca3af] hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-[#374151] text-sm leading-tight pr-4">{el.name}</span>
                    {isTrendy && <span className="text-xs shrink-0" title="流行趨勢預測達標">🔥</span>}
                  </div>
                  <div className="flex flex-col gap-1 mt-auto pt-2">
                    <div className="text-[10px] text-[#6b7280] bg-gray-100 px-1.5 py-0.5 rounded inline-block self-start">
                      流行度: <span className={isTrendy ? 'text-status-good-text font-bold' : ''}>{!isNaN(safeTrendScore) ? safeTrendScore.toFixed(1) : 0}</span>
                    </div>
                    {el.fitScore !== undefined && (
                      <div className="text-[10px] text-[#6b7280] bg-gray-100 px-1.5 py-0.5 rounded inline-block self-start mt-1">
                        品牌契合: <span className={el.fitScore >= 10 ? 'text-status-good-text font-bold' : el.fitScore > 0 ? 'text-status-warn-text font-bold' : 'text-status-bad-text font-bold'}>{el.fitScore} 分</span>
                      </div>
                    )}
                    {spreadUp !== null && !isNaN(spreadUp) && (
                      <div className="text-[9px] text-[#6b7280] font-medium">
                        變動區間: +{spreadUp} / -{spreadDown}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right: Designer Canvas & Output */}
      <div className="w-1/2 flex flex-col gap-4">
        {/* Canvas */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm flex flex-col shrink-0">
          <div className="bg-[#111827] px-4 py-3 border-b border-gray-700 rounded-t-lg flex justify-between items-center">
            <h2 className="font-bold text-white">設計畫布</h2>
            <div className="text-xs text-gray-400">目前選擇: {selectedElements.length} 個元素</div>
          </div>
          <div className="p-4">
            <div className="min-h-[120px] bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col gap-3 content-start mb-4">
              {selectedElements.length === 0 ? (
                <div className="w-full text-center text-gray-400 text-sm mt-8">
                  請從左側元素庫點擊加入元素，開始您的設計
                </div>
              ) : (
                CATEGORY_ORDER.map(cat => {
                  const elsInCat = selectedElements.filter(el => el.category === cat);
                  if (elsInCat.length === 0) return null;
                  
                  return (
                    <div key={cat} className="flex items-start gap-2 p-2 rounded-md border bg-white border-transparent">
                      <span className="text-xs font-bold text-gray-500 w-16 pt-1 shrink-0">{cat}</span>
                      <div className="flex flex-wrap gap-2 items-center flex-1">
                        {elsInCat.map((el, idx) => (
                          <React.Fragment key={el.id}>
                            <div className="shadow-sm rounded-md px-3 py-1.5 flex items-center gap-2 bg-white border border-gray-200">
                              <span className="font-bold text-sm text-gray-800">{el.name}</span>
                              {!isReadOnly && (
                                <button 
                                  onClick={() => toggleElement(el)}
                                  className="text-gray-400 hover:text-status-bad-text ml-1"
                                >×</button>
                              )}
                            </div>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {!isReadOnly && (
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={styleName}
                  onChange={e => setStyleName(e.target.value)}
                  placeholder="為這個新設計命名 (例如: 復古工裝飛行外套)" 
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-1 bg-gray-50">
                  <span className="text-xs font-bold text-gray-700 w-16">風險評估</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={riskScore}
                    onChange={e => setRiskScore(parseInt(e.target.value))}
                    className="w-16"
                    title="設定此組合的風險評估 (0=低風險, 100=高風險)"
                  />
                  <span className="text-xs font-bold text-status-bad-text w-4">{riskScore}</span>
                </div>
                <button 
                  onClick={handleSaveStyle}
                  disabled={!styleName || selectedElements.length === 0 || isPredicting}
                  className="bg-primary hover:bg-primary disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded shadow-sm text-sm transition-colors flex items-center gap-2"
                >
                  {isPredicting ? 'AI 估價中...' : '保存設計'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Candidates */}
        <div className="bg-white border border-[#d1d5db] rounded-lg shadow-sm flex-1 flex flex-col min-h-0">
          <div className="bg-[#f3f4f6] px-4 py-3 border-b border-[#d1d5db] flex items-center justify-between shrink-0">
            <h2 className="font-bold text-content-main">要開發的款式</h2>
            {!isReadOnly && (
              <button 
                onClick={handleAutoDemo}
                disabled={isPredicting}
                className={`text-xs font-bold px-3 py-1.5 rounded-md border transition-colors flex items-center gap-1 shadow-sm ${isPredicting ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200 hover:bg-indigo-200'}`}
              >
                {isPredicting ? 'AI 大量推論中...' : '✨ 一鍵 Demo (生成20款)'}
              </button>
            )}
          </div>
          <div className="p-4 flex-1 overflow-y-auto bg-gray-50">
            {savedStyles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
                <div>尚未保存任何設計</div>
                <div className="text-xs">設計完成後將出現於此，並等待送交人工分析審查</div>
              </div>
            ) : (
              <div className="space-y-4">
                {savedStyles.map(style => (
                  <div 
                    key={style.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow bg-white relative overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-content-main text-lg">{style.name}</h3>
                      <div className="flex items-center gap-3">
                        <div className={`text-xs font-bold px-2 py-1 rounded border ${(style.riskScore || 50) >= 80 ? 'bg-status-bad-bg text-status-bad-text border-status-bad-border' : (style.riskScore || 50) >= 50 ? 'bg-status-warn-bg text-status-warn-text border-status-warn-border' : 'bg-status-good-bg text-status-good-text border-status-good-border'}`}>
                          風險值: {style.riskScore || 50}/100
                        </div>
                        <div className="text-xs font-bold bg-white text-content-main px-2 py-1 rounded border border-[#d1d5db]">
                          AI 預估售價: ${style.estPrice?.toFixed(0)}
                        </div>
                        <div className="text-xs font-bold bg-status-good-bg text-status-good-text px-2 py-1 rounded border border-status-good-border">
                          總流行力: {style.totalScore}
                        </div>
                        {!isReadOnly && (
                          <button 
                            onClick={() => handleDeleteStyle(style.id)}
                            className="text-xs text-status-bad-text hover:text-status-bad-text hover:bg-status-bad-bg px-2 py-1 rounded transition-colors font-bold"
                          >
                            刪除
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-3">
                      {CATEGORY_ORDER.map(cat => {
                        const elsInCat = style.elements.filter(el => el.category === cat);
                        if (elsInCat.length === 0) return null;
                        const isUncertain = elsInCat.length > 1;
                        
                        return (
                          <div key={cat} className="flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-gray-400 w-12">{cat}</span>
                            {elsInCat.map((el, idx) => (
                              <React.Fragment key={el.id}>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${el.trendScore >= 5 ? 'bg-status-good-bg text-status-good-text border border-status-good-border' : 'bg-gray-100 text-gray-600'}`}>
                                  {el.name} {el.trendScore >= 5 && '🔥'}
                                </span>
                              </React.Fragment>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="p-4 border-t border-gray-200 shrink-0">
             {!isReadOnly ? (
               <button 
    disabled={savedStyles.length === 0}
    onClick={() => {
      alert('已成功送交！');
      if(onSubmit) onSubmit();
    }}
    className="w-full bg-[#111827] hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold py-3 px-4 rounded shadow transition-colors text-sm"
  >
                確認並全部送交人工分析 &rarr;
              </button>
             ) : (
               <div className="text-center text-xs text-gray-400 italic">此模式為唯讀，不可編輯</div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
