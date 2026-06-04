import React, { useState } from 'react';




export const DecisionSummaryTable = ({ elements, matrixState, requirements, phase, isPreview, onExpand }) => {
  
  const [isVertical, setIsVertical] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [sortBy, setSortBy] = useState('analyst');
  const [hideEliminated, setHideEliminated] = useState(false);
  const [hideDetails, setHideDetails] = useState(false);
  
  const toggleCollapse = (cat) => {
    const newSet = new Set(collapsedCategories);
    if (newSet.has(cat)) newSet.delete(cat);
    else newSet.add(cat);
    setCollapsedCategories(newSet);
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

  // Render logic from renderSummary

    if (phase < 3) {
      return (
        <div className="p-12 flex flex-col items-center justify-center text-[#4b5563]">
          <div className="mb-4 bg-[#f3f4f6] p-4 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9ca3af]">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <h3 className="text-lg font-bold text-content-main mb-2">總表尚未解鎖</h3>
          <p className="text-sm">必須等待所有相關部門完成「契合度評估」後，流行契合表才會開放。</p>
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
      if (a.category !== b.category) {
        return a.originalIndex - b.originalIndex;
      }
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

    if (isPreview) {
      const grouped = {};
      displayElements.forEach(el => {
        if (!grouped[el.category]) grouped[el.category] = [];
        if (grouped[el.category].length < 3) {
          grouped[el.category].push(el);
        }
      });
      displayElements = Object.values(grouped).flat();
    }

    const effectiveHideDetails = isPreview ? true : hideDetails;
    const effectiveIsVertical = isPreview ? false : isVertical;

    return (
      <div className="p-4 overflow-x-auto relative">
        {isPreview && (
          <div className="absolute top-0 right-4 z-10">
            <button onClick={onExpand} className="bg-primary text-white px-4 py-2 rounded shadow text-sm font-bold hover:bg-[#1d4ed8]">
              查看完整流行契合表
            </button>
          </div>
        )}


        {!isPreview && <div className="mb-4 flex gap-4 items-center bg-white p-3 border border-[#d1d5db] rounded shadow-sm w-max">
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-content-main">
            <input type="checkbox" checked={hideEliminated} onChange={e => setHideEliminated(e.target.checked)} className="w-4 h-4 text-primary" />
            隱藏淘汰元素
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-content-main">
            <input type="checkbox" checked={hideDetails} onChange={e => {
              setHideDetails(e.target.checked);
              if (!e.target.checked) setIsVertical(false);
            }} className="w-4 h-4 text-primary" />
            隱藏需求和表格細節 (只留最後分數)
          </label>
          {effectiveHideDetails && (
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-content-main ml-4 border-l pl-4 border-[#d1d5db]">
              <input type="checkbox" checked={isVertical} onChange={e => setIsVertical(e.target.checked)} className="w-4 h-4 text-primary" />
              轉為直式清單
            </label>
          )}
          {!effectiveIsVertical && (
            <button onClick={toggleAllCollapse} className="ml-auto bg-[#f3f4f6] text-[#4b5563] px-3 py-1 rounded text-xs font-bold shadow-sm hover:bg-[#e5e7eb] border border-[#d1d5db]">
              {collapsedCategories.size > 0 ? '全部展開' : '全部縮起'}
            </button>
          )}
        </div>}

        {effectiveIsVertical ? (
          <table className="border-collapse border border-[#d1d5db] text-sm w-max">
            <thead>
              <tr className="bg-[#f3f4f6]">
                <th className="border border-[#d1d5db] p-2 px-4 text-left">分類</th>
                <th className="border border-[#d1d5db] p-2 px-4 text-left">元素名稱</th>
                <th className="border border-[#d1d5db] p-2 px-4 cursor-pointer hover:bg-[#e5e7eb] transition-colors" onClick={() => setSortBy('analyst')}>
                  分析師順序 {sortBy === 'analyst' && <span className="text-primary">↓</span>}
                </th>
                <th className="border border-[#d1d5db] p-2 px-4 cursor-pointer hover:bg-[#e5e7eb] transition-colors" onClick={() => setSortBy('trend')}>
                  流行度預測中位數 (+6個月) {sortBy === 'trend' && <span className="text-primary">↓</span>}
                </th>
                <th className="border border-[#d1d5db] p-2 px-4 text-center">區間 (+/-)</th>
                <th className="border border-[#d1d5db] p-2 px-4 cursor-pointer hover:bg-[#e5e7eb] transition-colors" onClick={() => setSortBy('fit')}>
                  品牌契合度 {sortBy === 'fit' && <span className="text-primary">↓</span>}
                </th>
                <th className="border border-[#d1d5db] p-2 px-4">狀態</th>
              </tr>
            </thead>
            <tbody>
              {displayElements.length === 0 ? (
                <tr><td colSpan="7" className="p-4 text-center text-[#6b7280]">無符合條件的元素</td></tr>
              ) : displayElements.map(el => {
                                return (
                <tr key={el.id} className="hover:bg-[#f9fafb]">
                  <td className="border border-[#d1d5db] p-2 px-4">{el.category}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 font-bold text-content-main">{el.name}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center text-[#6b7280]">#{el.originalIndex + 1}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center text-content-main font-bold bg-white">{el.trendScore}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center text-[#6b7280] font-medium">{el.interval && typeof el.trendScore === 'number' ? `+${(el.interval[1] - el.trendScore).toFixed(2)} / -${(el.trendScore - el.interval[0]).toFixed(2)}` : '-'}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center bg-status-good-bg text-status-good-text font-bold">{el.fitScore}</td>
                  <td className="border border-[#d1d5db] p-2 px-4 text-center">
                    {el.isEliminated ? <span className="text-status-bad-text font-bold">淘汰</span> : <span className="text-status-good-text">保留</span>}
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
                <th colSpan={getGroupedColumns(displayElements).length} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-left">
                  <div className="flex gap-2">
                    <button onClick={() => setSortBy('analyst')} className={`px-2 py-1 rounded text-xs font-semibold ${sortBy === 'analyst' ? 'bg-primary text-white' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]'}`}>分析師順序</button>
                    <button onClick={() => setSortBy('trend')} className={`px-2 py-1 rounded text-xs font-semibold ${sortBy === 'trend' ? 'bg-primary text-white' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]'}`}>流行度預測中位數</button>
                    <button onClick={() => setSortBy('fit')} className={`px-2 py-1 rounded text-xs font-semibold ${sortBy === 'fit' ? 'bg-primary text-white' : 'bg-[#e5e7eb] text-[#374151] hover:bg-[#d1d5db]'}`}>品牌契合度</button>
                  </div>
                </th>
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              </tr>
              <tr>
                <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right">分類</th>
                {(() => {
                  const groupedColumns = getGroupedColumns(displayElements);
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
                  return catHeaders.map((cat, idx) => (
                    <th key={idx} colSpan={cat.count} className="border border-[#d1d5db] bg-[#e5e7eb] p-2 text-center font-bold cursor-pointer hover:bg-[#d1d5db] transition-colors select-none" onDoubleClick={() => toggleCollapse(cat.category)} title="雙擊展開/縮起">
                      {cat.category} {cat.isCollapsed ? '+' : '-'}
                    </th>
                  ));
                })()}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              </tr>
              <tr>
                <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right">元素名稱</th>
                {getGroupedColumns(displayElements).map((col, idx) => {
                  if (col.type === 'collapsed') return <th key={'col-'+idx} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center text-gray-400 px-4 min-w-[30px] cursor-pointer hover:bg-[#e5e7eb]" onDoubleClick={() => toggleCollapse(col.category)}>...</th>;
                  const el = col.element;
                  return (
                  <th key={el.id} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center text-content-main px-4 min-w-[80px]">
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
              <tr>
                <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right">流行度預測中位數與區間 (+6個月)</th>
                {getGroupedColumns(displayElements).map((col, idx) => {
                  if (col.type === 'collapsed') return <th key={'col-'+idx} className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center cursor-pointer hover:bg-[#e5e7eb]" onDoubleClick={() => toggleCollapse(col.category)}></th>;
                  const el = col.element;
                  let spreadUp = null;
                  let spreadDown = null;
                  const safeTrendScore = typeof el.trendScore === 'number' ? el.trendScore : parseFloat(el.trendScore || 0);
                  
                  if (el.interval && !isNaN(safeTrendScore)) {
                    if (Array.isArray(el.interval) && el.interval.length === 2 && !isNaN(el.interval[0]) && !isNaN(el.interval[1])) {
                      spreadUp = Math.max(0, el.interval[1] - safeTrendScore).toFixed(2);
                      spreadDown = Math.max(0, safeTrendScore - el.interval[0]).toFixed(2);
                    } else if (el.interval.upper !== undefined && el.interval.lower !== undefined && !isNaN(el.interval.upper) && !isNaN(el.interval.lower)) {
                      spreadUp = Math.max(0, el.interval.upper - safeTrendScore).toFixed(2);
                      spreadDown = Math.max(0, safeTrendScore - el.interval.lower).toFixed(2);
                    }
                  }
                  return (
                    <th 
                      key={`trend-${el.id}`} 
                      className="border border-[#d1d5db] bg-[#f9fafb] p-2 text-center cursor-pointer hover:bg-[#f3f4f6] transition-colors min-w-[100px]"
                      
                      title="點擊兩下放大趨勢圖"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-content-main font-bold text-sm">{!isNaN(safeTrendScore) ? safeTrendScore.toFixed(1) : 0}</span>
                        {spreadUp !== null && spreadUp !== "NaN" && <span className="text-[#6b7280] text-[11px] font-medium leading-tight mt-1">+{spreadUp}<br/>-{spreadDown}</span>}
                      </div>
                    </th>
                  );
                })}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2"></th>
              </tr>
              <tr>
                {effectiveHideDetails ? (
                  <th colSpan="3" className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right px-4">品牌契合度</th>
                ) : (
                  <>
                    <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-left px-4 w-48">品牌需求條件</th>
                    <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-center px-4 w-16">權重</th>
                    <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 text-right px-4">品牌契合度</th>
                  </>
                )}
                {getGroupedColumns(displayElements).map((col, idx) => {
                  if (col.type === 'collapsed') return <th key={'col-'+idx} className="border border-[#d1d5db] bg-[#f3f4f6] p-2 cursor-pointer hover:bg-[#e5e7eb]" onDoubleClick={() => toggleCollapse(col.category)}></th>;
                  const el = col.element;
                  return (
                  <th key={`fit-${el.id}`} className="border border-[#d1d5db] bg-status-good-bg p-2 text-center text-status-good-text font-bold">
                    {el.isEliminated ? <span className="text-status-bad-text">淘汰</span> : el.fitScore}
                  </th>
                )})}
                <th className="border border-[#d1d5db] bg-[#f3f4f6] p-2 w-20"></th>
              </tr>
            </thead>
            <tbody>
              {displayElements.length === 0 ? (
                <tr><td colSpan={getGroupedColumns(displayElements).length + 4} className="p-4 text-center text-[#6b7280]">無符合條件的元素</td></tr>
              ) : effectiveHideDetails ? null : [...requirements].sort((a, b) => a.role.localeCompare(b.role)).map((req, index, sortedReqs) => {
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
                    {getGroupedColumns(displayElements).map((col, idx) => {
                      if (col.type === 'collapsed') return <td key={'col-'+idx} className="border border-[#d1d5db] bg-[#f3f4f6] cursor-pointer hover:bg-[#e5e7eb]" onDoubleClick={() => toggleCollapse(col.category)}></td>;
                      const el = col.element;
                      const state = matrixState[req.id]?.[el.id] || '-';
                      let cellBg = 'bg-white';
                      if (state === 'X') cellBg = 'bg-status-bad-bg text-status-bad-text font-bold';
                      if (state === 'O') cellBg = 'bg-status-good-bg text-status-good-text font-bold';

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
