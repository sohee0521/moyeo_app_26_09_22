import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  Navigate,
} from "react-router";

// 사이드바 컴포넌트
import Sidebar from "./components/layout/Sidebar";

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

  // 온보딩 페이지에서 사이드바를 숨김
  const isOnboardingPage = location.pathname === "/";

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {!isOnboardingPage && <Sidebar />}

      <main
        style={{
          flex: 1,
          backgroundColor: "#F8FAFC",
          overflowY: "auto",
          padding: isOnboardingPage ? "0" : "32px",
        }}
      >
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
