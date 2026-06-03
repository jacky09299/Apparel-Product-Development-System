import React, { useState, useEffect, useMemo } from 'react';
import { Shirt, Smartphone, Layers, Plus, Trash2, CheckCircle, ChevronRight, CheckSquare, Square, Combine, PenTool, Send, Check } from 'lucide-react';

export function Step2CrowdPrediction({ savedStyles = [] }) {
  const [selectedBases, setSelectedBases] = useState([]);
  const [activeStep, setActiveStep] = useState(1);
  
  const [addedPoolElements, setAddedPoolElements] = useState({});
  const [newElementInputs, setNewElementInputs] = useState({});
  const [dbElements, setDbElements] = useState([]);

  // Merging Categories State
  const [categoryGroups, setCategoryGroups] = useState([
    ['風格'], ['品項'], ['版型'], ['面料'], ['主色'], ['配色'], ['圖騰印花'], ['細節設計']
  ]);
  const [selectedForMerge, setSelectedForMerge] = useState([]);

  // Signoff state
  const [approvals, setApprovals] = useState({ designer: false, analyst: false, pm: false });

  const POOL_CATEGORIES = ['風格', '品項', '版型', '面料', '主色', '配色', '圖騰印花', '細節設計'];

  useEffect(() => {
    const baseUrl = import.meta.env ? import.meta.env.BASE_URL : '/';
    fetch(baseUrl + 'db.json?v=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setDbElements(data.ai_trend_elements || []);
      })
      .catch(err => console.error(err));
  }, []);

  const unifiedPool = useMemo(() => {
    const pool = {};
    categoryGroups.forEach(group => { 
       const groupKey = group.join(' + ');
       pool[groupKey] = new Set(); 
    });
    
    selectedBases.forEach(style => {
      if (style.elements) {
         const styleCatMap = {};
         style.elements.forEach(el => {
            styleCatMap[el.category] = el.name || el.label;
         });
         
         categoryGroups.forEach(group => {
            const groupKey = group.join(' + ');
            const combinedVal = group.map(c => styleCatMap[c]).filter(Boolean).join(' x ');
            if (group.length > 1 && combinedVal && group.every(c => styleCatMap[c])) {
               pool[groupKey].add(combinedVal);
            } else if (group.length === 1 && styleCatMap[group[0]]) {
               pool[groupKey].add(styleCatMap[group[0]]);
            }
         });
      }
    });
    return pool;
  }, [selectedBases, categoryGroups]);

  const getElementsForCat = (catKey) => {
    const base = Array.from(unifiedPool[catKey] || []);
    const added = addedPoolElements[catKey] || [];
    return [...base, ...added];
  };

  const handleSelectBase = (style) => {
    if (selectedBases.find(s => s.id === style.id)) {
      setSelectedBases(selectedBases.filter(s => s.id !== style.id));
    } else {
      if (selectedBases.length >= 5) {
        alert('依規定只能選取 5 款流行款式進行測試。');
        return;
      }
      setSelectedBases([...selectedBases, style]);
    }
  };

  const renderStep1 = () => {
    const sortedStyles = [...savedStyles].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

    return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded flex justify-between items-center">
        <div>
          <span className="font-bold block">1. 選擇高風險流行款式 ({selectedBases.length}/5)</span>
          <span className="text-xs">系統已為您自動依據「風險評估」排序。請挑選出 5 款高風險組合，準備進行後續測試。</span>
        </div>
        <button 
          disabled={selectedBases.length !== 5}
          onClick={() => { setActiveStep(2); }}
          className="bg-orange-600 text-white px-4 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-orange-700"
        >
          下一步：進入類別合併
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sortedStyles.map(style => {
          const isSelected = selectedBases.find(s => s.id === style.id);
          const riskLevel = style.riskScore || 50;
          return (
            <div 
              key={style.id} 
              onClick={() => handleSelectBase(style)}
              className={`border p-4 rounded cursor-pointer transition-all ${isSelected ? 'border-orange-500 ring-2 ring-orange-500 bg-orange-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-content-main">{style.name}</h4>
                {isSelected ? <CheckSquare className="text-orange-500" size={20} /> : <Square className="text-gray-400" size={20} />}
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {style.elements?.slice(0, 4).map((e, i) => (
                  <span key={i} className="bg-white border border-gray-200 text-gray-600 text-[10px] px-1.5 py-0.5 rounded">
                    {e.name || e.label}
                  </span>
                ))}
                {style.elements?.length > 4 && <span className="text-[10px] text-gray-400">...</span>}
              </div>
              <div className="mt-3 flex justify-between items-center text-xs border-t pt-2 border-gray-200">
                <span className="text-gray-500">預估售價: <span className="font-bold text-gray-700">${style.estPrice?.toLocaleString()}</span></span>
                <span className={`font-bold px-2 py-1 rounded ${riskLevel >= 80 ? 'bg-status-bad-bg text-status-bad-text' : riskLevel >= 50 ? 'bg-status-warn-bg text-status-warn-text' : 'bg-status-good-bg text-status-good-text'}`}>
                  風險評估: {riskLevel}/100
                </span>
              </div>
            </div>
          );
        })}
        {savedStyles.length === 0 && (
          <div className="col-span-3 text-center py-10 text-gray-500">
            目前沒有儲存的款式。請先回到 Step 1 新增款式。
          </div>
        )}
      </div>
    </div>
  )};

  const handleMerge = () => {
    if (selectedForMerge.length < 2) return;
    const catsToMerge = selectedForMerge.flatMap(k => k.split(' + '));
    const newGroups = categoryGroups.filter(g => !selectedForMerge.includes(g.join(' + ')));
    newGroups.push(catsToMerge);
    setCategoryGroups(newGroups);
    setSelectedForMerge([]);
  };

  const handleUnmerge = (groupKey) => {
    const cats = groupKey.split(' + ');
    const newGroups = categoryGroups.filter(g => g.join(' + ') !== groupKey);
    cats.forEach(c => newGroups.push([c]));
    setCategoryGroups(newGroups);
  };

  const renderMergeCategories = () => {
    return (
      <div className="flex flex-col h-full bg-white border border-gray-300 rounded-lg p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-content-main">2. 類別合併綁定</h3>
            <p className="text-sm text-gray-500 mt-1">在進入拆解池之前，為避免產生不合理的選項組合，您可以預先合併某些類別（例如：將「版型」與「品項」合併）。合併後，系統將只會抓取那 5 款組合中實際存在的「合理搭配」進入拆解池。</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveStep(1)} className="text-gray-600 px-4 py-2 font-bold hover:bg-gray-100 rounded">
              &larr; 上一步
            </button>
            <button 
              onClick={() => setActiveStep(3)}
              className="bg-primary text-white px-4 py-2 rounded font-bold hover:bg-blue-700 shadow"
            >
              下一步：進入拆解池 &rarr;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-gray-800">1. 勾選欲合併的類別</h4>
               <button 
                 onClick={handleMerge}
                 disabled={selectedForMerge.length < 2}
                 className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50 hover:bg-purple-700 transition-colors flex items-center gap-1 shadow-sm"
               >
                 <Combine size={14} /> 合併選取項
               </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {categoryGroups.map((group, idx) => {
                const groupKey = group.join(' + ');
                const isSelected = selectedForMerge.includes(groupKey);
                return (
                  <div key={idx} className={`p-3 border rounded-lg flex items-center justify-between transition-colors ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white hover:border-purple-300'}`}>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          if(e.target.checked) setSelectedForMerge([...selectedForMerge, groupKey]);
                          else setSelectedForMerge(selectedForMerge.filter(k => k !== groupKey));
                        }}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-bold text-sm text-gray-700">{groupKey}</span>
                    </label>
                    {group.length > 1 && (
                      <button onClick={() => handleUnmerge(groupKey)} className="text-xs text-status-bad-text hover:text-status-bad-text font-bold px-2 py-1 bg-status-bad-bg rounded">
                        解綁
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-purple-200 rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-bold text-purple-800 mb-2">2. 合併結果預覽</h4>
            <p className="text-xs text-gray-500 mb-4">這些將是拆解池中的分類基準。若有合併的類別，其選項將直接取自 5 款高風險組合內實際出現過的配對：</p>
            <div className="space-y-3">
              {categoryGroups.map((group, idx) => {
                const groupKey = group.join(' + ');
                const items = Array.from(unifiedPool[groupKey] || []);
                return (
                  <div key={idx} className="border border-gray-100 rounded bg-gray-50 p-2">
                    <div className="text-xs font-bold text-gray-700 mb-1">{groupKey}</div>
                    <div className="flex flex-wrap gap-1">
                      {items.length === 0 && <span className="text-[10px] text-gray-400">目前無對應元素</span>}
                      {items.map((item, i) => (
                        <span key={i} className="text-[10px] bg-white border border-gray-300 px-1.5 py-0.5 rounded">{item}</span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderElementPool = () => {
    return (
      <div className="flex flex-col h-full bg-white border border-gray-300 rounded-lg p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h3 className="text-xl font-bold text-content-main">3. 統一元素拆解池</h3>
            <p className="text-sm text-gray-500 mt-1">系統已依據您設定的類別維度，將 5 款組合的元素打散匯入。您可以在此加入更多潛在選項，豐富群眾測試的可能性。</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveStep(2)} className="text-gray-600 px-4 py-2 font-bold hover:bg-gray-100 rounded">
              &larr; 上一步
            </button>
            <button 
              onClick={() => { setActiveStep(4); }}
              className="bg-status-good-bg text-white px-4 py-2 rounded font-bold hover:bg-green-700 shadow"
            >
              下一步：發布與簽核 &rarr;
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {categoryGroups.map(group => {
            const groupKey = group.join(' + ');
            const allElements = getElementsForCat(groupKey);
            return (
              <div key={groupKey} className="border border-gray-200 rounded-lg bg-gray-50 p-4">
                <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">{groupKey}</h4>
                <div className="flex flex-wrap gap-2 mb-4 min-h-[40px]">
                  {allElements.length === 0 && <span className="text-xs text-gray-400">無元素</span>}
                  {allElements.map((el, idx) => (
                    <div key={idx} className="bg-white border border-gray-300 text-gray-700 text-xs px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
                      {el}
                      {(addedPoolElements[groupKey] || []).includes(el) && (
                        <button 
                          onClick={() => setAddedPoolElements(prev => ({
                            ...prev,
                            [groupKey]: prev[groupKey].filter(e => e !== el)
                          }))}
                          className="text-gray-400 hover:text-status-bad-text ml-1"
                        >
                          <Trash2 size={10} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 w-full">
                  {group.length === 1 ? (
                    <>
                      <input 
                        type="text" 
                        list={`datalist-${group[0]}`}
                        value={newElementInputs[group[0]] || ''}
                        onChange={e => setNewElementInputs({...newElementInputs, [group[0]]: e.target.value})}
                        placeholder={`新增${group[0]}...`}
                        className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && newElementInputs[group[0]]?.trim()) {
                            setAddedPoolElements(prev => ({
                              ...prev,
                              [groupKey]: [...(prev[groupKey] || []), newElementInputs[group[0]].trim()]
                            }));
                            setNewElementInputs({...newElementInputs, [group[0]]: ''});
                          }
                        }}
                      />
                      <datalist id={`datalist-${group[0]}`}>
                        {dbElements.filter(e => e.category === group[0]).map((e, idx) => (
                          <option key={idx} value={e.name || e.label} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <div className="flex flex-1 gap-1 min-w-0 items-center">
                      {group.map((subCat, sIdx) => (
                        <div key={subCat} className="flex-1 min-w-0 flex items-center gap-1">
                          {sIdx > 0 && <span className="text-gray-400 text-xs shrink-0">x</span>}
                          <input 
                            type="text" 
                            list={`datalist-${subCat}`}
                            value={newElementInputs[subCat] || ''}
                            onChange={e => setNewElementInputs({...newElementInputs, [subCat]: e.target.value})}
                            placeholder={`${subCat}`}
                            className="w-full min-w-0 border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-blue-500"
                          />
                          <datalist id={`datalist-${subCat}`}>
                            {dbElements.filter(e => e.category === subCat).map((e, idx) => (
                              <option key={idx} value={e.name || e.label} />
                            ))}
                          </datalist>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (group.length === 1) {
                        if (newElementInputs[group[0]]?.trim()) {
                          setAddedPoolElements(prev => ({
                            ...prev,
                            [groupKey]: [...(prev[groupKey] || []), newElementInputs[group[0]].trim()]
                          }));
                          setNewElementInputs({...newElementInputs, [group[0]]: ''});
                        }
                      } else {
                        if (group.every(c => newElementInputs[c]?.trim())) {
                          const combinedVal = group.map(c => newElementInputs[c].trim()).join(' x ');
                          setAddedPoolElements(prev => ({
                            ...prev,
                            [groupKey]: [...(prev[groupKey] || []), combinedVal]
                          }));
                          const newInputs = {...newElementInputs};
                          group.forEach(c => newInputs[c] = '');
                          setNewElementInputs(newInputs);
                        } else {
                          alert('請為組合的每一個類別輸入或選擇選項！');
                        }
                      }
                    }}
                    className="bg-gray-200 text-gray-700 px-2 rounded hover:bg-gray-300 shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPublishSignoff = () => {
    let totalCombinations = 1;
    categoryGroups.forEach(group => {
      const groupKey = group.join(' + ');
      const els = getElementsForCat(groupKey);
      if (els.length > 0) totalCombinations *= els.length;
    });
    
    const allApproved = approvals.designer && approvals.analyst && approvals.pm;

    return (
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="flex-1 max-w-4xl mx-auto w-full space-y-6 pt-4">
          <button onClick={() => setActiveStep(3)} className="text-primary text-sm font-bold flex items-center mb-2 hover:underline">
            &larr; 返回元素拆解池
          </button>
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg p-8">
            <div className="flex items-center gap-3 mb-6 border-b pb-4">
              <div className="bg-status-good-bg text-status-good-text p-3 rounded-full">
                <Send size={28} />
              </div>
              <div>
                <h3 className="text-2xl font-black text-content-main">準備發布群眾預測 (A/B 測試)</h3>
                <p className="text-sm text-gray-500 mt-1">系統已打包完成，即將將以下測試項目推播至會員 APP 與社群進行轉換率測試。</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                <div className="text-sm text-gray-500 mb-2 font-bold flex items-center gap-2">
                  <Shirt size={16} /> 測試高風險款式
                </div>
                <div className="text-4xl font-black text-content-main">{selectedBases.length} <span className="text-lg font-normal text-gray-500">款</span></div>
              </div>
              <div className="bg-primary-50 p-6 rounded-lg border border-blue-100">
                <div className="text-sm text-primary mb-2 font-bold flex items-center gap-2">
                  <Layers size={16} /> 系統生成的測試組合
                </div>
                <div className="text-4xl font-black text-blue-700">約 {totalCombinations.toLocaleString()} <span className="text-lg font-normal text-blue-500">種變體</span></div>
              </div>
            </div>
            
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <PenTool size={18} /> 發布前簽核作業
              </h4>
              <p className="text-sm text-gray-500 mb-4">為了確保測試的變數、拆解合理性以及行銷資源的投放無誤，發布前需要進行跨部門簽核確認。</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Designer Signoff */}
                <div className={`border rounded-lg p-4 transition-all flex flex-col items-center text-center ${approvals.designer ? 'bg-status-good-bg border-status-good-border' : 'bg-white border-gray-300'}`}>
                  <div className="font-bold text-gray-800 mb-1">設計總監</div>
                  <div className="text-xs text-gray-500 mb-4 h-8">確認款式與拆解變體的合理性，無衝突設計</div>
                  <button 
                    onClick={() => setApprovals({...approvals, designer: !approvals.designer})}
                    className={`w-full py-2 rounded font-bold text-sm flex justify-center items-center gap-2 ${approvals.designer ? 'bg-status-good-bg text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {approvals.designer ? <><Check size={16}/> 已核准</> : '點擊核准'}
                  </button>
                </div>

                {/* Trend Analyst Signoff */}
                <div className={`border rounded-lg p-4 transition-all flex flex-col items-center text-center ${approvals.analyst ? 'bg-status-good-bg border-status-good-border' : 'bg-white border-gray-300'}`}>
                  <div className="font-bold text-gray-800 mb-1">趨勢分析師</div>
                  <div className="text-xs text-gray-500 mb-4 h-8">確認元素池包含足夠的當季流行潛力變數</div>
                  <button 
                    onClick={() => setApprovals({...approvals, analyst: !approvals.analyst})}
                    className={`w-full py-2 rounded font-bold text-sm flex justify-center items-center gap-2 ${approvals.analyst ? 'bg-status-good-bg text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {approvals.analyst ? <><Check size={16}/> 已核准</> : '點擊核准'}
                  </button>
                </div>

                {/* PM Signoff */}
                <div className={`border rounded-lg p-4 transition-all flex flex-col items-center text-center ${approvals.pm ? 'bg-status-good-bg border-status-good-border' : 'bg-white border-gray-300'}`}>
                  <div className="font-bold text-gray-800 mb-1">專案經理</div>
                  <div className="text-xs text-gray-500 mb-4 h-8">確認測試時程與問卷發放會員分眾名單</div>
                  <button 
                    onClick={() => setApprovals({...approvals, pm: !approvals.pm})}
                    className={`w-full py-2 rounded font-bold text-sm flex justify-center items-center gap-2 ${approvals.pm ? 'bg-status-good-bg text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {approvals.pm ? <><Check size={16}/> 已核准</> : '點擊核准'}
                  </button>
                </div>
              </div>
            </div>

            <button 
              disabled={!allApproved}
              className={`w-full py-4 rounded-lg font-black text-lg shadow-lg flex justify-center items-center gap-2 transition-all ${allApproved ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
            >
              <Smartphone size={24} /> {allApproved ? '正式推播至會員 APP 進行預測' : '等待所有人員簽核...'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm p-6 min-h-[600px] h-full flex flex-col">
      <h2 className="text-xl font-bold text-content-main mb-2 flex items-center gap-2">
        Step 2: 高風險款式拆解與群眾預測
      </h2>
      <p className="text-sm text-gray-500 mb-6">規則：為確保群眾組合的合理性，請先進行「類別合併」，再將合併後的維度送入拆解池。</p>
      
      <div className="flex flex-wrap items-center gap-2 md:gap-4 mb-6 border-b pb-4">
        <div className={`text-sm font-bold ${activeStep >= 1 ? 'text-orange-600' : 'text-gray-400'}`}>1. 鎖定高風險</div>
        <ChevronRight size={16} className="text-gray-300" />
        <div className={`text-sm font-bold ${activeStep >= 2 ? 'text-purple-600' : 'text-gray-400'}`}>2. 類別合併綁定</div>
        <ChevronRight size={16} className="text-gray-300" />
        <div className={`text-sm font-bold ${activeStep >= 3 ? 'text-primary' : 'text-gray-400'}`}>3. 元素拆解池</div>
        <ChevronRight size={16} className="text-gray-300" />
        <div className={`text-sm font-bold ${activeStep >= 4 ? 'text-status-good-text' : 'text-gray-400'}`}>4. 發布與簽核</div>
      </div>

      <div className="flex-1 min-h-0">
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderMergeCategories()}
        {activeStep === 3 && renderElementPool()}
        {activeStep === 4 && renderPublishSignoff()}
      </div>
    </div>
  );
}
