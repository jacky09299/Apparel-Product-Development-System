import React, { useState, useEffect } from 'react';
import { BasicStyleDecision } from './BasicStyleDecision';
import { TrendyStyleDecision } from './TrendyStyleDecision';

const CATEGORY_ORDER = ['品項', '主色', '面料', '圖騰印花', '細節設計'];

const Sparkline = ({ data }) => {
  if (!data || data.length === 0) return <span className="text-[#9ca3af] text-xs">無資料</span>;
  
  const width = 80;
  const height = 24;
  const padding = 2;
  let min = Math.min(...data.map(d => d.lower));
  let max = Math.max(...data.map(d => d.upper));
  if (max === min) {
    max += 1;
    min -= 1;
  }
  const range = max - min;
  const margin = range * 0.05 || 1;
  const plotMin = min - margin;
  const plotMax = max + margin;
  const plotRange = plotMax - plotMin;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = (height - padding) - ((d.median - plotMin) / plotRange) * (height - padding * 2);
    return `${x},${y}`;
  });

  const isDaily = data.length > 30;
  const splitIdx = isDaily ? 365 : 12;
  const targetIdx = isDaily ? 545 : 17;

  const historyPoints = points.slice(0, splitIdx + 1).join(' '); 
  const forecastPoints = points.slice(splitIdx).join(' '); 

  const targetPoint = data[targetIdx]; 
  const targetX = (targetIdx / (data.length - 1)) * width;
  const targetY = (height - padding) - ((targetPoint.median - plotMin) / plotRange) * (height - padding * 2);

  return (
    <svg width={width} height={height} viewBox={`-2 -2 ${width + 4} ${height + 4}`} className="overflow-visible mx-auto">
      {/* History Line (Solid Gray) */}
      <polyline fill="none" stroke="#9ca3af" strokeWidth="1.5" points={historyPoints} strokeLinecap="round" strokeLinejoin="round" />
      {/* Forecast Line (Dashed Blue) */}
      <polyline fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2,2" points={forecastPoints} strokeLinecap="round" strokeLinejoin="round" />
      {/* Target Dot at +6 Months */}
      <circle cx={targetX} cy={targetY} r="2.5" fill="#2563eb" />
    </svg>
  );
};


