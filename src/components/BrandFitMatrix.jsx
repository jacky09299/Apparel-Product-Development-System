import React, { useState, useEffect } from 'react';
import { BasicStyleDecision } from './BasicStyleDecision';
import { TrendyStyleDecision } from './TrendyStyleDecision';
import { Sparkline, OverlayChartPanel } from './Charts';

const CATEGORY_ORDER = ['品項', '主色', '面料', '圖騰印花', '細節設計'];




export function BrandFitMatrix({
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
  setCurrentView
}) {
  const [activeTab, setActiveTab] = useState('trends');
  const [newReq, setNewReq] = useState({ name: '', weight: 1, role: '設計師' });

  const [predictionData, setPredictionData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [checkedElements, setCheckedElements] = useState(new Set());
  const [aiLoaded, setAiLoaded] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [newManualElement, setNewManualElement] = useState('');
  
  const [overlayMode, setOverlayMode] = useState(false);
  const [overlayElements, setOverlayElements] = useState([]);

  useEffect(() => {
    if (historicalCombos.length === 0) {
      fetch(import.meta.env.BASE_URL + 'db.json?v=' + Date.now())
        .then(res => res.json())
        .then(dbData => {
          if (dbData.historical_stable_combinations) {
            setHistoricalCombos(dbData.historical_stable_combinations);
          }
        })
        .catch(err => console.error('Failed to load historical combos:', err));
    }
  }, [historicalCombos.length]);

  const handleAutoFillDemo = () => {
    fetch(import.meta.env.BASE_URL + 'db.json?v=' + Date.now())
      .then(res => res.json())
      .then(dbData => {
        const aiData = dbData.ai_trend_elements || [];
        const combos = dbData.historical_stable_combinations || [];
        setHistoricalCombos(combos);
        
        const enhancedData = aiData.map(item => {
             if (item.timeline && item.timeline.length >= 21) {
               return item;
             }
             const itemId = item.id || `gen-${Math.random().toString(36).substr(2, 9)}`;
             const seed = itemId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
             const r = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
             const timeline = [];
             
             let spreadAt6 = Math.max(1, item.score * 0.1);
             if (item.interval) {
               if (Array.isArray(item.interval) && item.interval.length >= 2) {
                 spreadAt6 = (item.interval[1] - item.interval[0]) / 2;
               } else if (item.interval.upper !== undefined && item.interval.lower !== undefined) {
                 spreadAt6 = (item.interval.upper - item.interval.lower) / 2;
               }
             }
             const direction = item.score > 20 ? -0.5 : 0.5;
             
             for (let i = 0; i < 635; i++) {
                 const distToTarget = i - 545; // Target is month +6 (idx 545)
                 let median = item.score + (distToTarget * direction / 30) + (r(seed + i) - 0.5) * (item.score * 0.1);
                 median = Math.max(1, median);
                 
                 // Force target match
                 if (i === 545) median = item.score;
                 
                 let lower = median;
                 let upper = median;
                 
                 // Forecast section (idx 365 to 634)
                 if (i >= 365) {
                    const fDay = i - 365; // 0 to 269
                    const spread = (fDay / 180) * spreadAt6; // at month 6 (fDay=180), spread = spreadAt6
                    lower = median - spread;
                    upper = median + spread;
                 }
                 
                 timeline.push({ 
                    median, lower, upper
                 });
             }
             return {
               ...item,
               interval: item.interval || [Math.max(1, item.score - spreadAt6), Math.min(10, item.score + spreadAt6)],
               timeline
             };
        });
        setPredictionData(enhancedData);
        
        const sorted = enhancedData.sort((a, b) => b.score - a.score);
        // Extract unique elements from historical combos
        const basicElementsMap = new Map();
        combos.forEach(combo => {
          combo.elements.forEach(el => {
            if (!basicElementsMap.has(el.name)) {
              basicElementsMap.set(el.name, {
                id: el.id,
                category: el.category,
                name: el.name,
                isBasic: true
              });
            }
          });
        });

        const top50 = sorted.slice(0, 50).map(item => ({
          id: item.id,
          category: item.category,
          name: item.name,
          trendScore: item.score,
          interval: item.interval,
          timeline: item.timeline || [],
          isTrend: true
        }));
        
        // Normalize element names for deduplication (e.g. '白' and '白色')
        const normalizeName = name => name.replace(/色$/, '');

        // Merge AI elements and basic elements
        const mergedMap = new Map();
        
        // First add basic elements with default baseline stats
        Array.from(basicElementsMap.values()).forEach(el => {
          // Give basic elements a default safe baseline score if they don't get matched with AI
          const baseScore = 4.0 + ((el.name.charCodeAt(0) % 10) * 0.08); 
          const defaultEl = {
            ...el,
            trendScore: baseScore,
            interval: [baseScore - 0.5, baseScore + 0.5]
          };
          mergedMap.set(normalizeName(el.name), defaultEl);
        });
        
        // Then add AI elements (merging tags if overlap)
        top50.forEach(el => {
          const normName = normalizeName(el.name);
          const score = el.score || el.trendScore;
          if (mergedMap.has(normName)) {
            const existing = mergedMap.get(normName);
            existing.name = el.name; // Prefer AI element's name
            existing.isTrend = true;
            existing.trendScore = score;
            existing.interval = el.interval;
            existing.timeline = el.timeline;
          } else {
            mergedMap.set(normName, {
              ...el,
              trendScore: score
            });
          }
        });
        
        const mergedArray = Array.from(mergedMap.values());
        
        // Define category order
        const CATEGORY_ORDER = ['風格', '品項', '版型', '面料', '主色', '配色', '圖騰印花', '細節設計'];
        
        // Sort by category first, then by score (basics without score go to bottom of category)
        mergedArray.sort((a, b) => {
          const idxA = CATEGORY_ORDER.indexOf(a.category);
          const idxB = CATEGORY_ORDER.indexOf(b.category);
          if (idxA !== idxB) {
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
          }
          return (b.trendScore || 0) - (a.trendScore || 0);
        });

        const finalElements = mergedArray.map(item => ({
          ...item,
          id: item.id || `el-${Math.random()}`
        }));
        
        setElements(finalElements);
        setCheckedElements(new Set(finalElements.map(e => e.id)));
        const mockRequirements = [
          { id: 'req-1', role: '設計師', name: '符合復古色調', weight: 5 },
          { id: 'req-2', role: '設計師', name: '具備懷舊印花或紋理', weight: 4 },
          { id: 'req-3', role: '設計師', name: '具備復古五金或立體細節', weight: 4 },
          { id: 'req-4', role: '設計師', name: '具備秋冬保暖性', weight: 5 },
          { id: 'req-5', role: '設計師', name: '適合多層次穿搭', weight: 3 },
          { id: 'req-6', role: '採購', name: '布料取得容易', weight: 4 },
          { id: 'req-7', role: '採購', name: '五金/配件成本合理', weight: 3 },
          { id: 'req-8', role: '數據分析師', name: '近三年秋冬未曾大量使用', weight: 3 }
        ];
        
        setRequirements(mockRequirements);
        
        const newState = {};
        mockRequirements.forEach(req => {
          newState[req.id] = {};
          finalElements.forEach(el => {
            let val = '-';
            const name = el.name;
            const cat = el.category;
            
            if (req.id === 'req-1') { 
              if (cat === '主色' || cat === '配色') {
                if (['焦糖棕', '酒紅', '墨綠', '芥末黃', '櫻桃紅', '大地色'].some(k => name.includes(k))) val = 'O';
                else if (['螢光綠', '亮粉紅', '金屬', '霓虹'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              } else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
            }
            else if (req.id === 'req-2') { 
              if (cat === '圖騰印花') {
                if (['復古格紋', '千鳥格', '變形蟲', '波卡圓點'].some(k => name.includes(k))) val = 'O';
                else if (['大面積文字Logo', '賽博龐克', '3D漸層', '渲染/紮染'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              } else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
            }
            else if (req.id === 'req-3') { 
              if (cat === '細節設計') {
                if (['工裝大口袋', '古銅五金', '燈芯絨拼接', '抽繩抓皺'].some(k => name.includes(k))) val = 'O';
                else if (['無縫膠條', '反光條', '螢光拉鍊', '鏤空剪裁', '金屬拉鍊外露'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              } else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
            }
            else if (req.id === 'req-4') { 
              if (cat === '面料') {
                if (['羊毛', '粗花呢', '絲絨', '重磅丹寧'].some(k => name.includes(k))) val = 'O';
                else if (['透明薄紗', '高透氣亞麻', '冰絲'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              }
              else if (cat === '品項') {
                if (['大衣', '毛衣', '長褲', '高領', '針織'].some(k => name.includes(k))) val = 'O';
                else if (['細肩帶', '超短褲', '平口', '短袖', '背心'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              }
              else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
            }
            else if (req.id === 'req-5') { 
              if (cat === '品項') {
                if (['背心', '針織衫', '襯衫', '開襟衫', '大衣'].some(k => name.includes(k))) val = 'O';
                else if (['連身裙', '緊身洋裝'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              } else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
            }
            else if (req.id === 'req-6') { 
              if (cat === '面料') {
                if (['環保再生棉', '聚酯纖維', '丹寧'].some(k => name.includes(k))) val = 'O';
                else if (['真絲', '訂製緹花', '特殊毛料'].some(k => name.includes(k))) val = 'X';
                else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
              } else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-'; 
            }
            else if (req.id === 'req-7') { 
              if (cat === '細節設計') {
                if (['手工刺繡', '水鑽', '珍珠鑲嵌'].some(k => name.includes(k))) val = 'X';
                else if (['特殊金屬扣', '皮革'].some(k => name.includes(k))) val = '-';
              } else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-'; 
            }
            else if (req.id === 'req-8') { 
              if (['黑', '白', '標準T-shirt', '素色簡約', '環保再生棉'].some(k => name === k)) val = 'X';
              else val = (name.charCodeAt(0) + req.id.charCodeAt(req.id.length-1)) % 5 === 0 ? 'O' : '-';
            }
            
            newState[req.id][el.id] = val;
          });
        });
        setMatrixState(newState);

        setTrendAnalystSubmitted(true);
        setPlannerSubmitted(true);
        setEvalSubmissions({
          '設計師': true,
          '數據分析師': true,
          '採購': true
        });
        setPhase(3);
        if (setCurrentView) setCurrentView({ type: 'dashboard', readOnly: true });
      });
  };


  const [draggableRowIdx, setDraggableRowIdx] = useState(null);

  const [hideEliminated, setHideEliminated] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);
  const [isVertical, setIsVertical] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  
  const toggleCollapse = (cat) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleAllCollapse = () => {
    const categories = ['風格', '品項', '版型', '面料', '主色', '配色', '圖騰印花', '細節設計'];
    if (collapsedCategories.size === categories.length) {
      setCollapsedCategories(new Set());
    } else {
      setCollapsedCategories(new Set(categories));
    }
  };

  const getGroupedColumns = (displayElements) => {
    const groupedColumns = [];
    let lastCat = null;
    let catElements = [];
    displayElements.forEach(el => {
      if (el.category !== lastCat) {
        if (lastCat !== null) {
          if (collapsedCategories.has(lastCat)) {
            groupedColumns.push({ type: 'collapsed', category: lastCat, elements: catElements });
          } else {
            catElements.forEach(e => groupedColumns.push({ type: 'element', element: e, category: lastCat }));
          }
        }
        lastCat = el.category;
        catElements = [el];
      } else {
        catElements.push(el);
      }
    });
    if (lastCat !== null) {
      if (collapsedCategories.has(lastCat)) {
        groupedColumns.push({ type: 'collapsed', category: lastCat, elements: catElements });
      } else {
        catElements.forEach(e => groupedColumns.push({ type: 'element', element: e, category: lastCat }));
      }
    }
    return groupedColumns;
  };


  const handleDoubleClick = (el) => {
    if (overlayMode) {
      setOverlayElements(prev => {
        if (prev.find(item => item.id === el.id)) {
          return prev.filter(item => item.id !== el.id); // remove
        } else {
          return [...prev, el]; // add
        }
      });
    } else {
      setOverlayElements([el]);
    }
  };
  const [sortBy, setSortBy] = useState('analyst'); 


  useEffect(() => {
    if (!aiLoaded) {
      fetch(import.meta.env.BASE_URL + 'ai_predictions.json?v=' + Date.now())
        .then(res => res.json())
        .then(data => {
          const sorted = data.sort((a, b) => b.score - a.score);
          
          // Generate realistic 21-month timeline (12 history + 9 forecast)
          const enhancedData = sorted.map(item => {
             if (item.timeline && item.timeline.length >= 21) {
               return item;
             }
             const itemId = item.id || `gen-${Math.random().toString(36).substr(2, 9)}`;
             const seed = itemId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
             const r = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
             const timeline = [];
             
             let spreadAt6 = Math.max(1, item.score * 0.1);
             if (item.interval) {
               if (Array.isArray(item.interval) && item.interval.length >= 2) {
                 spreadAt6 = (item.interval[1] - item.interval[0]) / 2;
               } else if (item.interval.upper !== undefined && item.interval.lower !== undefined) {
                 spreadAt6 = (item.interval.upper - item.interval.lower) / 2;
               }
             }
             const direction = item.score > 20 ? -0.5 : 0.5;
             
             for (let i = 0; i < 635; i++) {
                const distToTarget = i - 545; // Target is month +6 (idx 545)
                let median = item.score + (distToTarget * direction / 30) + (r(seed + i) - 0.5) * (item.score * 0.1);
                median = Math.max(1, median);
                
                // Force target match
                if (i === 545) median = item.score;
                
                let lower = median;
                let upper = median;
                
                // Forecast section (idx 365 to 634)
                if (i >= 365) {
                   const fDay = i - 365; // 0 to 269
                   const spread = (fDay / 180) * spreadAt6; // at month 6 (fDay=180), spread = spreadAt6
                   lower = median - spread;
                   upper = median + spread;
                }
                
                timeline.push({ 
                  median: Math.round(median), 
                  lower: Math.round(lower), 
                  upper: Math.round(upper) 
                });
             }
             return { ...item, id: itemId, timeline };
          });

          setPredictionData(enhancedData);
          
          const uniqueCats = Array.from(new Set(enhancedData.map(d => d.category)))
            .sort((a, b) => {
              const idxA = CATEGORY_ORDER.indexOf(a);
              const idxB = CATEGORY_ORDER.indexOf(b);
              return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
            });
            
          if (uniqueCats.length > 0) {
            setSelectedCategory(uniqueCats[0]);
          }
          setAiLoaded(true);
        })
        .catch(err => console.error("Failed to load AI predictions:", err));
    }
  }, [aiLoaded]);

  // --- Handlers ---
  const handleCellChange = (reqId, elId, newValue) => {
    setMatrixState(prev => ({
      ...prev,
      [reqId]: { ...prev[reqId], [elId]: newValue }
    }));
  };

  const addRequirement = () => {
    if (!newReq.name) return;
    const newId = `req-${Date.now()}`;
    setRequirements(prev => [...prev, { id: newId, ...newReq }]);
    setMatrixState(prev => {
      const newState = { ...prev, [newId]: {} };
      elements.forEach(el => newState[newId][el.id] = '-');
      return newState;
    });
    setNewReq({ ...newReq, name: '' });
  };

  const removeRequirement = (id) => {
    setRequirements(prev => prev.filter(r => r.id !== id));
    setMatrixState(prev => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  const toggleCheckElement = (id) => {
    const newSet = new Set(checkedElements);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setCheckedElements(newSet);
  };

  const handleDragStart = (e, index) => {
    setDraggedIdx(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragLeave = (e) => {};

  const handleDragEnd = () => {
    setDraggedIdx(null);
    setDragOverIdx(null);
  };

  const handleDrop = (e, targetIdx) => {
    e.preventDefault();
    setDragOverIdx(null);
    if (draggedIdx === null || draggedIdx === targetIdx) {
      setDraggedIdx(null);
      return;
    }
    
    const categoryData = [...predictionData.filter(d => d.category === selectedCategory)];
    const otherData = predictionData.filter(d => d.category !== selectedCategory);
    
    const [removed] = categoryData.splice(draggedIdx, 1);
    categoryData.splice(targetIdx, 0, removed);
    
    setPredictionData([...categoryData, ...otherData]);
    setDraggedIdx(null);
  };

  const addManualElement = () => {
    if (!newManualElement.trim()) return;
    const newId = `manual-${Date.now()}`;
    const newItem = {
      id: newId,
      category: selectedCategory,
      name: newManualElement,
      score: '人工新增',
      interval: null,
      timeline: []
    };
    
    const categoryData = [newItem, ...predictionData.filter(d => d.category === selectedCategory)];
    const otherData = predictionData.filter(d => d.category !== selectedCategory);
    
    setPredictionData([...categoryData, ...otherData]);
    
    const newSet = new Set(checkedElements);
    newSet.add(newId);
    setCheckedElements(newSet);
    
    setNewManualElement('');
  };

  const submitPhase1Planner = () => {
    if (requirements.length === 0) return alert("請至少新增一項品牌需求");
    setPlannerSubmitted(true);
    checkPhaseAdvance(true, trendAnalystSubmitted, evalSubmissions);
  };

  const submitPhase1TrendAnalyst = () => {
    if (checkedElements.size === 0) return alert("請至少勾選一項設計元素");
    
    const finalElements = [];
    const categories = Array.from(new Set(predictionData.map(d => d.category)))
      .sort((a, b) => {
        const idxA = CATEGORY_ORDER.indexOf(a);
        const idxB = CATEGORY_ORDER.indexOf(b);
        return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
      });
    
    categories.forEach(cat => {
      const catItems = predictionData.filter(d => d.category === cat && checkedElements.has(d.id));
      catItems.forEach(item => {
        finalElements.push({
          id: item.id,
          category: item.category,
          name: item.name,
          trendScore: item.score,
          interval: item.interval,
          timeline: item.timeline
        });
      });
    });

    setElements(finalElements);
    
    setMatrixState(prev => {
      const newState = { ...prev };
      requirements.forEach(req => {
        if (!newState[req.id]) newState[req.id] = {};
        finalElements.forEach(el => {
          if (!newState[req.id][el.id]) {
            newState[req.id][el.id] = '-';
          }
        });
      });
      return newState;
    });

    setTrendAnalystSubmitted(true);
    checkPhaseAdvance(plannerSubmitted, true, evalSubmissions);
  };

  const submitPhase2Evaluation = () => {
    const newSubs = { ...evalSubmissions, [currentRole]: true };
    setEvalSubmissions(newSubs);
    checkPhaseAdvance(plannerSubmitted, trendAnalystSubmitted, newSubs);
  };

  const checkPhaseAdvance = (pSub, tSub, eSubs) => {
    if (phase === 1 && pSub && tSub) {
      setPhase(2);
    } else if (phase === 2) {
      const requiredRoles = new Set(requirements.map(r => r.role));
      let allDone = true;
      requiredRoles.forEach(r => {
        if (!eSubs[r]) allDone = false;
      });
      if (allDone) setPhase(3);
    }
  };

  // --- Render Helpers ---
  const renderTrends = () => {

      
      const canView = currentRole === '趨勢分析師' || currentRole === '設計師' || currentRole === '高階主管' ||
                      (currentRole === '商品企劃' && plannerSubmitted) || phase > 1;
      
      if (!canView) {
        return <div className="p-8 text-center text-[#4b5563]">請先完成您的前置作業，或等待相關部門開放權限。</div>;
      }

      const isReadOnly = currentRole !== '趨勢分析師' || phase > 1 || trendAnalystSubmitted;
      const categories = Array.from(new Set(predictionData.map(d => d.category)))
        .sort((a, b) => {
          const idxA = CATEGORY_ORDER.indexOf(a);
          const idxB = CATEGORY_ORDER.indexOf(b);
          return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });
      
      const displayedElements = predictionData.filter(d => d.category === selectedCategory);

      return (
      <div className="p-4 overflow-x-auto">
        <div className="mb-2 flex justify-end">
          <button onClick={toggleAllCollapse} className="bg-[#f3f4f6] text-[#4b5563] px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-[#e5e7eb] border border-[#d1d5db]">
            {collapsedCategories.size > 0 ? '全部展開' : '全部縮起'}
          </button>
        </div>
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-content-main">
                AI 流行元素預測系統匯入 {isReadOnly && <span className="text-status-bad-text">(預覽模式)</span>}
              </h3>
              <p className="text-[#6b7280] text-xs mt-1">
                {isReadOnly 
                  ? "設計師可在此檢視目前的流行趨勢，若有靈感可與趨勢分析師討論添加元素。" 
                  : "外部預測結果已載入。您可以拖曳最左側把手調整排序，並可自行輸入新增元素。"}
              </p>
            </div>
          </div>
          
          <div className="flex flex-col xl:flex-row gap-6 items-start w-full">
            <div className="overflow-x-auto shrink-0 xl:max-w-[55%]">
              <div className="flex gap-2 mb-4 border-b border-[#d1d5db] w-max">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedCategory === cat ? 'border-primary text-primary' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <table className="border-collapse border border-[#d1d5db] mb-4 text-sm w-max relative">
            <thead>
              <tr className="bg-[#f3f4f6]">
                {!isReadOnly && <th className="border border-[#d1d5db] p-2 text-center px-3 text-[#6b7280]" title="拖曳以排序">☰</th>}
                <th className="border border-[#d1d5db] p-2 text-center px-4">排行</th>
                <th className="border border-[#d1d5db] p-2 text-left px-6">元素名稱</th>
                <th className="border border-[#d1d5db] p-2 text-center px-4">選取</th>
                <th className="border border-[#d1d5db] p-2 text-center px-6">流行度預測中位數 (+6個月)</th>
                <th className="border border-[#d1d5db] p-2 text-center px-4">區間 (+/-)</th>
                <th className="border border-[#d1d5db] p-2 text-center px-4">趨勢軌跡 (過去1年+未來9月)</th>
              </tr>
            </thead>
            <tbody>
              {displayedElements.length === 0 ? (
                <tr><td colSpan={isReadOnly ? "6" : "7"} className="p-4 text-center text-[#6b7280]">載入中或無資料...</td></tr>
              ) : displayedElements.map((el, idx) => {
                const isOverlay = overlayElements.find(o => o.id === el.id);
                const isDragging = draggedIdx === idx;
                const isDragOver = dragOverIdx === idx;
                const isDropAbove = isDragOver && draggedIdx > idx;
                const isDropBelow = isDragOver && draggedIdx < idx;
                
                const tdDropStyle = {
                  borderTop: isDropAbove ? '3px solid #2563eb' : undefined,
                  borderBottom: isDropBelow ? '3px solid #2563eb' : undefined,
                };
                
                return (
                  <tr 
                    key={el.id} 
                    draggable={!isReadOnly && (draggableRowIdx === idx || draggedIdx === idx)}
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragEnter={(e) => handleDragEnter(e, idx)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`transition-colors ${checkedElements.has(el.id) ? 'bg-[#dbeafe] font-bold shadow-[inset_4px_0_0_0_#2563eb]' : 'bg-white hover:bg-[#f9fafb]'}`}
                    style={{ opacity: isDragging ? 0.4 : 1 }}
                  >
                    {!isReadOnly && (
                      <td 
                        className="border border-[#d1d5db] p-2 text-center text-[#9ca3af] cursor-move" 
                        style={tdDropStyle}
                        onMouseEnter={() => setDraggableRowIdx(idx)}
                        onMouseLeave={() => setDraggableRowIdx(null)}
                      >
                        ⋮⋮
                      </td>
                    )}
                    <td className="border border-[#d1d5db] p-2 text-center font-bold text-[#6b7280]" style={tdDropStyle}>{idx + 1}</td>
                    <td className="border border-[#d1d5db] p-2 font-medium text-content-main px-6" style={tdDropStyle}>
                      {el.name}
                      {el.score === '人工新增' && <span className="ml-2 text-xs bg-[#f3f4f6] text-[#6b7280] px-1 py-0.5 rounded">人工新增</span>}
                    </td>
                    <td className="border border-[#d1d5db] p-2 text-center" style={tdDropStyle}>
                      <input 
                        type="checkbox" 
                        checked={checkedElements.has(el.id)} 
                        onChange={() => toggleCheckElement(el.id)}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-primary rounded border-[#d1d5db] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="border border-[#d1d5db] p-2 text-center" style={tdDropStyle}>
                      <span className={el.score === '人工新增' ? 'text-[#6b7280] text-xs' : 'text-content-main font-bold'}>
                        {el.score}
                      </span>
                    </td>
                    <td className="border border-[#d1d5db] p-2 text-center font-medium text-[#6b7280]" style={tdDropStyle}>
                      {el.interval && typeof el.score === 'number' ? `+${(el.interval[1] - el.score).toFixed(2)} / -${(el.score - el.interval[0]).toFixed(2)}` : '-'}
                    </td>
                    <td 
                      className={`border border-[#d1d5db] p-2 text-center transition-colors select-none ${el.timeline && el.timeline.length > 0 ? 'cursor-pointer' : ''} ${isOverlay ? 'bg-[#dbeafe] shadow-[inset_0_0_0_2px_#2563eb]' : 'hover:bg-[#e5e7eb]'}`} 
                      style={tdDropStyle}
                      onDoubleClick={() => handleDoubleClick(el)}
                      title="點擊兩下放大趨勢圖"
                    >
                      <Sparkline data={el.timeline} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {!isReadOnly && (
            <div className="bg-[#f9fafb] border border-[#d1d5db] p-3 mb-4 flex gap-3 items-end w-max">
              <div>
                <label className="block text-xs text-[#4b5563] mb-1">手動新增「{selectedCategory}」元素</label>
                <input 
                  type="text" 
                  value={newManualElement} 
                  onChange={e => setNewManualElement(e.target.value)} 
                  className="border border-[#d1d5db] rounded px-2 py-1 text-sm w-48" 
                  placeholder="輸入元素名稱..." 
                  onKeyDown={e => e.key === 'Enter' && addManualElement()}
                />
              </div>
              <button onClick={addManualElement} className="bg-[#111827] text-white px-3 py-1.5 rounded text-sm hover:bg-[#374151] whitespace-nowrap">新增</button>
            </div>
          )}

            </div>
            <div className="flex-1 flex flex-col gap-4 min-w-[400px]">
              <div className="flex items-center justify-between bg-[#f8fafc] p-3 rounded-lg border border-[#e5e7eb]">
                <span className="font-bold text-[#1e293b]">圖表顯示模式</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 text-primary rounded border-[#d1d5db] focus:ring-primary"
                    checked={overlayMode}
                    onChange={(e) => {
                      setOverlayMode(e.target.checked);
                      if (!e.target.checked && overlayElements.length > 1) {
                        setOverlayElements([overlayElements[0]]);
                      }
                    }}
                  />
                  <span className="text-sm font-medium text-[#475569]">疊圖模式</span>
                </label>
              </div>
              <OverlayChartPanel elements={overlayElements} />
            </div>
          </div>
          {!isReadOnly ? (
            <div className="flex items-center gap-6 w-max mt-6 pt-4 border-t border-[#d1d5db]">
              <button onClick={submitPhase1TrendAnalyst} className="bg-primary text-white px-6 py-2 rounded shadow-sm hover:bg-[#1d4ed8]">確認選取並送出全部</button>
              <span className="text-sm text-[#4b5563]">已選取 {checkedElements.size} 個元素</span>
            </div>
          ) : (
            currentRole === '趨勢分析師' && trendAnalystSubmitted && phase === 1 && (
              <div className="mt-6 pt-4 border-t border-[#d1d5db] text-status-good-text font-bold">
                您已成功送出預測清單！請等待商品企劃完成品牌需求設定，即可進入下一階段。
              </div>
            )
          )}
        </div>
      );
  };

  const renderRequirements = () => {
      const canView = currentRole === '商品企劃';
      if (!canView) {
        return (
          <div className="p-12 flex flex-col items-center justify-center text-[#4b5563]">
            <div className="mb-4 bg-[#f3f4f6] p-4 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-content-main mb-2">無存取權限</h3>
            <p className="text-sm text-center">品牌需求設定僅開放給「商品企劃」操作與檢視。<br/>其他職位請直接進行您的「部門契合度評估」，或等待「流行契合表」解鎖。</p>
          </div>
        );
      }

      const isReadOnly = currentRole !== '商品企劃' || phase > 1 || plannerSubmitted;
      return (
        <div className="p-4 overflow-x-auto">
          <h3 className="font-bold text-content-main mb-4">建立品牌需求與權重</h3>
          <table className="border-collapse border border-[#d1d5db] mb-4 text-sm w-max">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="border border-[#d1d5db] p-2 text-left px-4">品牌需求條件</th>
                <th className="border border-[#d1d5db] p-2 text-center px-4">權重</th>
                <th className="border border-[#d1d5db] p-2 text-left px-4">負責職位</th>
                <th className="border border-[#d1d5db] p-2 text-center px-4">操作</th>
              </tr>
            </thead>
            <tbody>
              {requirements.map(req => (
                <tr key={req.id}>
                  <td className="border border-[#d1d5db] p-2 px-4">{req.name}</td>
                  <td className="border border-[#d1d5db] p-2 text-center px-4">{req.weight}</td>
                  <td className="border border-[#d1d5db] p-2 px-4">{req.role}</td>
                  <td className="border border-[#d1d5db] p-2 text-center px-4">
                    {!isReadOnly && <button onClick={() => removeRequirement(req.id)} className="text-status-bad-text hover:underline">刪除</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!isReadOnly && (
            <div className="bg-[#f9fafb] border border-[#d1d5db] p-4 mb-4 flex gap-4 items-end w-max">
              <div>
                <label className="block text-xs text-[#4b5563] mb-1">品牌需求條件</label>
                <input type="text" value={newReq.name} onChange={e => setNewReq({...newReq, name: e.target.value})} className="border border-[#d1d5db] rounded px-2 py-1 text-sm w-48" placeholder="例如：實用、舒適..." />
              </div>
              <div>
                <label className="block text-xs text-[#4b5563] mb-1">權重</label>
                <input type="number" min="0" value={newReq.weight} onChange={e => setNewReq({...newReq, weight: parseInt(e.target.value) || 0})} className="border border-[#d1d5db] rounded px-2 py-1 text-sm w-20 text-center" />
              </div>
              <div>
                <label className="block text-xs text-[#4b5563] mb-1">負責職位</label>
                <select value={newReq.role} onChange={e => setNewReq({...newReq, role: e.target.value})} className="border border-[#d1d5db] rounded px-2 py-1 text-sm bg-white w-32">
                  <option value="設計師">設計師</option>
                  <option value="數據分析師">數據分析師</option>
                  <option value="採購">採購</option>
                  <option value="財務">財務</option>
                </select>
              </div>
              <button onClick={addRequirement} className="bg-[#111827] text-white px-4 py-1.5 rounded text-sm hover:bg-[#374151] whitespace-nowrap">新增項目</button>
            </div>
          )}

          {!isReadOnly ? (
            <button onClick={submitPhase1Planner} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-[#1d4ed8]">送出需求設定</button>
          ) : (
            currentRole === '商品企劃' && plannerSubmitted && phase === 1 && (
              <div className="mt-4 p-4 border border-[#d1d5db] bg-[#f9fafb] text-status-good-text font-bold inline-block">
                您已成功送出品牌需求！請等待趨勢分析師完成流行元素挑選，即可進入下一階段。
              </div>
            )
          )}
        </div>
      );
  };
  const renderEvaluation = () => {
    if (phase < 2) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-[#4b5563]">
          <div className="mb-4 bg-[#f3f4f6] p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-content-main mb-2">評估階段尚未開始</h3>
          <p className="text-sm">請等待「趨勢分析師」與「商品企劃」完成前置設定作業。</p>
        </div>
      );
    }
    const myRequirements = requirements.filter(r => r.role === currentRole);

    if (myRequirements.length === 0) {
      return <div className="p-8 text-center text-[#4b5563]">此階段您沒有需要評估的需求項目。請等待其他部門完成。</div>;
    }

    if (evalSubmissions[currentRole]) {
      return <div className="p-8 text-center text-[#4b5563]">您已完成評估並送出。請等待其他部門完成以解鎖總表。</div>;
    }

    const groupedColumns = getGroupedColumns(elements);
    const catHeaders = [];
    let lastCat = null;
    let count = 0;
    groupedColumns.forEach((col, i) => {
      const colCat = col.type === 'collapsed' ? col.category : col.category;
      if (colCat !== lastCat) {
        if (lastCat !== null) catHeaders.push({ category: lastCat, count, isCollapsed: collapsedCategories.has(lastCat) });
        lastCat = colCat;
        count = 1;
      } else {
        count++;
      }
      if (i === groupedColumns.length - 1) catHeaders.push({ category: lastCat, count, isCollapsed: collapsedCategories.has(lastCat) });
    });

    return (
      <div className="p-4 overflow-x-auto">

        <table className="border-collapse border border-[#d1d5db] text-sm w-max">
          <thead>
            <tr>
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              {catHeaders.map((cat, idx) => (
                <th key={idx} colSpan={cat.count} className="border border-[#d1d5db] bg-[#e5e7eb] p-2 text-center font-bold cursor-pointer hover:bg-[#d1d5db] transition-colors select-none" onDoubleClick={() => toggleCollapse(cat.category)} title="雙擊展開/縮起">
                  {cat.category} {cat.isCollapsed ? '+' : '-'}
                </th>
              ))}
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
            </tr>
            <tr>
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-left px-4">品牌需求條件</th>
              {groupedColumns.map((col, idx) => {
                if (col.type === 'collapsed') {
                  return <th key={'col-'+idx} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center text-gray-400 px-4 cursor-pointer hover:bg-[#e5e7eb]" onDoubleClick={() => toggleCollapse(col.category)}>...</th>;
                }
                const el = col.element;
                return (
                <th key={el.id} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center text-content-main px-4">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">{el.name}</span>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {el.isTrend && el.isBasic ? (
                        <span className="text-[10px] bg-status-good-bg text-status-good-text px-1 py-0.5 rounded font-bold whitespace-nowrap">熱門+長青</span>
                      ) : el.isTrend ? (
                        <span className="text-[10px] bg-status-good-bg text-status-good-text px-1 py-0.5 rounded font-bold whitespace-nowrap">AI趨勢</span>
                      ) : el.isBasic ? (
                        <span className="text-[10px] bg-[#f3f4f6] text-[#4b5563] px-1 py-0.5 rounded font-bold whitespace-nowrap">長青基礎</span>
                      ) : null}
                    </div>
                  </div>
                </th>
              )})} 
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-center px-4">負責職位</th>
            </tr>
          </thead>
          <tbody>
            {myRequirements.map((req, index) => {
              const isFirstInDept = index === 0;
              const deptCount = myRequirements.length;

              return (
                <tr key={req.id} className="hover:bg-[#f9fafb]">
                  <td className="border border-[#d1d5db] p-2 text-[#374151] px-4 whitespace-nowrap">
                    {req.name}
                  </td>
                  {groupedColumns.map((col, idx) => {
                    if (col.type === 'collapsed') {
                      return <td key={'col-'+idx} className="border border-[#d1d5db] bg-[#f3f4f6] px-2 cursor-pointer hover:bg-[#e5e7eb]" onDoubleClick={() => toggleCollapse(col.category)}></td>;
                    }
                    const el = col.element;
                    const state = matrixState[req.id]?.[el.id] || '-';
                    let cellBg = 'bg-white';
                    if (state === 'X') cellBg = 'bg-status-bad-bg text-status-bad-text font-bold';
                    if (state === 'O') cellBg = 'bg-status-good-bg text-status-good-text font-bold';

                    return (
                      <td key={`${req.id}-${el.id}`} className={`border border-[#d1d5db] p-1 text-center ${cellBg} px-2`}>
                        <select 
                          value={state}
                          onChange={(e) => handleCellChange(req.id, el.id, e.target.value)}
                          className="w-full h-full p-1 bg-transparent border border-[#d1d5db] rounded text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="-">- (一般)</option>
                          <option value="O">O (高度滿足)</option>
                          <option value="X">X (淘汰)</option>
                        </select>
                      </td>
                    );
                  })}
                  {isFirstInDept && (
                    <td rowSpan={deptCount} className="border border-[#d1d5db] p-2 text-center font-medium bg-[#f3f4f6] px-4 whitespace-nowrap">
                      {req.role}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4">
          <button onClick={submitPhase2Evaluation} className="bg-primary text-white px-4 py-2 rounded shadow-sm hover:bg-[#1d4ed8]">送出我的評估結果</button>
        </div>
      </div>
    );
  };

  

  const canViewTrends = currentRole === '趨勢分析師' || currentRole === '設計師' || currentRole === '高階主管' || (currentRole === '商品企劃' && plannerSubmitted) || phase > 1;
  const canViewRequirements = currentRole === '商品企劃';
  const canViewEvaluation = phase >= 2;

  useEffect(() => {
    const visibleTabs = [
      ...(canViewTrends ? ['trends'] : []),
      ...(canViewRequirements ? ['requirements'] : []),
      ...(canViewEvaluation ? ['evaluation'] : [])
    ];
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [currentRole, phase, plannerSubmitted, trendAnalystSubmitted, activeTab, canViewTrends, canViewRequirements, canViewEvaluation]);

  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm flex flex-col relative h-full">
      {subStep === 1 && (
        <div className="flex border-b border-[#d1d5db] bg-[#f9fafb] px-4 pt-2 shrink-0 overflow-x-auto gap-1 items-center">
          <div className="flex gap-1 flex-1">
            {canViewTrends && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'trends' ? 'border-primary text-primary' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('trends')}>流行元素預測</button>}
            {canViewRequirements && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'requirements' ? 'border-primary text-primary' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('requirements')}>品牌需求與權重</button>}
            {canViewEvaluation && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'evaluation' ? 'border-primary text-primary' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('evaluation')}>部門契合度評估</button>}

          </div>
          
          <div className="flex items-center gap-4 pb-2 pr-4">
            <button 
              onClick={handleAutoFillDemo}
              className="bg-status-bad-bg text-status-bad-text border border-status-bad-border px-3 py-1 rounded-full text-xs font-bold hover:bg-status-bad-bg transition-colors shadow-sm whitespace-nowrap"
            >
              ⚡ DEMO: 一鍵完成所有簽核
            </button>
            <span className="bg-[#e5e7eb] text-[#374151] px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap">
              進度: 階段 {phase}/3
            </span>
          </div>
        </div>
      )}

      {subStep === 1 && (
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'trends' && renderTrends()}
          {activeTab === 'requirements' && renderRequirements()}
          {activeTab === 'evaluation' && renderEvaluation()}
        </div>
      )}

      {subStep === 2 && (
        <div className="flex-1 p-4 min-h-0 flex flex-col bg-[#f3f4f6]">
          <BasicStyleDecision 
            elements={elements} 
            matrixState={matrixState} 
            requirements={requirements} 
            historicalCombos={historicalCombos} 
            basicDecisions={basicDecisions} 
            setBasicDecisions={setBasicDecisions} 
            onSubmit={() => {
              if (phase < 4) setPhase(4);
              setSubStep(3);
            }}
          />
        </div>
      )}

      {subStep === 3 && (
        <div className="flex-1 p-4 min-h-0 flex flex-col bg-[#f3f4f6]">
          <TrendyStyleDecision 
            elements={elements} 
            savedStyles={savedStyles}
            setSavedStyles={setSavedStyles}
            matrixState={matrixState}
            requirements={requirements}
          />
        </div>
      )}
    </div>
  );
}
