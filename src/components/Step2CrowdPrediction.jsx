import React, { useState, useEffect, useMemo } from 'react';
import { Shirt, Smartphone, Layers, Plus, CheckCircle, ChevronRight, CheckSquare, Square, Combine, PenTool, Send, Check, Settings, Trash2 } from 'lucide-react';

export function Step2CrowdPrediction({ savedStyles = [], setSavedStyles }) {
  const [selectedBases, setSelectedBases] = useState([]);
  const [activeStep, setActiveStep] = useState(1);
  
  const [dbElements, setDbElements] = useState([]);
  const POOL_CATEGORIES = ['風格', '品項', '版型', '面料', '主色', '配色', '圖騰印花', '細節設計'];

  // Map of style.id -> { subStep, categoryGroups, selectedForMerge, addedPoolElements, newElementInputs, approvals, published }
  const [styleConfigs, setStyleConfigs] = useState({});
  const [currentStyleId, setCurrentStyleId] = useState(null);

  useEffect(() => {
    const baseUrl = import.meta.env ? import.meta.env.BASE_URL : '/';
    fetch(baseUrl + 'db.json?v=' + Date.now())
      .then(res => res.json())
      .then(data => {
        setDbElements(data.ai_trend_elements || []);
      })
      .catch(err => console.error(err));
  }, []);



  const initStyleConfig = (styleId) => {
    if (!styleConfigs[styleId]) {
      setStyleConfigs(prev => ({
        ...prev,
        [styleId]: {
          subStep: 1,
          categoryGroups: [['風格'], ['品項'], ['版型'], ['面料'], ['主色'], ['配色'], ['圖騰印花'], ['細節設計']],
          selectedForMerge: [],
          addedPoolElements: {},
          newElementInputs: {},
          approvals: { designer: false, analyst: false, pm: false },
          published: false
        }
      }));
    }
    setCurrentStyleId(styleId);
  };

  const updateCurrentConfig = (updates) => {
    if (!currentStyleId) return;
    setStyleConfigs(prev => ({
      ...prev,
      [currentStyleId]: {
        ...prev[currentStyleId],
        ...updates
      }
    }));
  };

  const currentConfig = currentStyleId ? styleConfigs[currentStyleId] : null;
  const currentStyle = selectedBases.find(s => s.id === currentStyleId);

  // Compute unified pool FOR THE CURRENT STYLE ONLY
  const unifiedPool = useMemo(() => {
    if (!currentStyle || !currentConfig) return {};
    const pool = {};
    currentConfig.categoryGroups.forEach(group => { 
       const groupKey = group.join(' + ');
       pool[groupKey] = new Set(); 
    });
    
    if (currentStyle.elements) {
        const styleCatMap = {};
        currentStyle.elements.forEach(el => {
            styleCatMap[el.category] = el.name || el.label;
        });
        
        currentConfig.categoryGroups.forEach(group => {
            const groupKey = group.join(' + ');
            const combinedVal = group.map(c => styleCatMap[c]).filter(Boolean).join(' x ');
            if (group.length > 1 && combinedVal && group.every(c => styleCatMap[c])) {
                pool[groupKey].add(combinedVal);
            } else if (group.length === 1 && styleCatMap[group[0]]) {
                pool[groupKey].add(styleCatMap[group[0]]);
            }
        });
    }
    return pool;
  }, [currentStyle, currentConfig?.categoryGroups]);

  const getElementsForCat = (catKey) => {
    const base = Array.from(unifiedPool[catKey] || []);
    const added = currentConfig?.addedPoolElements[catKey] || [];
    return [...base, ...added];
  };

  // ----- UI Renderers -----

  const handleSelectBase = (style) => {
    if (selectedBases.find(s => s.id === style.id)) {
      setSelectedBases(prev => prev.filter(s => s.id !== style.id));
    } else {
      setSelectedBases(prev => [...prev, style]);
      if (setSavedStyles) {
        setSavedStyles(prev => prev.map(s => s.id === style.id ? { ...s, directToDev: false } : s));
      }
    }
  };

  const handleToggleDirectToDev = (e, style) => {
    e.stopPropagation();
    if (setSavedStyles) {
      setSavedStyles(prev => prev.map(s => s.id === style.id ? { ...s, directToDev: !s.directToDev } : s));
    }
    if (selectedBases.find(s => s.id === style.id)) {
      setSelectedBases(prev => prev.filter(s => s.id !== style.id));
    }
  };

  const renderStep1 = () => {
    const sortedStyles = [...savedStyles].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

    return (
      <div className="space-y-4 flex flex-col h-full">
        <div className="bg-orange-50 border border-orange-200 text-orange-800 p-3 rounded flex justify-between items-center shrink-0">
          <div>
            <span className="font-bold block">1. 選擇高風險流行款式 ({selectedBases.length} 款已選為預測)</span>
            <span className="text-xs">系統已為您自動依據「風險評估」排序。請挑選高風險組合，個別進行群眾預測；或者直接批准進入開發款式庫。取消數量限制，可任意勾選。</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto min-h-0 flex-1 p-1">
          {sortedStyles.map(style => {
            const isSelected = !!selectedBases.find(s => s.id === style.id);
            return (
              <div 
                key={style.id} 
                onClick={() => handleSelectBase(style)}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary ring-opacity-50 bg-blue-50' : style.directToDev ? 'border-green-500 ring-2 ring-green-500 ring-opacity-50 bg-green-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {isSelected ? <CheckSquare className="text-primary" size={20} /> : <Square className="text-gray-300" size={20} />}
                    <h3 className="font-bold text-gray-800 truncate" title={style.name}>{style.name}</h3>
                  </div>
                  <div className="bg-status-bad-bg text-status-bad-text px-2 py-0.5 rounded text-xs font-bold border border-status-bad-border">
                    風險: {style.riskScore}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1 mt-3">
                  {style.elements.slice(0, 5).map(el => (
                    <span key={el.id} className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 truncate max-w-[80px]">
                      {el.name}
                    </span>
                  ))}
                  {style.elements.length > 5 && <span className="text-[10px] text-gray-400">+{style.elements.length - 5}</span>}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex justify-end">
                  <button 
                    onClick={(e) => handleToggleDirectToDev(e, style)}
                    className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${style.directToDev ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    {style.directToDev ? '✅ 已批准進入開發' : '直接確認開發 (跳過預測)'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Unified Bottom Footer for Step 1 */}
        <div className="border-t pt-4 mt-2 flex justify-end shrink-0">
          <button
            disabled={selectedBases.length === 0}
            onClick={() => {
              if(!currentStyleId && selectedBases.length > 0) initStyleConfig(selectedBases[0].id);
              setActiveStep(2);
            }}
            className="bg-primary text-white px-6 py-2 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 shadow"
          >
            下一步：為個別款式建立預測 &rarr;
          </button>
        </div>
      </div>
    );
  };

  const handleMerge = () => {
    if(!currentConfig || currentConfig.selectedForMerge.length < 2) return;
    const catsToMerge = currentConfig.selectedForMerge.map(k => k.split(' + ')).flat();
    const newGroups = currentConfig.categoryGroups.filter(g => !currentConfig.selectedForMerge.includes(g.join(' + ')));
    newGroups.push(catsToMerge);
    updateCurrentConfig({ categoryGroups: newGroups, selectedForMerge: [] });
  };

  const handleUnmerge = (groupKey) => {
    if(!currentConfig) return;
    const cats = groupKey.split(' + ');
    const newGroups = currentConfig.categoryGroups.filter(g => g.join(' + ') !== groupKey);
    cats.forEach(c => newGroups.push([c]));
    updateCurrentConfig({ categoryGroups: newGroups });
  };

  const renderMergeCategories = () => {
    if(!currentConfig) return null;
    return (
      <div className="flex flex-col h-full bg-white rounded-lg p-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-content-main">1. 類別合併綁定</h3>
          <p className="text-sm text-gray-500 mt-1">針對此款式，您可以預先合併某些類別（例如：「版型」與「品項」合併）。合併後，拆解池只會產生合理的搭配。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex justify-between items-center mb-4">
               <h4 className="font-bold text-gray-800">勾選欲合併的類別</h4>
               <button 
                 onClick={handleMerge}
                 disabled={currentConfig.selectedForMerge.length < 2}
                 className="bg-purple-600 text-white px-3 py-1.5 rounded text-xs font-bold disabled:opacity-50 hover:bg-purple-700 flex items-center gap-1 shadow-sm"
               >
                 <Combine size={14} /> 合併選取項
               </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {currentConfig.categoryGroups.map((group, idx) => {
                const groupKey = group.join(' + ');
                const isSelected = currentConfig.selectedForMerge.includes(groupKey);
                return (
                  <div key={idx} className={`p-2 border rounded-lg flex items-center justify-between transition-colors ${isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-300 bg-white'}`}>
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          let newSel = [...currentConfig.selectedForMerge];
                          if(e.target.checked) newSel.push(groupKey);
                          else newSel = newSel.filter(k => k !== groupKey);
                          updateCurrentConfig({ selectedForMerge: newSel });
                        }}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-bold text-sm text-gray-700">{groupKey}</span>
                    </label>
                    {group.length > 1 && (
                      <button onClick={() => handleUnmerge(groupKey)} className="text-xs text-status-bad-text font-bold px-2 py-1 bg-status-bad-bg rounded hover:underline">
                        解綁
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-purple-200 rounded-lg p-4 bg-white shadow-sm">
            <h4 className="font-bold text-purple-800 mb-2">合併結果預覽</h4>
            <div className="space-y-3">
              {currentConfig.categoryGroups.map((group, idx) => {
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
    if(!currentConfig) return null;
    return (
      <div className="flex flex-col h-full bg-white rounded-lg p-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-content-main">2. 元素拆解池</h3>
          <p className="text-sm text-gray-500 mt-1">針對此款式，您可以手動加入更多選項，豐富 A/B 測試的變體可能性。</p>
        </div>

        <div className="space-y-4 flex-1">
          {currentConfig.categoryGroups.map((group, idx) => {
            const groupKey = group.join(' + ');
            const items = getElementsForCat(groupKey);
            
            return (
              <div key={idx} className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row gap-4 items-start bg-gray-50">
                <div className="w-48 shrink-0">
                  <div className="font-bold text-gray-800 text-sm mb-1">{groupKey}</div>
                  <div className="text-xs text-gray-500">已合併類別，輸入時請使用 'x' 組合，例如：修身 x 襯衫</div>
                </div>
                
                <div className="flex-1 flex flex-wrap gap-2">
                  {items.map((item, i) => (
                    <span key={i} className="bg-white border border-primary text-primary px-3 py-1 rounded-full text-sm font-bold shadow-sm flex items-center gap-1 group">
                      {item}
                      {(currentConfig.addedPoolElements[groupKey] || []).includes(item) && (
                        <button 
                          onClick={() => {
                            const newAdded = {...currentConfig.addedPoolElements};
                            newAdded[groupKey] = newAdded[groupKey].filter(x => x !== item);
                            updateCurrentConfig({ addedPoolElements: newAdded });
                          }}
                          className="text-primary hover:text-red-500 hidden group-hover:block ml-1"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </span>
                  ))}
                  
                  {items.length === 0 && <span className="text-gray-400 text-sm py-1 italic">空</span>}
                </div>

                <div className="flex gap-2 w-full lg:w-auto lg:ml-auto">
                  {group.length === 1 ? (
                    <>
                      <input
                        type="text"
                        list={`datalist-${currentStyle?.id}-${group[0]}`}
                        value={currentConfig.newElementInputs[group[0]] || ''}
                        onChange={e => updateCurrentConfig({
                          newElementInputs: { ...currentConfig.newElementInputs, [group[0]]: e.target.value }
                        })}
                        placeholder={`新增${group[0]}...`}
                        className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:border-primary"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && currentConfig.newElementInputs[group[0]]?.trim()) {
                            const val = currentConfig.newElementInputs[group[0]].trim();
                            const newAdded = {...currentConfig.addedPoolElements};
                            if (!newAdded[groupKey]) newAdded[groupKey] = [];
                            if (!newAdded[groupKey].includes(val) && !unifiedPool[groupKey]?.has(val)) {
                               newAdded[groupKey].push(val);
                            }
                            updateCurrentConfig({ 
                              addedPoolElements: newAdded,
                              newElementInputs: { ...currentConfig.newElementInputs, [group[0]]: '' }
                            });
                          }
                        }}
                      />
                      <datalist id={`datalist-${currentStyle?.id}-${group[0]}`}>
                        {dbElements.filter(e => e.category === group[0]).map((e, idx) => (
                          <option key={idx} value={e.name || e.label} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <div className="flex flex-1 gap-1 min-w-0 items-center">
                      {group.map((subCat, sIdx) => (
                        <React.Fragment key={subCat}>
                          {sIdx > 0 && <span className="text-gray-400 text-xs shrink-0">x</span>}
                          <input
                            type="text"
                            list={`datalist-${currentStyle?.id}-${subCat}`}
                            value={currentConfig.newElementInputs[subCat] || ''}
                            onChange={e => updateCurrentConfig({
                              newElementInputs: { ...currentConfig.newElementInputs, [subCat]: e.target.value }
                            })}
                            placeholder={`${subCat}`}
                            className="w-full min-w-0 border border-gray-300 rounded px-1.5 py-1 text-xs focus:outline-none focus:border-primary"
                          />
                          <datalist id={`datalist-${currentStyle?.id}-${subCat}`}>
                            {dbElements.filter(e => e.category === subCat).map((e, idx) => (
                              <option key={idx} value={e.name || e.label} />
                            ))}
                          </datalist>
                        </React.Fragment>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      if (group.length === 1) {
                        if (currentConfig.newElementInputs[group[0]]?.trim()) {
                          const val = currentConfig.newElementInputs[group[0]].trim();
                          const newAdded = {...currentConfig.addedPoolElements};
                          if (!newAdded[groupKey]) newAdded[groupKey] = [];
                          if (!newAdded[groupKey].includes(val) && !unifiedPool[groupKey]?.has(val)) {
                             newAdded[groupKey].push(val);
                          }
                          updateCurrentConfig({ 
                            addedPoolElements: newAdded,
                            newElementInputs: { ...currentConfig.newElementInputs, [group[0]]: '' }
                          });
                        }
                      } else {
                        if (group.every(c => currentConfig.newElementInputs[c]?.trim())) {
                          const combinedVal = group.map(c => currentConfig.newElementInputs[c].trim()).join(' x ');
                          const newAdded = {...currentConfig.addedPoolElements};
                          if (!newAdded[groupKey]) newAdded[groupKey] = [];
                          if (!newAdded[groupKey].includes(combinedVal) && !unifiedPool[groupKey]?.has(combinedVal)) {
                             newAdded[groupKey].push(combinedVal);
                          }
                          const newInputs = {...currentConfig.newElementInputs};
                          group.forEach(c => newInputs[c] = '');
                          updateCurrentConfig({ 
                            addedPoolElements: newAdded,
                            newElementInputs: newInputs 
                          });
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
    if(!currentConfig) return null;
    let totalCombinations = 1;
    currentConfig.categoryGroups.forEach(group => {
      const groupKey = group.join(' + ');
      const els = getElementsForCat(groupKey);
      if (els.length > 0) totalCombinations *= els.length;
    });

    const { approvals } = currentConfig;
    const allApproved = approvals.designer && approvals.analyst && approvals.pm;

    return (
      <div className="flex flex-col h-full bg-white rounded-lg p-1 overflow-y-auto">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-content-main">3. 發布與簽核</h3>
          <p className="text-sm text-gray-500 mt-1">針對此款式，確認預測變體與細節無誤後，即可送出。</p>
        </div>

        <div className="flex-1 space-y-6">
          {currentConfig.published ? (
             <div className="bg-status-good-bg border border-status-good-border rounded-lg p-8 flex flex-col items-center justify-center text-center">
               <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                 <CheckCircle className="text-status-good-text" size={48} />
               </div>
               <h3 className="text-2xl font-black text-gray-800 mb-2">預測已發布成功！</h3>
               <p className="text-gray-600">此款式的 A/B 測試組合已經送交群眾預測平台。</p>
             </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
                  <div className="text-sm text-gray-500 mb-2 font-bold flex items-center gap-2">
                    <Shirt size={16} /> 目前目標款式
                  </div>
                  <div className="text-xl font-black text-content-main truncate" title={currentStyle?.name}>{currentStyle?.name}</div>
                </div>
                <div className="bg-primary-50 p-6 rounded-lg border border-blue-100">
                  <div className="text-sm text-primary mb-2 font-bold flex items-center gap-2">
                    <Layers size={16} /> 預計產生的測試組合
                  </div>
                  <div className="text-4xl font-black text-blue-700">約 {totalCombinations.toLocaleString()} <span className="text-lg font-normal text-blue-500">種變體</span></div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <PenTool size={18} /> 發布前簽核作業
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {['designer', 'analyst', 'pm'].map(role => {
                    const titles = { designer: '設計總監', analyst: '趨勢分析師', pm: '專案經理' };
                    const desc = { designer: '確認款式與變體合理性', analyst: '確認元素池具備潛力', pm: '確認預算與分眾名單' };
                    const isApv = approvals[role];
                    return (
                      <div key={role} className={`border rounded-lg p-4 transition-all flex flex-col items-center text-center ${isApv ? 'bg-status-good-bg border-status-good-border' : 'bg-white border-gray-300'}`}>
                        <div className="font-bold text-gray-800 mb-1">{titles[role]}</div>
                        <div className="text-xs text-gray-500 mb-4 h-8">{desc[role]}</div>
                        <button
                          onClick={() => updateCurrentConfig({ approvals: { ...approvals, [role]: !isApv } })}
                          className={`w-full py-2 rounded font-bold text-sm flex justify-center items-center gap-2 ${isApv ? 'bg-status-good-bg text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        >
                          {isApv ? <><Check size={16}/> 已核准</> : '點擊核准'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={!allApproved}
                onClick={() => updateCurrentConfig({ published: true })}
                className={`w-full py-4 rounded-lg font-black text-lg shadow-lg flex justify-center items-center gap-2 transition-all ${allApproved ? 'bg-gray-900 text-white hover:bg-black' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
              >
                <Smartphone size={24} /> {allApproved ? '正式推播進行預測' : '等待所有人員簽核...'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div className="flex flex-col h-full overflow-hidden">
         <div className="flex-1 flex overflow-hidden border border-gray-200 rounded-lg">
            {/* Sidebar for selecting style to configure */}
            <div className="w-1/3 bg-gray-50 border-r border-gray-200 flex flex-col">
               <div className="p-3 border-b border-gray-200 bg-gray-100 font-bold text-gray-700 text-sm flex justify-between items-center">
                  <span>待處理的款式清單</span>
                  <span className="bg-primary text-white text-xs px-2 py-0.5 rounded-full">{selectedBases.length}</span>
               </div>
               <div className="flex-1 overflow-y-auto p-2 space-y-2">
                 {selectedBases.map(style => {
                    const isConfiguring = currentStyleId === style.id;
                    const isPub = styleConfigs[style.id]?.published;
                    return (
                      <div 
                        key={style.id}
                        onClick={() => initStyleConfig(style.id)}
                        className={`p-3 rounded-lg cursor-pointer border transition-all ${isConfiguring ? 'border-primary ring-2 ring-primary ring-opacity-50 bg-white shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                      >
                         <div className="flex items-center gap-2 mb-1">
                           {isPub ? <CheckCircle size={16} className="text-status-good-text" /> : <Settings size={16} className="text-gray-400" />}
                           <div className="font-bold text-sm truncate flex-1" title={style.name}>{style.name}</div>
                         </div>
                         <div className="text-xs text-gray-500 flex justify-between">
                            <span>風險: {style.riskScore}</span>
                            <span className={isPub ? "text-status-good-text font-bold" : "text-orange-500"}>{isPub ? '已發布' : '未發布'}</span>
                         </div>
                      </div>
                    );
                 })}
               </div>
            </div>

            {/* Main Content Area for the selected style */}
            <div className="w-2/3 bg-white flex flex-col p-4 overflow-hidden relative">
               {!currentStyleId ? (
                 <div className="flex-1 flex items-center justify-center text-gray-400">
                    請從左側選擇一款式開始設定
                 </div>
               ) : (
                 <>
                   {/* Sub-steps navigation */}
                   <div className="flex items-center justify-center gap-4 mb-4 shrink-0 pb-4 border-b">
                     <div className={`text-sm font-bold cursor-pointer ${currentConfig.subStep === 1 ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => updateCurrentConfig({subStep:1})}>1. 類別綁定</div>
                     <ChevronRight size={14} className="text-gray-300" />
                     <div className={`text-sm font-bold cursor-pointer ${currentConfig.subStep === 2 ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => updateCurrentConfig({subStep:2})}>2. 元素拆解</div>
                     <ChevronRight size={14} className="text-gray-300" />
                     <div className={`text-sm font-bold cursor-pointer ${currentConfig.subStep === 3 ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-gray-600'}`} onClick={() => updateCurrentConfig({subStep:3})}>3. 發布與簽核</div>
                   </div>
                   
                   {/* Sub-step content */}
                   <div className="flex-1 min-h-0 overflow-y-auto">
                     {currentConfig.subStep === 1 && renderMergeCategories()}
                     {currentConfig.subStep === 2 && renderElementPool()}
                     {currentConfig.subStep === 3 && renderPublishSignoff()}
                   </div>
                   
                   {/* Unified Bottom Footer for Sub-steps */}
                   <div className="border-t pt-3 mt-3 flex justify-between shrink-0 bg-white z-10">
                      <button 
                         onClick={() => updateCurrentConfig({ subStep: Math.max(1, currentConfig.subStep - 1) })}
                         className={`px-4 py-2 font-bold rounded ${currentConfig.subStep === 1 ? 'invisible' : 'text-gray-600 hover:bg-gray-100 border border-gray-300'}`}
                      >
                         &larr; 上一步
                      </button>
                      <button 
                         onClick={() => updateCurrentConfig({ subStep: Math.min(3, currentConfig.subStep + 1) })}
                         className={`px-4 py-2 font-bold rounded ${currentConfig.subStep === 3 ? 'invisible' : 'bg-primary text-white hover:bg-blue-700 shadow-sm'}`}
                      >
                         下一步 &rarr;
                      </button>
                   </div>
                 </>
               )}
            </div>
         </div>
         
         {/* Global footer for Step 2 to return to Step 1 */}
         <div className="mt-4 pt-4 border-t flex justify-between shrink-0">
            <button onClick={() => setActiveStep(1)} className="text-gray-600 border border-gray-300 px-6 py-2 font-bold hover:bg-gray-100 rounded shadow-sm">
               &larr; 返回選擇款式
            </button>
         </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm p-6 min-h-[600px] h-full flex flex-col">
      <h2 className="text-xl font-bold text-content-main mb-2 flex items-center gap-2">
        Step 2: 高風險款式拆解與群眾預測
      </h2>
      <p className="text-sm text-gray-500 mb-4">規則：針對每個高風險款式，您可以個別進行「類別合併」，再將合併後的維度送入拆解池，最後單獨發布預測活動。</p>

      {/* Main flow steps indicator */}
      <div className="flex items-center gap-4 mb-4 border-b pb-4 shrink-0">
        <div className={`text-sm font-bold ${activeStep === 1 ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-400'}`}>1. 選擇高風險款式</div>
        <ChevronRight size={16} className="text-gray-300" />
        <div className={`text-sm font-bold ${activeStep === 2 ? 'text-primary border-b-2 border-primary' : 'text-gray-400'}`}>2. 個別設定預測項目</div>
      </div>

      <div className="flex-1 min-h-0">
        {activeStep === 1 && renderStep1()}
        {activeStep === 2 && renderStep2()}
      </div>
    </div>
  );
}
