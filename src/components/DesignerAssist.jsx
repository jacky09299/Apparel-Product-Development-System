import React, { useState, useMemo } from 'react';
import { PenTool, Layers, Activity } from 'lucide-react';

export function DesignerAssist({ savedStyles }) {
  const [selectedStyleId, setSelectedStyleId] = useState('');
  const [selectedElement, setSelectedElement] = useState(null);

  const selectedStyle = savedStyles.find(s => s.id === selectedStyleId);

  // Mock heatmap data for different elements
  // Coordinates are relative to a 100x110 viewBox
  const heatmapData = useMemo(() => ({
    '品牌Logo': [
      { cx: 70, cy: 35, r: 15, intensity: 0.9 }, // Left chest (viewer's right)
      { cx: 15, cy: 45, r: 10, intensity: 0.6 }, // Right sleeve (viewer's left)
    ],
    '特殊印花': [
      { cx: 50, cy: 45, r: 25, intensity: 0.85 }, // Center chest
      { cx: 50, cy: 80, r: 20, intensity: 0.4 },  // Lower hem
    ],
    '機能口袋': [
      { cx: 70, cy: 35, r: 15, intensity: 0.6 },  // Left chest pocket
      { cx: 30, cy: 85, r: 15, intensity: 0.9 },  // Lower right side
      { cx: 70, cy: 85, r: 15, intensity: 0.7 },  // Lower left side
    ],
    '異材質拼接': [
      { cx: 50, cy: 20, r: 20, intensity: 0.7 },  // Collar
      { cx: 15, cy: 45, r: 12, intensity: 0.8 },  // Right sleeve
      { cx: 85, cy: 45, r: 12, intensity: 0.8 },  // Left sleeve
    ],
    // Fallback for any other element
    'default': [
      { cx: 50, cy: 50, r: 30, intensity: 0.5 },
    ]
  }), []);

  const getHeatmapForElement = (elementName) => {
    // simple matching logic
    if (!elementName) return [];
    if (elementName.includes('Logo') || elementName.includes('標')) return heatmapData['品牌Logo'];
    if (elementName.includes('印花') || elementName.includes('圖騰') || elementName.includes('漸層') || elementName.includes('塗層')) return heatmapData['特殊印花'];
    if (elementName.includes('口袋') || elementName.includes('拉鍊') || elementName.includes('機能')) return heatmapData['機能口袋'];
    if (elementName.includes('拼接') || elementName.includes('剪裁') || elementName.includes('不對稱')) return heatmapData['異材質拼接'];
    return heatmapData['default'];
  };

  const activeHeatmaps = getHeatmapForElement(selectedElement);

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] p-6 animate-in fade-in duration-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <PenTool className="w-6 h-6 text-primary" />
          設計師設計輔助 (元素熱區分佈)
        </h2>
        <p className="text-sm text-gray-500 mt-1">選擇正在設計的組合與特定元素，查看由 AI 分析生成的「受歡迎元素佈局熱區圖」。越紅代表越多用戶喜歡該位置。</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Left Column: Selection */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full overflow-y-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 shrink-0">
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-500" />
              1. 選擇開發組合
            </h3>
            <select 
              value={selectedStyleId}
              onChange={(e) => {
                setSelectedStyleId(e.target.value);
                setSelectedElement(null);
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-primary focus:border-primary"
            >
              <option value="">-- 請選擇一個組合 --</option>
              {savedStyles.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {selectedStyle && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 shrink-0 animate-in fade-in">
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-500" />
                2. 選擇元素查看熱區
              </h3>
              <p className="text-xs text-gray-500 mb-4">點擊下方組合內的元素，右側將顯示該元素在歷史生成數據中最受歡迎的擺放位置。</p>
              
              <div className="flex flex-col gap-2">
                {selectedStyle.elements?.map((el, idx) => {
                  const elName = el.name || el.label;
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedElement(elName)}
                      className={`p-3 rounded-md text-sm font-bold text-left transition-colors border ${
                        selectedElement === elName 
                          ? 'bg-red-50 border-red-200 text-red-700 shadow-sm' 
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                      }`}
                    >
                      {elName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Clothing Heatmap */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col h-full overflow-hidden p-6 items-center justify-center relative bg-gradient-to-br from-white to-gray-50">
          {!selectedStyleId ? (
            <div className="text-center text-gray-400">
              <Layers className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p>請先在左側選擇一個開發組合</p>
            </div>
          ) : !selectedElement ? (
            <div className="text-center text-gray-400">
              <Activity className="w-16 h-16 mx-auto mb-3 opacity-20" />
              <p>請在左側選擇一個「元素」來查看分佈熱區</p>
            </div>
          ) : (
            <div className="relative w-full h-full max-h-[600px] max-w-[500px] flex items-center justify-center animate-in zoom-in-95 duration-300">
              
              {/* Title info */}
              <div className="absolute top-0 left-0 right-0 text-center z-20 pointer-events-none">
                <span className="bg-white/90 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-bold text-gray-800 shadow-sm inline-flex items-center gap-2 border border-gray-200">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                  {selectedElement} - 用戶偏好熱區
                </span>
              </div>

              {/* T-Shirt Heatmap SVG */}
              <svg viewBox="0 0 100 110" className="w-full h-full drop-shadow-xl" preserveAspectRatio="xMidYMid meet">
                <defs>
                  {/* Define the clothing silhouette as a clip path */}
                  <clipPath id="shirt-clip">
                    <path d="M 35 10 C 45 10 55 10 65 10 C 70 12 75 18 85 22 L 95 35 C 97 38 96 42 93 44 L 85 50 C 82 52 78 51 76 48 L 73 40 L 72 95 C 72 98 69 100 66 100 L 34 100 C 31 100 28 98 28 95 L 27 40 L 24 48 C 22 51 18 52 15 50 L 7 44 C 4 42 3 38 5 35 L 15 22 C 25 18 30 12 35 10 Z" />
                  </clipPath>

                  {/* Define radial gradients for the heatmap spots */}
                  {activeHeatmaps.map((hm, i) => (
                    <radialGradient key={`grad-${i}`} id={`heatmap-grad-${i}`} cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 1)" stopOpacity={hm.intensity} />
                      <stop offset="40%" stopColor="rgba(239, 68, 68, 1)" stopOpacity={hm.intensity * 0.6} />
                      <stop offset="70%" stopColor="rgba(239, 68, 68, 1)" stopOpacity={hm.intensity * 0.2} />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 1)" stopOpacity="0" />
                    </radialGradient>
                  ))}
                  
                  {/* Blur filter for smooth merging of spots */}
                  <filter id="blur-filter" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" />
                  </filter>
                </defs>

                {/* Base Shirt Shape */}
                <path 
                  d="M 35 10 C 45 10 55 10 65 10 C 70 12 75 18 85 22 L 95 35 C 97 38 96 42 93 44 L 85 50 C 82 52 78 51 76 48 L 73 40 L 72 95 C 72 98 69 100 66 100 L 34 100 C 31 100 28 98 28 95 L 27 40 L 24 48 C 22 51 18 52 15 50 L 7 44 C 4 42 3 38 5 35 L 15 22 C 25 18 30 12 35 10 Z" 
                  fill="#f3f4f6"
                  stroke="#d1d5db" 
                  strokeWidth="0.5"
                />

                {/* Masked Heatmap Layer */}
                <g clipPath="url(#shirt-clip)">
                  <g filter="url(#blur-filter)" style={{ mixBlendMode: 'multiply' }}>
                    {activeHeatmaps.map((hm, i) => (
                      <circle 
                        key={`spot-${i}`}
                        cx={hm.cx} 
                        cy={hm.cy} 
                        r={hm.r} 
                        fill={`url(#heatmap-grad-${i})`}
                        className="animate-in fade-in duration-500"
                        style={{ transformOrigin: `${hm.cx}px ${hm.cy}px` }}
                      />
                    ))}
                  </g>
                </g>
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1 z-20 text-[10px]">
                <div className="font-bold text-gray-700 mb-1">偏好程度</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600 opacity-90"></div>
                  <span className="text-gray-600">極高 (強烈喜歡)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 opacity-50"></div>
                  <span className="text-gray-600">中等</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400 opacity-20"></div>
                  <span className="text-gray-600">一般</span>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
