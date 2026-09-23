import { useState } from "react";
import { NavLink, useParams, useNavigate } from "react-router";
import {
  CalendarPlus,
  FileText,
  Banknote,
  LockKeyhole,
  Archive,
  Copy,
  Check,
  LogOut,
  AlertTriangle,
} from "lucide-react";
import Button from "../common/Button";
import { useRoom } from "../../hooks/useRoom";

export default function Sidebar({ roomIdProp }) {
  const { roomId: routeRoomId } = useParams();
  const navigate = useNavigate();

  // Routes 외부에서 렌더링되더라도 props로 전달된 ID를 최우선 인식
  const activeRoomId = roomIdProp || routeRoomId;
  const { room, loading } = useRoom(activeRoomId);

  const [isCopied, setIsCopied] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);

  // DB 조회 데이터 우선 바인딩
  const currentRoomCode = room?.room_code || activeRoomId;

  // 라우터 경로 매핑
  const menuItems = [
    {
      name: "새 모임",
      path: `/room/${currentRoomCode}/new-meeting`,
      icon: CalendarPlus,
      isSub: false,
    },
    {
      name: "계획",
      path: `/room/${currentRoomCode}/plan`,
      icon: FileText,
      isSub: true,
    },
    {
      name: "정산",
      path: `/room/${currentRoomCode}/expense`,
      icon: Banknote,
      isSub: true,
    },
    {
      name: "비밀기록",
      path: `/room/${currentRoomCode}/secret`,
      icon: LockKeyhole,
      isSub: true,
    },
    {
      name: "모임 추억",
      path: `/room/${currentRoomCode}/memory`,
      icon: Archive,
      isSub: false,
    },
  ];

  // 방 코드 복사 핸들러
  const handleCopyCode = async () => {
    if (!currentRoomCode) return;
    try {
      await navigator.clipboard.writeText(currentRoomCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("방 코드 복사 실패:", err);
    }
  };

  // 방 나가기 확인 핸들러
  const handleConfirmExit = () => {
    setIsExitModalOpen(false);
    navigate("/");
  };

  return (
    <>
      <aside className="relative flex h-screen w-64 flex-col justify-between border-r border-[#EFEFEF] bg-[#F8FAFC] px-7 py-8 select-none shrink-0">
        {/* 상단 로고 및 방 이름 */}
        <div>
          <h6 className="text-main-blue tracking-[0.6em] uppercase block mb-6">
            MOYEO
          </h6>

          {/* Supabase DB에서 조회된 실제 방 이름 */}
          <h2 className="text-black mb-9 font-bold">
            {loading ? "불러오는 중..." : room?.room_name || "모임방"}
          </h2>

          {/* 네비게이션 메뉴 (현재 페이지: text-main-blue, 나머지: text-dark-gray) */}
          <nav className="flex flex-col gap-5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 transition-colors duration-150 ${
                      item.isSub ? "pl-5" : ""
                    } ${
                      isActive
                        ? "!text-main-blue !font-semibold"
                        : "!text-dark-gray hover:!text-black "
                    }`
                  }
                >
                  <Icon className="h-5 w-5 stroke-[1.8] shrink-0" />
                  <h6>{item.name}</h6>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* 하단: 방 코드 & 나가기 아이콘 */}
        <div className="flex items-center justify-between border-t border-[#F5F5F5] pt-5">
          <div className="flex items-center gap-1.5 text-dark-gray">
            <p className="text-[14px]">방 코드</p>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-2 !text-main-blue font-semibold hover:opacity-80 transition-opacity"
              title="방 코드 복사"
            >
              <h6>{currentRoomCode || "------"}</h6>
              {isCopied ? (
                <Check className="h-4 w-4 text-status-active" />
              ) : (
                <Copy size={15} />
              )}
            </button>
          </div>

          <button
            onClick={() => setIsExitModalOpen(true)}
            className="text-dark-gray  transition-colors p-1"
            title="방 나가기"
          >
            <LogOut size={20} className="text-dark-gray hover:text-black" />
          </button>
        </div>
      </aside>

      {/* 방 나가기 확인 모달 */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-[320px] rounded-2xl bg-white p-6 shadow-xl text-center animate-fade-in-up">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-light-blue text-main-blue">
              <AlertTriangle className="h-6 w-6 stroke-[2]" />
            </div>

            <h5 className="text-black mb-1 font-bold">방을 나가시겠어요?</h5>
            <p className="text-dark-gray leading-relaxed mb-6">
              방 코드를 알고 계시면
              <br />
              언제든 다시 들어올 수 있어요!
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsExitModalOpen(false)}
                className="w-full py-2.5"
              >
                취소
              </Button>
              <Button
                variant="dark"
                onClick={handleConfirmExit}
                className="w-full py-2.5"
              >
                나가기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