const OverlayChartPanel = ({ elements }) => {
  const [showInterval, setShowInterval] = useState(false);
  if (!elements || elements.length === 0) return (
    <div className="flex items-center justify-center w-full h-[380px] bg-[#f8fafc] border border-dashed border-[#d1d5db] rounded-lg">
      <span className="text-[#9ca3af] font-medium">請在左側雙擊品項以顯示趨勢圖</span>
    </div>
  );

  const w = 640;
  const h = 340;
  const padX = 50;
  const padY = 40;

  const colors = ["#2563eb", "#dc2626", "#059669", "#d97706", "#7c3aed", "#db2777"];

  let dataMin = Infinity;
  let dataMax = -Infinity;
  let maxPts = 0;
  
  elements.forEach(data => {
    if(!data.timeline) return;
    const itemMin = Math.min(...data.timeline.map(d => d.lower));
    const itemMax = Math.max(...data.timeline.map(d => d.upper));
    if (itemMin < dataMin) dataMin = itemMin;
    if (itemMax > dataMax) dataMax = itemMax;
    if (data.timeline.length > maxPts) maxPts = data.timeline.length;
  });

  if (dataMax === dataMin) {
    dataMax += 1;
    dataMin -= 1;
  }
  const margin = (dataMax - dataMin) * 0.05 || 1;
  const min = Math.floor(dataMin - margin);
  const max = Math.ceil(dataMax + margin);
  const range = max - min;

  const totalPts = maxPts;
  const isDaily = totalPts > 30;
  const splitIdx = isDaily ? 365 : 12;
  const targetIdx = isDaily ? 545 : 17;

  const labels = [
    { idx: 0, text: '-12個月' },
    { idx: Math.floor(totalPts * (3/21)), text: '-9個月' },
    { idx: Math.floor(totalPts * (6/21)), text: '-6個月' },
    { idx: Math.floor(totalPts * (9/21)), text: '-3個月' },
    { idx: splitIdx, text: '現在' },
    { idx: Math.floor(splitIdx + (totalPts - splitIdx) * (3/9)), text: '+3個月' },
    { idx: targetIdx, text: '+6個月' },
    { idx: totalPts - 1, text: '+9個月' }
  ];

  return (
    <div className="w-full flex flex-col relative mt-2">
      <div className="flex justify-end mb-2 absolute right-0 top-[-25px] z-10">
        <label className="flex items-center text-xs font-bold text-[#4b5563] cursor-pointer hover:text-[#111827] bg-[#f8fafc] px-2 py-1 rounded shadow-sm border border-[#e5e7eb]">
          <input type="checkbox" checked={showInterval} onChange={e => setShowInterval(e.target.checked)} className="mr-1.5 cursor-pointer" />
          顯示所有區間
        </label>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto drop-shadow-sm font-sans" style={{ background: '#f8fafc', borderRadius: '8px' }}>
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padY + ratio * (h - padY * 2);
          const val = max - ratio * range;
          return (
            <g key={`grid-${ratio}`}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#e5e7eb" strokeWidth="1" />
              <text x={padX - 8} y={y + 4} textAnchor="end" fill="#9ca3af" className="text-[10px]">{val.toFixed(1)}</text>
            </g>
          );
        })}

        {labels.map(l => {
          const x = padX + (l.idx / (totalPts - 1)) * (w - padX * 2);
          return (
            <g key={`label-${l.idx}`}>
              <circle cx={x} cy={h - padY} r="2" fill="#d1d5db" />
              <text x={x} y={h - 15} textAnchor="middle" fill={l.idx === splitIdx || l.idx === targetIdx ? "#111827" : "#6b7280"} className={l.idx === targetIdx ? "font-bold text-[10px]" : "font-medium text-[10px]"}>
                {l.text}
              </text>
            </g>
          );
        })}

        <line x1={padX + (splitIdx / (totalPts - 1)) * (w - padX * 2)} y1={padY} x2={padX + (splitIdx / (totalPts - 1)) * (w - padX * 2)} y2={h - padY} stroke="#e5e7eb" strokeDasharray="4,4" />

        {(elements.length === 1 || showInterval) && elements.map((data, index) => {
           if (!data.timeline) return null;
           const isSingle = elements.length === 1;
           const color = isSingle ? "#2563eb" : colors[index % colors.length];
           
           const forecastData = data.timeline.slice(splitIdx);
           const upperStr = forecastData.map((p, idx) => {
             const i = splitIdx + idx;
             const x = padX + (i / (totalPts - 1)) * (w - padX * 2);
             const y = (h - padY) - ((p.upper - min) / range) * (h - padY * 2);
             return `${x},${y}`;
           });
           const lowerStr = [...forecastData].reverse().map((p, idx) => {
             const i = (totalPts - 1) - idx;
             const x = padX + (i / (totalPts - 1)) * (w - padX * 2);
             const y = (h - padY) - ((p.lower - min) / range) * (h - padY * 2);
             return `${x},${y}`;
           });
           const polygonPoints = [...upperStr, ...lowerStr].join(' ');
           return (
             <g key={`interval-${data.id}`}>
               <polygon points={polygonPoints} fill={color} fillOpacity={isSingle ? "0.15" : "0.08"} stroke="none" />
               <polygon points={polygonPoints} fill="none" stroke={color} strokeWidth="1" strokeDasharray="4,4" strokeOpacity={isSingle ? "1" : "0.5"} />
             </g>
           );
        })}

        {elements.map((data, index) => {
          if (!data.timeline) return null;
          const isSingle = elements.length === 1;
          const color = isSingle ? "#2563eb" : colors[index % colors.length];
          const histColor = isSingle ? "#9ca3af" : color;
          
          const pts = data.timeline.map((p, i) => {
            const x = padX + (i / (totalPts - 1)) * (w - padX * 2);
            const y = (h - padY) - ((p.median - min) / range) * (h - padY * 2);
            return { x, y, val: p.median, lower: p.lower, upper: p.upper };
          });

          const historyPoints = pts.slice(0, splitIdx + 1).map(p => `${p.x},${p.y}`).join(' ');
          const forecastPoints = pts.slice(splitIdx).map(p => `${p.x},${p.y}`).join(' ');
          
          const targetPoint = pts[targetIdx];
          
          return (
            <g key={`line-${data.id}`}>
              <polyline fill="none" stroke={histColor} strokeWidth={isSingle ? "3" : "1.5"} points={historyPoints} strokeLinecap="round" strokeLinejoin="round" />
              <polyline fill="none" stroke={color} strokeWidth={isSingle ? "4" : "2"} strokeDasharray={isSingle ? "6,6" : "4,4"} points={forecastPoints} strokeLinecap="round" strokeLinejoin="round" />
              
              {targetPoint && isSingle && (() => {
                 const targetUpperY = (h - padY) - ((targetPoint.upper - min) / range) * (h - padY * 2);
                 const targetLowerY = (h - padY) - ((targetPoint.lower - min) / range) * (h - padY * 2);
                 return (
                   <g>
                     <line x1={targetPoint.x} y1={targetUpperY} x2={targetPoint.x} y2={targetLowerY} stroke="#2563eb" strokeWidth="2" />
                     <circle cx={targetPoint.x} cy={targetUpperY} r="3" fill="#bfdbfe" stroke="#2563eb" />
                     <circle cx={targetPoint.x} cy={targetLowerY} r="3" fill="#bfdbfe" stroke="#2563eb" />
                     <circle cx={targetPoint.x} cy={targetPoint.y} r="6" fill="#ffffff" stroke="#2563eb" strokeWidth="3" />
                     
                     <rect x={targetPoint.x - 20} y={targetPoint.y - 35} width="40" height="20" rx="4" fill="#111827" />
                     <text x={targetPoint.x} y={targetPoint.y - 21} textAnchor="middle" fill="#ffffff" className="font-bold text-[11px]">{targetPoint.val.toFixed(2)}</text>
                     <text x={targetPoint.x} y={targetLowerY + 15} textAnchor="middle" fill="#2563eb" className="font-bold text-[10px]">{targetPoint.lower.toFixed(2)}</text>
                     <text x={targetPoint.x} y={targetUpperY - 8} textAnchor="middle" fill="#2563eb" className="font-bold text-[10px]">{targetPoint.upper.toFixed(2)}</text>
                   </g>
                 )
              })()}
              {targetPoint && !isSingle && <circle cx={targetPoint.x} cy={targetPoint.y} r="4" fill="#ffffff" stroke={color} strokeWidth="2" />}
            </g>
          );
        })}

        {elements.length === 1 && (
          <g transform={`translate(${padX}, ${padY - 20})`}>
             <line x1="0" y1="0" x2="20" y2="0" stroke="#9ca3af" strokeWidth="2" />
             <text x="25" y="4" fill="#6b7280" className="text-[10px]">歷史中位數</text>

             <line x1="85" y1="0" x2="105" y2="0" stroke="#2563eb" strokeWidth="2" strokeDasharray="4,4" />
             <text x="110" y="4" fill="#6b7280" className="text-[10px]">流行度預測中位數</text>

             <rect x="170" y="-4" width="12" height="8" fill="#eff6ff" stroke="#93c5fd" />
             <text x="185" y="4" fill="#6b7280" className="text-[10px]">95% 預測區間</text>
          </g>
        )}
      </svg>
      
      <div className="mt-4 flex flex-wrap gap-2">
        {elements.map((data, index) => {
          const color = elements.length === 1 ? "#2563eb" : colors[index % colors.length];
          return (
            <div key={`legend-${data.id}`} className="flex items-center gap-1.5 bg-[#f8fafc] border border-[#e5e7eb] px-2 py-1 rounded">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
              <span className="text-xs font-bold text-[#374151]">{data.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
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
  setSubStep,
  subStep
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
      fetch(import.meta.env.BASE_URL + 'db.json')
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
    fetch(import.meta.env.BASE_URL + 'db.json')
      .then(res => res.json())
      .then(dbData => {
        const aiData = dbData.ai_trend_elements || [];
        const combos = dbData.historical_stable_combinations || [];
        setHistoricalCombos(combos);
        
        const sorted = aiData.sort((a, b) => b.score - a.score);
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

        const top30 = sorted.slice(0, 30).map(item => ({
          id: item.id,
          category: item.category,
          name: item.name,
          trendScore: item.score,
          interval: item.interval,
          timeline: item.timeline || [],
          isTrend: true
        }));
        
        // Merge AI elements and basic elements
        const mergedMap = new Map();
        
        // First add basic elements
        Array.from(basicElementsMap.values()).forEach(el => {
          mergedMap.set(el.name, el);
        });
        
        // Then add AI elements (merging tags if overlap)
        top30.forEach(el => {
          if (mergedMap.has(el.name)) {
            const existing = mergedMap.get(el.name);
            existing.isTrend = true;
            existing.trendScore = el.trendScore;
            existing.interval = el.interval;
            existing.timeline = el.timeline;
          } else {
            mergedMap.set(el.name, el);
          }
        });
        
        const mergedArray = Array.from(mergedMap.values());
        
        // Define category order
        const CATEGORY_ORDER = ['品項', '主色', '配色', '面料', '圖騰印花', '細節設計'];
        
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
                else val = '-';
              } else val = '-';
            }
            else if (req.id === 'req-2') { 
              if (cat === '圖騰印花') {
                if (['復古格紋', '千鳥格', '變形蟲', '波卡圓點'].some(k => name.includes(k))) val = 'O';
                else if (['大面積文字Logo', '賽博龐克', '3D漸層', '渲染/紮染'].some(k => name.includes(k))) val = 'X';
                else val = '-';
              } else val = '-';
            }
            else if (req.id === 'req-3') { 
              if (cat === '細節設計') {
                if (['工裝大口袋', '古銅五金', '燈芯絨拼接', '抽繩抓皺'].some(k => name.includes(k))) val = 'O';
                else if (['無縫膠條', '反光條', '螢光拉鍊', '鏤空剪裁', '金屬拉鍊外露'].some(k => name.includes(k))) val = 'X';
                else val = '-';
              } else val = '-';
            }
            else if (req.id === 'req-4') { 
              if (cat === '面料') {
                if (['羊毛', '粗花呢', '絲絨', '重磅丹寧'].some(k => name.includes(k))) val = 'O';
                else if (['透明薄紗', '高透氣亞麻', '冰絲'].some(k => name.includes(k))) val = 'X';
                else val = '-';
              }
              else if (cat === '品項') {
                if (['大衣', '毛衣', '長褲', '高領', '針織'].some(k => name.includes(k))) val = 'O';
                else if (['細肩帶', '超短褲', '平口', '短袖', '背心'].some(k => name.includes(k))) val = 'X';
                else val = '-';
              }
              else val = '-';
            }
            else if (req.id === 'req-5') { 
              if (cat === '品項') {
                if (['背心', '針織衫', '襯衫', '開襟衫', '大衣'].some(k => name.includes(k))) val = 'O';
                else if (['連身裙', '緊身洋裝'].some(k => name.includes(k))) val = 'X';
                else val = '-';
              } else val = '-';
            }
            else if (req.id === 'req-6') { 
              if (cat === '面料') {
                if (['環保再生棉', '聚酯纖維', '丹寧'].some(k => name.includes(k))) val = 'O';
                else if (['真絲', '訂製緹花', '特殊毛料'].some(k => name.includes(k))) val = 'X';
                else val = '-';
              } else val = 'O'; 
            }
            else if (req.id === 'req-7') { 
              if (cat === '細節設計') {
                if (['手工刺繡', '水鑽', '珍珠鑲嵌'].some(k => name.includes(k))) val = 'X';
                else if (['特殊金屬扣', '皮革'].some(k => name.includes(k))) val = '-';
                else val = 'O';
              } else val = 'O'; 
            }
            else if (req.id === 'req-8') { 
              if (['黑', '白', '標準T-shirt', '素色簡約', '環保再生棉'].some(k => name === k)) val = 'X';
              else val = 'O';
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
        setActiveTab('summary');
      });
  };


  const [draggableRowIdx, setDraggableRowIdx] = useState(null);

  const [hideEliminated, setHideEliminated] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);
  const [isVertical, setIsVertical] = useState(false);

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
      fetch(import.meta.env.BASE_URL + 'ai_predictions.json')
        .then(res => res.json())
        .then(data => {
          const sorted = data.sort((a, b) => b.score - a.score);
          
          // Generate realistic 21-month timeline (12 history + 9 forecast)
          const enhancedData = sorted.map(item => {
             if (item.timeline && item.timeline.length >= 21) {
               return item;
             }
             const seed = item.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
             const r = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
             const timeline = [];
             
             const spreadAt6 = item.interval ? (item.interval[1] - item.interval[0]) / 2 : Math.max(1, item.score * 0.1);
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
             return { ...item, timeline };
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
          <div className="flex justify-between items-end mb-4">
            <div>
              <h3 className="font-bold text-[#111827]">
                AI 流行元素預測系統匯入 {isReadOnly && <span className="text-[#dc2626]">(預覽模式)</span>}
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
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedCategory === cat ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`}
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
                    <td className="border border-[#d1d5db] p-2 font-medium text-[#111827] px-6" style={tdDropStyle}>
                      {el.name}
                      {el.score === '人工新增' && <span className="ml-2 text-xs bg-[#f3f4f6] text-[#6b7280] px-1 py-0.5 rounded">人工新增</span>}
                    </td>
                    <td className="border border-[#d1d5db] p-2 text-center" style={tdDropStyle}>
                      <input 
                        type="checkbox" 
                        checked={checkedElements.has(el.id)} 
                        onChange={() => toggleCheckElement(el.id)}
                        disabled={isReadOnly}
                        className="w-4 h-4 text-[#2563eb] rounded border-[#d1d5db] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="border border-[#d1d5db] p-2 text-center" style={tdDropStyle}>
                      <span className={el.score === '人工新增' ? 'text-[#6b7280] text-xs' : 'bg-[#fef3c7] text-[#92400e] px-2 py-0.5 rounded font-bold'}>
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
                    className="w-4 h-4 text-[#2563eb] rounded border-[#d1d5db] focus:ring-[#2563eb]"
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
              <button onClick={submitPhase1TrendAnalyst} className="bg-[#2563eb] text-white px-6 py-2 rounded shadow-sm hover:bg-[#1d4ed8]">確認選取並送出全部</button>
              <span className="text-sm text-[#4b5563]">已選取 {checkedElements.size} 個元素</span>
            </div>
          ) : (
            currentRole === '趨勢分析師' && trendAnalystSubmitted && phase === 1 && (
              <div className="mt-6 pt-4 border-t border-[#d1d5db] text-[#059669] font-bold">
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
            <h3 className="text-lg font-bold text-[#111827] mb-2">無存取權限</h3>
            <p className="text-sm text-center">品牌需求設定僅開放給「商品企劃」操作與檢視。<br/>其他職位請直接進行您的「部門契合度評估」，或等待「最終決策總表」解鎖。</p>
          </div>
        );
      }

      const isReadOnly = currentRole !== '商品企劃' || phase > 1 || plannerSubmitted;
      return (
        <div className="p-4 overflow-x-auto">
          <h3 className="font-bold text-[#111827] mb-4">建立品牌需求與權重</h3>
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
                    {!isReadOnly && <button onClick={() => removeRequirement(req.id)} className="text-red-600 hover:underline">刪除</button>}
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
            <button onClick={submitPhase1Planner} className="bg-[#2563eb] text-white px-4 py-2 rounded shadow-sm hover:bg-[#1d4ed8]">送出需求設定</button>
          ) : (
            currentRole === '商品企劃' && plannerSubmitted && phase === 1 && (
              <div className="mt-4 p-4 border border-[#d1d5db] bg-[#f9fafb] text-[#059669] font-bold inline-block">
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
          <h3 className="text-lg font-bold text-[#111827] mb-2">評估階段尚未開始</h3>
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

    const catHeaders = [];
    let lastCat = null;
    let count = 0;
    elements.forEach((el, i) => {
      if (el.category !== lastCat) {
        if (lastCat !== null) catHeaders.push({ category: lastCat, count });
        lastCat = el.category;
        count = 1;
      } else {
        count++;
      }
      if (i === elements.length - 1) catHeaders.push({ category: lastCat, count });
    });

    return (
      <div className="p-4 overflow-x-auto">

        <table className="border-collapse border border-[#d1d5db] text-sm w-max">
          <thead>
            <tr>
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              {catHeaders.map((cat, idx) => (
                <th key={idx} colSpan={cat.count} className="border border-[#d1d5db] bg-[#e5e7eb] p-2 text-center font-bold">
                  {cat.category}
                </th>
              ))}
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
            </tr>
            <tr>
              <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-left px-4">品牌需求條件</th>
              {elements.map(el => (
                <th key={el.id} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center text-[#111827] px-4">
                  <div className="flex flex-col items-center justify-center gap-1">
                    <span className="font-bold">{el.name}</span>
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {el.isTrend && el.isBasic ? (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold whitespace-nowrap">熱門+長青</span>
                      ) : el.isTrend ? (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold whitespace-nowrap">AI趨勢</span>
                      ) : el.isBasic ? (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold whitespace-nowrap">長青基礎</span>
                      ) : null}
                    </div>
                  </div>
                </th>
              ))}
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
                  {elements.map(el => {
                    const state = matrixState[req.id]?.[el.id] || '-';
                    let cellBg = 'bg-white';
                    if (state === 'X') cellBg = 'bg-[#fee2e2]';
                    if (state === 'O') cellBg = 'bg-[#fef3c7]';

                    return (
                      <td key={`${req.id}-${el.id}`} className={`border border-[#d1d5db] p-1 text-center ${cellBg} px-2`}>
                        <select 
                          value={state}
                          onChange={(e) => handleCellChange(req.id, el.id, e.target.value)}
                          className="w-full h-full p-1 bg-transparent border border-[#d1d5db] rounded text-center cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
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
          <button onClick={submitPhase2Evaluation} className="bg-[#2563eb] text-white px-4 py-2 rounded shadow-sm hover:bg-[#1d4ed8]">送出我的評估結果</button>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (phase < 3) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-[#4b5563]">
          <div className="mb-4 bg-[#f3f4f6] p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[#111827] mb-2">總表尚未解鎖</h3>
          <p className="text-sm">必須等待所有相關部門完成「契合度評估」後，最終決策總表才會開放。</p>
        </div>
      );
    }
    const augmentedElements = elements.map((el, originalIndex) => {
      let fitScore = 0;
      let isEliminated = false;
      requirements.forEach((req) => {
        const state = matrixState[req.id]?.[el.id] || '-';
        if (state === 'X') isEliminated = true;
        if (state === 'O') fitScore += req.weight;
      });
      return {
        ...el,
        originalIndex,
        fitScore,
        isEliminated,
        trendScore: el.trendScore !== undefined ? el.trendScore : 'N/A'
      };
    });

    let displayElements = [...augmentedElements];
    if (hideEliminated) {
      displayElements = displayElements.filter(el => !el.isEliminated);
    }

    displayElements.sort((a, b) => {
      if (sortBy === 'trend') {
        const valA = a.trendScore === '人工新增' || a.trendScore === 'N/A' ? 0 : a.trendScore;
        const valB = b.trendScore === '人工新增' || b.trendScore === 'N/A' ? 0 : b.trendScore;
        return valB - valA;
      }
      if (sortBy === 'fit') {
        return b.fitScore - a.fitScore;
      }
      return a.originalIndex - b.originalIndex;
    });

    return (
      <div className="p-4 overflow-x-auto">
        <div className="mb-4 text-[#4b5563] text-sm bg-green-50 border border-green-200 p-3 rounded w-max">
          <strong className="text-green-700">總表已解鎖：</strong> 所有部門皆已完成評估，現可於商品企劃會議中討論以下結果。
        </div>

        <div className="mb-4 flex gap-4 items-center bg-white p-3 border border-[#d1d5db] rounded shadow-sm w-max">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#111827]">
            <input type="checkbox" checked={hideEliminated} onChange={e => setHideEliminated(e.target.checked)} className="w-4 h-4 text-[#2563eb]" />
            隱藏淘汰元素
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#111827]">
            <input type="checkbox" checked={hideDetails} onChange={e => {
              setHideDetails(e.target.checked);
              if (!e.target.checked) setIsVertical(false);
            }} className="w-4 h-4 text-[#2563eb]" />
            隱藏需求和表格細節 (只留最後分數)
          </label>
          {hideDetails && (
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-[#111827] ml-4 border-l pl-4 border-[#d1d5db]">
              <input type="checkbox" checked={isVertical} onChange={e => setIsVertical(e.target.checked)} className="w-4 h-4 text-[#2563eb]" />
              轉為直式清單
            </label>
          )}
        </div>

        {isVertical ? (
          <table className="border-collapse border border-[#d1d5db] text-sm w-max">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="border border-[#d1d5db] p-2 px-4 text-left">分類</th>
                <th className="border border-[#d1d5db] p-2 px-4 text-left">元素名稱</th>
                <th className="border border-[#d1d5db] p-2 px-4 cursor-pointer hover:bg-[#e5e7eb] transition-colors" onClick={() => setSortBy('analyst')}>
                  分析師順序 {sortBy === 'analyst' && <span className="text-[#2563eb]">↓</span>}
                </th>
                <th className="border border-[#d1d5db] p-2 px-4 cursor-pointer hover:bg-[#e5e7eb] transition-colors" onClick={() => setSortBy('trend')}>
                  流行度預測中位數 (+6個月) {sortBy === 'trend' && <span className="text-[#2563eb]">↓</span>}
                </th>
                <th className="border border-[#d1d5db] p-2 px-4 text-center">區間 (+/-)</th>
                <th className="border border-[#d1d5db] p-2 px-4 cursor-pointer hover:bg-[#e5e7eb] transition-colors" onClick={() => setSortBy('fit')}>
                  品牌契合度 {sortBy === 'fit' && <span className="text-[#2563eb]">↓</span>}
                </th>
                <th className="border border-[#d1d5db] p-2 px-4">狀態</th>
              </tr>
            </thead>
            <tbody>
              {displayElements.length === 0 ? (
                <tr><td colSpan="7" className="p-4 text-center text-[#6b7280]">無符合條件的元素</td></tr>
              ) : displayElements.map(el => {
                const isOverlay = overlayElements.find(o => o.id === el.id);
                return (
                <tr key={el.id} className="hover:bg-[#f9fafb]">
                  <td className="border border-[#d1d5db] p-2 px-4">{el.category}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 font-bold text-[#111827]">{el.name}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center text-[#6b7280]">#{el.originalIndex + 1}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center bg-[#fef3c7] text-[#92400e] font-semibold">{el.trendScore}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center text-[#6b7280] font-medium">{el.interval && typeof el.trendScore === 'number' ? `+${(el.interval[1] - el.trendScore).toFixed(2)} / -${(el.trendScore - el.interval[0]).toFixed(2)}` : '-'}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center bg-[#ecfdf5] text-[#059669] font-bold">{el.fitScore}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center">
                    {el.isEliminated ? <span className="text-[#dc2626] font-bold">淘汰</span> : <span className="text-[#059669]">保留</span>}
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        ) : (
          <table className="border-collapse border border-[#d1d5db] text-sm w-max">
            <thead>
              <tr>
                <th colSpan="2" className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right text-[#4b5563] text-xs">排序依據</th>
                <th colSpan={displayElements.length} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-left">
                  <div className="flex gap-2">
                    <button onClick={() => setSortBy('analyst')} className={`px-2 py-1 rounded text-xs font-semibold ${sortBy === 'analyst' ? 'bg-[#2563eb] text-white' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]'}`}>分析師順序</button>
                    <button onClick={() => setSortBy('trend')} className={`px-2 py-1 rounded text-xs font-semibold ${sortBy === 'trend' ? 'bg-[#2563eb] text-white' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]'}`}>流行度預測中位數</button>
                    <button onClick={() => setSortBy('fit')} className={`px-2 py-1 rounded text-xs font-semibold ${sortBy === 'fit' ? 'bg-[#2563eb] text-white' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]'}`}>品牌契合度</button>
                  </div>
                </th>
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              </tr>
              <tr>
                <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right">分類</th>
                {(() => {
                  const catHeaders = [];
                  let lastCat = null;
                  let count = 0;
                  displayElements.forEach((el, i) => {
                    if (el.category !== lastCat) {
                      if (lastCat !== null) catHeaders.push({ category: lastCat, count });
                      lastCat = el.category;
                      count = 1;
                    } else {
                      count++;
                    }
                    if (i === displayElements.length - 1) catHeaders.push({ category: lastCat, count });
                  });
                  return catHeaders.map((cat, idx) => (
                    <th key={idx} colSpan={cat.count} className="border border-[#d1d5db] bg-[#e5e7eb] p-2 text-center font-bold">
                      {cat.category}
                    </th>
                  ));
                })()}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              </tr>
              <tr>
                <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right">元素名稱</th>
                {displayElements.map(el => (
                  <th key={el.id} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center text-[#111827] px-4 min-w-[80px]">
                    <div className="flex flex-col items-center justify-center gap-1">
                      <span className="font-bold">{el.name}</span>
                      <div className="flex flex-wrap items-center justify-center gap-1">
                        {el.isTrend && el.isBasic ? (
                          <span className="text-[10px] bg-purple-100 text-purple-700 px-1 py-0.5 rounded font-bold whitespace-nowrap">熱門+長青</span>
                        ) : el.isTrend ? (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded font-bold whitespace-nowrap">AI趨勢</span>
                        ) : el.isBasic ? (
                          <span className="text-[10px] bg-green-100 text-green-700 px-1 py-0.5 rounded font-bold whitespace-nowrap">長青基礎</span>
                        ) : null}
                      </div>
                    </div>
                  </th>
                ))}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-center px-4">負責職位</th>
              </tr>
              <tr>
                <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right">流行度預測中位數與區間 (+6個月)</th>
                {displayElements.map(el => {
                  const spreadUp = el.interval && typeof el.trendScore === 'number' ? (el.interval[1] - el.trendScore).toFixed(2) : null;
                  const spreadDown = el.interval && typeof el.trendScore === 'number' ? (el.trendScore - el.interval[0]).toFixed(2) : null;
                  return (
                    <th 
                      key={`trend-${el.id}`} 
                      className="border border-[#d1d5db] bg-[#fef3c7] p-2 text-center cursor-pointer hover:bg-[#fde68a] transition-colors min-w-[100px]"
                      onDoubleClick={() => handleDoubleClick(el)}
                      title="點擊兩下放大趨勢圖"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[#92400e] font-bold text-sm">{el.trendScore}</span>
                        {spreadUp !== null && <span className="text-[#b45309] text-[11px] font-medium leading-tight mt-1">+{spreadUp}<br/>-{spreadDown}</span>}
                      </div>
                    </th>
                  );
                })}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              </tr>
              <tr>
                {hideDetails ? (
                  <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right px-4">品牌契合度</th>
                ) : (
                  <>
                    <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-left px-4 w-48">品牌需求條件</th>
                    <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-center px-4 w-16">權重</th>
                    <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right px-4">品牌契合度</th>
                  </>
                )}
                {displayElements.map(el => (
                  <th key={`fit-${el.id}`} className="border border-[#d1d5db] bg-[#ecfdf5] p-2 text-center text-[#059669] font-bold">
                    {el.isEliminated ? <span className="text-[#dc2626]">淘汰</span> : el.fitScore}
                  </th>
                ))}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {displayElements.length === 0 ? (
                <tr><td colSpan={displayElements.length + 4} className="p-4 text-center text-[#6b7280]">無符合條件的元素</td></tr>
              ) : hideDetails ? null : [...requirements].sort((a, b) => a.role.localeCompare(b.role)).map((req, index, sortedReqs) => {
                const isFirstInDept = index === 0 || sortedReqs[index - 1].role !== req.role;
                const deptCount = sortedReqs.filter(r => r.role === req.role).length;

                return (
                  <tr key={req.id} className="hover:bg-[#f9fafb]">
                    <td className="border border-[#d1d5db] p-2 text-[#374151] px-4 whitespace-nowrap">
                      {req.name}
                    </td>
                    <td className="border border-[#d1d5db] p-2 text-center font-medium text-[#4b5563] bg-[#f9fafb] px-4">
                      {req.weight}
                    </td>
                    <td className="border border-[#d1d5db] bg-[#f3f4f6]"></td>
                    {displayElements.map(el => {
                      const state = matrixState[req.id]?.[el.id] || '-';
                      let cellBg = 'bg-white';
                      if (state === 'X') cellBg = 'bg-[#fee2e2]';
                      if (state === 'O') cellBg = 'bg-[#fef3c7]';

                      return (
                        <td key={`${req.id}-${el.id}`} className={`border border-[#d1d5db] p-2 text-center ${cellBg} font-medium text-[#374151]`}>
                          {state}
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
        )}
      </div>
    );
  };

  const canViewTrends = currentRole === '趨勢分析師' || currentRole === '設計師' || currentRole === '高階主管' || (currentRole === '商品企劃' && plannerSubmitted) || phase > 1;
  const canViewRequirements = currentRole === '商品企劃';
  const canViewEvaluation = phase >= 2;

  const canViewSummary = phase === 3;

  useEffect(() => {
    const visibleTabs = [
      ...(canViewTrends ? ['trends'] : []),
      ...(canViewRequirements ? ['requirements'] : []),
      ...(canViewEvaluation ? ['evaluation'] : []),
      ...(canViewSummary ? ['summary'] : [])
    ];
    if (visibleTabs.length > 0 && !visibleTabs.includes(activeTab)) {
      setActiveTab(visibleTabs[0]);
    }
  }, [currentRole, phase, plannerSubmitted, trendAnalystSubmitted, activeTab, canViewTrends, canViewRequirements, canViewEvaluation, canViewSummary]);

  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm flex flex-col relative h-full">
      {subStep === 1 && (
        <div className="flex border-b border-[#d1d5db] bg-[#f9fafb] px-4 pt-2 shrink-0 overflow-x-auto gap-1 items-center">
          <div className="flex gap-1 flex-1">
            {canViewTrends && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'trends' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('trends')}>流行元素預測</button>}
            {canViewRequirements && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'requirements' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('requirements')}>品牌需求與權重</button>}
            {canViewEvaluation && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'evaluation' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('evaluation')}>部門契合度評估</button>}
            {canViewSummary && <button className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap ${activeTab === 'summary' ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#6b7280] hover:text-[#374151]'}`} onClick={() => setActiveTab('summary')}>最終決策總表</button>}
          </div>
          
          <div className="flex items-center gap-4 pb-2 pr-4">
            <button 
              onClick={handleAutoFillDemo}
              className="bg-red-100 text-red-600 border border-red-300 px-3 py-1 rounded-full text-xs font-bold hover:bg-red-200 transition-colors shadow-sm whitespace-nowrap"
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
          {activeTab === 'summary' && renderSummary()}
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
          <TrendyStyleDecision />
        </div>
      )}
    </div>
  );
}
