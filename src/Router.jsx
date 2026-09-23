import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router";

// 사이드바 컴포넌트
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

// 페이지 컴포넌트
import OnboardingPage from "./pages/Onboarding/OnboardingPage";
import NewMeetingPage from "./pages/NewMeeting/NewMeetingPage";
import PlanPage from "./pages/Plan/PlanPage";
import VoteDetailPage from "./pages/Plan/VoteDetailPage";
import ExpensePage from "./pages/Expense/ExpensePage";
import SecretPage from "./pages/Secret/SecretPage";
import MemoryPage from "./pages/Memory/MemoryPage";
function AppLayout() {
  const location = useLocation();

  // 온보딩 페이지 판별
  const isOnboardingPage = location.pathname === "/";

  // URL에서 roomId 직접 추출: 예) "/room/D92H3/new-meeting" -> "D92H3"
  const roomPathMatch = location.pathname.match(/^\/room\/([^/]+)/);
  const currentRoomId = roomPathMatch ? roomPathMatch[1] : null;

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Sidebar에 추출한 currentRoomId 전달 */}
      {!isOnboardingPage && <Sidebar roomIdProp={currentRoomId} />}

      <main
        style={{
          flex: 1,
          backgroundColor: "#ffffff",
          overflowY: "auto",
          padding: isOnboardingPage ? "0" : "32px",
        }}
        className="min-h-screen"
      >
        {/* 온보딩이 아닐 때 상단 공통 헤더 노출 */}
        {!isOnboardingPage && <Header />}
        <div>
          <Routes>
            {/* 온보딩  */}
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
              path="/room/:roomId/plan/vote/:pollId"
              element={<VoteDetailPage />}
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
