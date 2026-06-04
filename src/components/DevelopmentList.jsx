import React from 'react';
import { Package, Target, Clock, ArrowUpRight, FolderArchive, Activity } from 'lucide-react';

export function DevelopmentList({ historicalCombos, basicDecisions, savedStyles, setCurrentView }) {
  // 1. Basic styles that are accepted
  const basicStyles = historicalCombos
    .filter(combo => basicDecisions[combo.id] === 'approve' || basicDecisions[combo.id] === 'fine_tune')
    .map(combo => ({
      ...combo,
      type: 'basic',
      typeName: '長青基礎款',
      status: basicDecisions[combo.id] === 'approve' ? '✅ 確認開發' : '⚠️ 需微調'
    }));

  // 2. Trendy styles that bypass testing (direct to dev)
  const trendyDirectStyles = savedStyles
    .filter(style => style.directToDev === true)
    .map(style => ({
      ...style,
      type: 'trendy_direct',
      typeName: '流行款 (直接開發)',
      status: '✅ 確認開發'
    }));

  // 3. Trendy styles that passed prediction
  const trendyPredictedStyles = savedStyles
    .filter(style => style.predictionApproved === true)
    .map(style => ({
      ...style,
      // If there's a selected combo, we can display it. But since we didn't save the combo name in `style` directly,
      // we can fetch it if we want, or just append the combo ID. But actually, in FinalDecisionDashboard we only saved the ID.
      // We can just rely on the ID or update FinalDecisionDashboard to save the combo name.
      type: 'trendy_predicted',
      typeName: '流行款 (預測選定)',
      status: '✅ 確認開發'
    }));

  const allApprovedStyles = [...basicStyles, ...trendyDirectStyles, ...trendyPredictedStyles];

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center justify-between border-b border-[#d1d5db] pb-4">
        <h1 className="text-2xl font-bold text-content-main flex items-center gap-2">
          <FolderArchive className="w-6 h-6 text-primary" />
          開發款式庫
        </h1>
        <div className="flex gap-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-bold border border-primary/20">
            Total: {allApprovedStyles.length} 款
          </span>
        </div>
      </div>

      <p className="text-gray-500 text-sm">
        此列表紀錄所有「確定送進開發」的款式組合。包含長青基礎款，以及企劃核准直接開發、與群眾預測勝出後決議開發的流行款式。
      </p>

      {allApprovedStyles.length === 0 ? (
        <div className="bg-white border border-[#d1d5db] rounded-lg p-12 text-center shadow-sm">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700">目前尚無確認開發的款式</h3>
          <p className="text-gray-500 mt-2 text-sm">當您在決策過程中選擇「確認開發」或「直接投入開發」時，款式將會出現在這裡。</p>
          <button 
            onClick={() => setCurrentView({ type: 'dashboard' })}
            className="mt-6 bg-primary text-white px-4 py-2 rounded shadow hover:bg-[#1d4ed8]"
          >
            回首頁繼續流程
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {allApprovedStyles.map((item, idx) => (
            <div key={item.id || idx} className="bg-white border border-[#d1d5db] rounded-lg p-5 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                    item.type === 'basic' ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-primary/10 text-primary border border-primary/20'
                  }`}>
                    {item.typeName}
                  </span>
                  <h3 className="font-bold text-gray-800 text-lg">{item.selectedPredictionComboName || item.name || item.id}</h3>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {item.elements && item.elements.map(el => (
                    <span key={el.id || el.name} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-2 py-1 rounded">
                      {el.category}: {el.name}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="flex flex-col items-end gap-2 shrink-0 md:w-48 bg-gray-50 p-3 rounded border border-gray-100">
                <div className="text-xs text-status-good-text font-bold flex items-center gap-1">
                  {item.status}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  預估定價: <span className="font-bold text-gray-700">${item.estPrice || '---'}</span>
                </div>
                {item.type === 'basic' && item.score && (
                  <div className="text-xs text-gray-500">
                    歷史穩健度: <span className="font-bold text-gray-700">{item.score.toFixed(1)}</span>
                  </div>
                )}
                {item.type.includes('trendy') && (
                  <div className="text-xs text-gray-500">
                    契合度評分: <span className="font-bold text-primary">{item.totalScore}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
