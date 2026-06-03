import React from 'react';

export function TrendyStyleDecision() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center bg-white border border-[#d1d5db] rounded-lg shadow-sm p-8 text-center h-full">
      <div className="w-16 h-16 bg-[#eff6ff] rounded-full flex items-center justify-center mb-4 text-3xl">
        ✨
      </div>
      <h2 className="text-xl font-bold text-[#111827] mb-2">流行款決策系統</h2>
      <p className="text-[#6b7280] max-w-md">
        在這個階段，我們將針對具有高流行潛力但歷史數據較少的款式進行 A/B Testing 變數設定，
        透過群眾預測活動來確認市場接受度。
      </p>
      <div className="mt-8 px-4 py-2 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-sm font-medium">
        模組建置中...
      </div>
    </div>
  );
}
