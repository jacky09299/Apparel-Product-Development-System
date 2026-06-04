import React, { useState } from 'react';
import { CheckSquare, Square, CheckCircle2, AlertTriangle, Trash2, Package } from 'lucide-react';

export function TrendyStyleReview({ savedStyles, setSavedStyles, onSubmit }) {
  // Sort styles by risk score (highest first) to help planners decide
  const sortedStyles = [...savedStyles].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  const handleDecision = (id, decision) => {
    setSavedStyles(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          directToDev: decision === 'dev',
          needsPrediction: decision === 'predict',
          rejected: decision === 'reject'
        };
      }
      return s;
    }));
  };

  const pendingCount = savedStyles.filter(s => !s.directToDev && !s.needsPrediction && !s.rejected).length;

  const handleDemoFill = () => {
    // We want to map based on the sorted styles order to make sense visually
    const sortedIds = sortedStyles.map(s => s.id);
    setSavedStyles(prev => prev.map(s => {
      const index = sortedIds.indexOf(s.id);
      if (index === -1) return s; // shouldn't happen
      // Logic: 0 -> predict, 1 -> dev, 2 -> predict, 3 -> dev, 4 -> reject...
      const decision = index === 0 ? 'predict' : index === 1 ? 'dev' : index === 2 ? 'predict' : index === 3 ? 'dev' : 'reject';
      return {
        ...s,
        directToDev: decision === 'dev',
        needsPrediction: decision === 'predict',
        rejected: decision === 'reject'
      };
    }));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 p-6 animate-in fade-in duration-200">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-primary" />
            流行款審核 (商品企劃)
          </h2>
          <p className="text-sm text-gray-500 mt-1">請針對設計部提交的流行組合進行初審。選擇直接開發、淘汰，或交由分析師進行市場預測。</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="font-bold text-gray-700">待審核：</span>
            <span className={`font-mono ml-1 ${pendingCount > 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>{pendingCount}</span> 款
          </div>
          <button
            onClick={handleDemoFill}
            className="px-4 py-2 rounded-md font-bold text-sm bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors border border-indigo-200 shadow-sm"
          >
            ✨ DEMO 快速審核
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
            完成初審並移交預測
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto min-h-0 flex-1 pb-4">
        {sortedStyles.map(style => {
          return (
            <div 
              key={style.id} 
              className={`border bg-white rounded-lg p-5 flex flex-col gap-3 shadow-sm transition-all ${
                style.directToDev ? 'border-green-500 ring-1 ring-green-500' :
                style.needsPrediction ? 'border-orange-500 ring-1 ring-orange-500' :
                style.rejected ? 'border-gray-300 opacity-60 bg-gray-50' :
                'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800 text-lg leading-tight break-words pr-2">{style.name}</h3>
                <div className={`px-2 py-0.5 rounded text-xs font-bold whitespace-nowrap shrink-0 border ${
                  (style.riskScore || 0) > 60 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  風險: {style.riskScore}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1 mb-2">
                {style.elements.map(el => (
                  <span key={el.id} className="text-[11px] bg-gray-50 border border-gray-200 px-1.5 py-0.5 rounded text-gray-600">
                    {el.name}
                  </span>
                ))}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100">
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleDecision(style.id, 'dev')}
                    className={`py-1.5 px-1 rounded text-xs font-bold transition-colors ${
                      style.directToDev 
                        ? 'bg-green-600 text-white shadow-inner' 
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                    }`}
                  >
                    直接確認開發
                  </button>
                  <button
                    onClick={() => handleDecision(style.id, 'predict')}
                    className={`py-1.5 px-1 rounded text-xs font-bold transition-colors ${
                      style.needsPrediction 
                        ? 'bg-orange-500 text-white shadow-inner' 
                        : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200'
                    }`}
                  >
                    進行群眾預測
                  </button>
                  <button
                    onClick={() => handleDecision(style.id, 'reject')}
                    className={`py-1.5 px-1 rounded text-xs font-bold transition-colors ${
                      style.rejected 
                        ? 'bg-gray-500 text-white shadow-inner' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                    }`}
                  >
                    淘汰
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
