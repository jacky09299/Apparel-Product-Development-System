import React from 'react';
import { LayoutDashboard, CheckSquare, BarChart3, Palette, Settings } from 'lucide-react';

const steps = [
  { id: 1, name: '初步決定設計方向', icon: LayoutDashboard },
  { id: 2, name: '建立群眾預測活動', icon: CheckSquare },
  { id: 3, name: '商品企劃最終決定開發計劃', icon: BarChart3 },
  { id: 4, name: '設計師團隊設計服裝', icon: Palette },
  { id: 5, name: '優化系統', icon: Settings },
];

export function Sidebar({ currentStep, onStepChange, currentRole }) {
  return (
    <div className="w-56 bg-[#f3f4f6] text-[#374151] h-screen flex flex-col border-r border-[#d1d5db]">
      <div className="p-4 border-b border-[#d1d5db] bg-white">
        <h1 className="text-base font-bold text-[#111827]">
          商品開發決策系統
        </h1>
        <p className="text-xs text-[#6b7280] mt-1">內部管理端 v1.0</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        <ul className="space-y-1 px-2">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            return (
              <li key={step.id}>
                <button
                  onClick={() => onStepChange(step.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition-none ${
                    isActive
                      ? 'bg-[#e5e7eb] text-[#111827] font-semibold'
                      : 'text-[#4b5563] hover:bg-[#f9fafb]'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#3b82f6]' : 'text-[#9ca3af]'} />
                  <div className="text-left">
                    <span>{step.id}. {step.name}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="p-4 border-t border-[#d1d5db] bg-white">
        <div className="flex items-center gap-2">
          <div className="text-sm text-[#374151]">
            <p className="font-medium">使用者身分:</p>
            <p className="text-[#2563eb] font-bold">{currentRole}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
