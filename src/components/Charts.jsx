import React, { useState } from 'react';

export const Sparkline = ({ data }) => {
  if (!data || data.length === 0 || typeof data[0] !== 'object' || data[0].median === undefined) return <span className="text-[#9ca3af] text-xs">無資料</span>;
  
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
      <polyline fill="none" stroke="#9ca3af" strokeWidth="1.5" points={historyPoints} strokeLinecap="round" strokeLinejoin="round" />
      <polyline fill="none" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="2,2" points={forecastPoints} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={targetX} cy={targetY} r="2.5" fill="#2563eb" />
    </svg>
  );
};

export const OverlayChartPanel = ({ elements }) => {
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
    <div className="bg-white p-4 border border-[#d1d5db] shadow-sm flex flex-col items-center">
      <div className="flex justify-between items-center w-full mb-4 px-4">
        <h4 className="font-bold text-content-main">元素流行度預測 (疊圖比較)</h4>
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showInterval} 
            onChange={(e) => setShowInterval(e.target.checked)} 
            className="w-4 h-4 text-primary rounded border-[#d1d5db]"
          />
          <span className="text-sm font-medium text-[#4b5563]">顯示信賴區間</span>
        </label>
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mb-4 w-full">
        {elements.map((el, i) => (
          <div key={el.id} className="flex items-center gap-1.5 text-sm font-bold bg-[#f3f4f6] px-2 py-1 rounded">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }}></span>
            {el.name}
          </div>
        ))}
      </div>

      <svg width={w} height={h} className="overflow-visible font-sans text-xs">
        <rect x={padX} y={padY} width={w - padX * 2} height={h - padY * 2} fill="#f9fafb" />
        
        {[0, 0.25, 0.5, 0.75, 1].map(pct => {
          const val = min + range * pct;
          const y = h - padY - (val - min) / range * (h - padY * 2);
          return (
            <g key={pct}>
              <line x1={padX} y1={y} x2={w - padX} y2={y} stroke="#e5e7eb" strokeDasharray="4,4" />
              <text x={padX - 8} y={y + 4} textAnchor="end" fill="#6b7280" className="text-[10px]">{Math.round(val)}</text>
            </g>
          );
        })}

        {labels.map(l => {
          if (l.idx >= totalPts) return null;
          const x = padX + (l.idx / (totalPts - 1)) * (w - padX * 2);
          const isNow = l.text === '現在';
          const isTarget = l.text === '+6個月';
          return (
            <g key={l.text}>
              <line 
                x1={x} y1={padY} 
                x2={x} y2={h - padY} 
                stroke={isNow ? "#9ca3af" : isTarget ? "#bfdbfe" : "#f3f4f6"} 
                strokeWidth={isNow || isTarget ? 2 : 1}
                strokeDasharray={isNow ? "4,4" : "none"}
              />
              <text 
                x={x} y={h - padY + 20} 
                textAnchor="middle" 
                fill={isNow ? "#374151" : isTarget ? "#2563eb" : "#6b7280"}
                className={isNow || isTarget ? "font-bold" : ""}
              >{l.text}</text>
            </g>
          );
        })}

        {elements.map((el, idx) => {
          if(!el.timeline) return null;
          const color = colors[idx % colors.length];
          const pts = el.timeline.map((d, i) => {
            const x = padX + (i / (el.timeline.length - 1)) * (w - padX * 2);
            const y = h - padY - (d.median - min) / range * (h - padY * 2);
            return `${x},${y}`;
          });

          const historyPoints = pts.slice(0, splitIdx + 1).join(' ');
          const forecastPoints = pts.slice(splitIdx).join(' ');

          const intervalPolygons = [];
          if (showInterval) {
            const createPolygon = (start, end) => {
              if (start >= end) return '';
              const topPts = [];
              const botPts = [];
              for (let i = start; i <= end; i++) {
                const d = el.timeline[i];
                if (!d) continue;
                const x = padX + (i / (el.timeline.length - 1)) * (w - padX * 2);
                const yTop = h - padY - (d.upper - min) / range * (h - padY * 2);
                const yBot = h - padY - (d.lower - min) / range * (h - padY * 2);
                topPts.push(`${x},${yTop}`);
                botPts.unshift(`${x},${yBot}`); 
              }
              return [...topPts, ...botPts].join(' ');
            };
            
            const pHist = createPolygon(0, splitIdx);
            if(pHist) intervalPolygons.push(<polygon key="hist" points={pHist} fill={color} opacity="0.1" />);
            const pFore = createPolygon(splitIdx, el.timeline.length - 1);
            if(pFore) intervalPolygons.push(<polygon key="fore" points={pFore} fill={color} opacity="0.15" />);
          }

          const targetPoint = el.timeline[targetIdx];
          let dot = null;
          if (targetPoint) {
            const targetX = padX + (targetIdx / (el.timeline.length - 1)) * (w - padX * 2);
            const targetY = h - padY - (targetPoint.median - min) / range * (h - padY * 2);
            dot = <circle cx={targetX} cy={targetY} r="4" fill={color} stroke="white" strokeWidth="2" />;
          }

          return (
            <g key={el.id}>
              {intervalPolygons}
              <polyline fill="none" stroke={color} strokeWidth="2" points={historyPoints} strokeLinecap="round" strokeLinejoin="round" opacity="0.8" />
              <polyline fill="none" stroke={color} strokeWidth="2" strokeDasharray="4,4" points={forecastPoints} strokeLinecap="round" strokeLinejoin="round" />
              {dot}
            </g>
          );
        })}
      </svg>
    </div>
  );
};
