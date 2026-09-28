// src/components/layout/Layout.jsx
import { useState } from "react";
import { Outlet } from "react-router";
import Sidebar from "./Sidebar"; // 경로 확인해주세요

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex w-full min-h-screen bg-white relative overflow-x-hidden">
      {/* ========================================================
          1. PC 화면 전용 사이드바: 
             - 모바일(`md` 미만, 즉 768px 미만)에서는 아예 숨김(hidden)!
             - 태블릿/PC(md 이상)에서만 좌측에 고정 노출(md:flex)
         ======================================================== */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* ========================================================
          2. 모바일 전용 슬라이드 사이드바 (Drawer):
             - 평소에는 숨겨져 있다가 햄버거 버튼 누르면(isMobileMenuOpen) 촥 나옴
         ======================================================== */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* 어두운 반투명 배경 (누르면 닫힘) */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* 슬라이드로 튀어나오는 사이드바 */}
          <div className="relative z-10 w-fit h-full shadow-2xl">
            <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ========================================================
          3. 메인 콘텐츠 영역 (모바일에서는 화면 100%를 차지하게 됨)
         ======================================================== */}
      <main className="flex-1 flex flex-col min-w-0 w-full px-4 sm:px-6 md:px-8 py-4 overflow-y-auto">
        <Outlet context={{ openMobileMenu: () => setIsMobileMenuOpen(true) }} />
      </main>
    </div>
  );
}
