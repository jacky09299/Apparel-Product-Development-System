import React from 'react';

export function Step2SetupEvent() {
  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm text-sm p-6 min-h-[400px]">
      <h2 className="text-lg font-bold text-content-main mb-4 border-b pb-2">建立群眾預測活動 (Step 2)</h2>
      <div className="text-[#4b5563] mb-6">
        <p>此區塊供趨勢分析師輸入投票類別、選項和素材圖片，並設定活動開始與結束時間。</p>
      </div>
      <div className="border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center text-[#6b7280]">
        [表單開發中...]
      </div>
    </div>
  );
}

export function Step3Dashboard() {
  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm text-sm p-6 min-h-[400px]">
      <h2 className="text-lg font-bold text-content-main mb-4 border-b pb-2">商品企劃最終決定開發計劃 (Step 3)</h2>
      <div className="text-[#4b5563] mb-6">
        <p>系統將顯示預估 ROI、預測銷量、信心值等分析數據清單，供企劃團隊勾選核准開發項目。</p>
      </div>
      <div className="border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center text-[#6b7280]">
        [數據報表與核准列表開發中...]
      </div>
    </div>
  );
}

export function Step4Designer() {
  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm text-sm p-6 min-h-[400px]">
      <h2 className="text-lg font-bold text-content-main mb-4 border-b pb-2">設計師團隊設計服裝 (Step 4)</h2>
      <div className="text-[#4b5563] mb-6">
        <p>顯示最終核准的開發清單與系統提供的「元素佈局推薦」。可上傳草圖與服裝設計圖至系統建檔。</p>
      </div>
      <div className="border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center text-[#6b7280]">
        [設計管理介面開發中...]
      </div>
    </div>
  );
}

export function Step5QA() {
  return (
    <div className="bg-white border border-[#d1d5db] shadow-sm text-sm p-6 min-h-[400px]">
      <h2 className="text-lg font-bold text-content-main mb-4 border-b pb-2">優化系統 (Step 5)</h2>
      <div className="text-[#4b5563] mb-6">
        <p>品管與銷售回饋模組。顯示歷史品管分析與銷售落差，提供要因選項推薦以優化預測模型。</p>
      </div>
      <div className="border border-[#e5e7eb] bg-[#f9fafb] p-4 text-center text-[#6b7280]">
        [品管回饋表單開發中...]
      </div>
    </div>
  );
}
