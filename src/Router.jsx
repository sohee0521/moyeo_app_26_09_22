import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router";

// 사이드바 및 헤더 컴포넌트
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

// 페이지 컴포넌트
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import NewMeetingPage from "./pages/NewMeeting/NewMeetingPage";
import PlanPage from "./pages/Plan/PlanPage";
import GeneralVoteDetail from "./pages/Plan/components/GeneralVoteDetail";
import DateVoteDetail from "./pages/Plan/components/DateVoteDetail";
import ExpensePage from "./pages/Expense/ExpensePage";
import SecretPage from "./pages/Secret/SecretPage";
import MemoryPage from "./pages/Memory/MemoryPage";

function AppLayout() {
  const location = useLocation();

  // 모바일 사이드바 열림/닫힘 상태
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 온보딩 페이지 판별
  const isOnboardingPage = location.pathname === "/";

  // URL에서 roomId 직접 추출: 예) "/room/D92H3/new-meeting" -> "D92H3"
  const roomPathMatch = location.pathname.match(/^\/room\/([^/]+)/);
  const currentRoomId = roomPathMatch ? roomPathMatch[1] : null;

  // 페이지 이동 시 열려 있던 모바일 사이드바 닫기
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex w-screen h-screen overflow-hidden relative bg-white">
      {/* ========================================================
          1. PC 화면 전용 사이드바 (md 이상에서만 고정 노출)
         ======================================================== */}
      {!isOnboardingPage && (
        <div className="hidden md:flex shrink-0">
          <Sidebar roomIdProp={currentRoomId} />
        </div>
      )}

      {/* ========================================================
          2. 모바일 화면 전용 사이드바 드로어 (md 미만에서 메뉴 클릭 시)
         ======================================================== */}
      {!isOnboardingPage && isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* 어두운 반투명 딤(Dim) 배경 (누르면 닫힘) */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* 좌측 슬라이드 사이드바 본체 */}
          <div className="relative z-10 w-fit h-full shadow-2xl">
            <Sidebar
              roomIdProp={currentRoomId}
              onClose={() => setIsMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ========================================================
          3. 메인 콘텐츠 영역 (모바일에서는 100% 꽉 차게 변경)
         ======================================================== */}
      <main
        className={`flex-1 bg-white overflow-y-auto min-h-screen ${
          isOnboardingPage ? "p-0" : "p-4 sm:p-6 md:p-8"
        }`}
      >
        {/* 헤더에 햄버거 메뉴를 열 수 있는 함수(onMenuClick) 전달 */}
        {!isOnboardingPage && (
          <Header onMenuClick={() => setIsMobileMenuOpen(true)} />
        )}

        <div>
          <Routes>
            {/* 온보딩 */}
            <Route path="/" element={<OnboardingPage />} />

            {/* 새 모임 */}
            <Route
              path="/room/:roomId"
              element={<Navigate to="new-meeting" replace />}
            />
            <Route
              path="/room/:roomId/new-meeting"
              element={<NewMeetingPage />}
            />

            {/* 계획 및 투표 상세 */}
            <Route path="/room/:roomId/plan" element={<PlanPage />} />

            <Route
              path="/room/:roomId/vote/:voteId"
              element={<GeneralVoteDetail />}
            />

            <Route
              path="/room/:roomId/date/:voteId"
              element={<DateVoteDetail />}
            />

            {/* 정산 / 비밀기록 / 모임추억 */}
            <Route path="/room/:roomId/expense" element={<ExpensePage />} />
            <Route path="/room/:roomId/secret" element={<SecretPage />} />
            <Route path="/room/:roomId/memory" element={<MemoryPage />} />

            {/* 예외 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function Router() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
