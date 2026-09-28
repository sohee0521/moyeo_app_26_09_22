import { useState, useEffect } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useOutletContext,
} from "react-router";
import { ChevronLeft, Menu } from "lucide-react";
import { useRoom } from "../../hooks/useRoom";
import { roomService } from "../../services/roomService";
import { supabase } from "../../services/supabaseClient";
import profileDefault from "../../img/profile-default.png";

// Header.jsx 상단: 로그인 유저 정보 조회
const getLoggedInUserInfo = async () => {
  // 2. 일반 스토리지 조회 (fallback)
  const candidateKeys = [
    "user",
    "moyeo_user",
    "room_user",
    "current_user",
    "member",
    "nickname",
    "moyeo_nickname",
    "user_nickname",
    "userName",
  ];

  for (const key of candidateKeys) {
    const raw = localStorage.getItem(key) || sessionStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.nickname) return parsed.nickname;
      if (parsed?.name) return parsed.name;
    } catch {
      if (typeof raw === "string" && raw.trim() && !raw.startsWith("{")) {
        return raw.replace(/"/g, "").trim();
      }
    }
  }

  // 3. Supabase Auth 확인
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.user_metadata?.nickname) return user.user_metadata.nickname;
    if (user?.user_metadata?.name) return user.user_metadata.name;
  } catch (e) {}

  return "미확인";
};

export default function Header({ customTitle, roomIdProp, onMenuClick }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomId: routeRoomId } = useParams();

  // Layout.jsx의 Outlet context에서 사이드바 오픈 함수 받기
  const outletCtx = useOutletContext() || {};
  const handleOpenMenu = onMenuClick || outletCtx.openMobileMenu;

  // Routes 외부 배치 대비 URL 파싱 fallback
  const pathname = location.pathname;
  const match = pathname.match(/^\/room\/([^/]+)/);
  const currentRoomCode =
    roomIdProp || routeRoomId || (match ? match[1] : null);

  const { room } = useRoom(currentRoomCode);

  const [roomMembers, setRoomMembers] = useState([]);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [currentLoginUser, setCurrentLoginUser] = useState("확인 중...");

  // 세부 상세 페이지 판별
  const isDetailPage =
    pathname.includes("/vote/") ||
    pathname.includes("/detail") ||
    pathname.includes("/date/");

  // 전체 방 멤버 기준 메뉴 판별
  const isOverviewMenu =
    pathname.includes("/new-meeting") || pathname.includes("/memory");

  // Supabase 데이터 및 현재 접속자 조회
  const fetchHeaderData = async () => {
    if (!currentRoomCode) return;
    try {
      const [members, meeting, loggedInUser] = await Promise.all([
        roomService.getRoomMembers(currentRoomCode),
        roomService.getActiveMeeting(currentRoomCode),
        getLoggedInUserInfo(),
      ]);
      setRoomMembers(members || []);
      setActiveMeeting(meeting);
      setCurrentLoginUser(loggedInUser);
    } catch (err) {
      console.error("헤더 데이터 조회 실패:", err);
    }
  };

  useEffect(() => {
    fetchHeaderData();
  }, [currentRoomCode, pathname]);

  // 페이지 타이틀 결정
  const getPageTitle = () => {
    if (customTitle) return customTitle;
    if (pathname.includes("/new-meeting")) return "새 모임";
    if (pathname.includes("/plan"))
      return activeMeeting?.title || "함께 정하기";
    if (pathname.includes("/expense")) return "정산하기";
    if (pathname.includes("/secret")) return "비밀기록";
    if (pathname.includes("/memory")) return "모임 추억";
    return room?.room_name || "MOYEO";
  };

  // 진행 상태 토글 핸들러 (계획중 <-> 모임중)
  const handleToggleStatus = async () => {
    if (!activeMeeting || isUpdatingStatus) return;
    const nextStatus =
      activeMeeting.status === "planning" ? "active" : "planning";

    try {
      setIsUpdatingStatus(true);
      await roomService.updateMeetingStatus(activeMeeting.id, nextStatus);
      setActiveMeeting((prev) => ({ ...prev, status: nextStatus }));
    } catch (err) {
      console.error("모임 상태 변경 실패:", err);
      alert("상태를 변경하지 못했습니다.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // 페이지 성격에 따른 멤버 분기
  const displayMembers = isOverviewMenu
    ? roomMembers
    : roomMembers.filter((m) => activeMeeting?.members?.includes(m.nickname));

  const totalCount = displayMembers.length;
  const visibleMembers = displayMembers.slice(0, 4);
  const extraCount = totalCount - visibleMembers.length;

  const currentStatus = activeMeeting?.status || "planning";
  const isPlanning = currentStatus === "planning";

  return (
    <header className="w-full flex items-center justify-between border-[#F0F0F0] bg-transparent select-none">
      {/* [좌측 영역] */}
      <div className="flex items-center gap-2">
        {/* 1. 세부 상세 페이지면 '뒤로가기' 버튼 */}
        {isDetailPage ? (
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-1 -ml-1 text-black hover:opacity-70 transition-opacity cursor-pointer"
            title="뒤로가기"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
        ) : (
          /* 2. 일반 메인 페이지일 때 모바일(md 미만)에서만 '햄버거 메뉴' 버튼 표시 */
          <button
            type="button"
            onClick={handleOpenMenu}
            className="p-1 -ml-1 text-black md:hidden hover:opacity-70 transition-opacity cursor-pointer"
            title="메뉴 열기"
          >
            <Menu className="w-6 h-6 stroke-[2.2]" />
          </button>
        )}

        {/* 타이틀: 모바일 기본 화면에서는 사진처럼 숨기고 본문 h1/h2로 보여주고, PC나 상세페이지에서는 헤더 타이틀 표시 */}
        <h2
          className={`text-black font-bold tracking-tight ${
            !isDetailPage ? "hidden md:block" : "block"
          }`}
        >
          {getPageTitle()}
        </h2>
      </div>

      {/* [우측 영역] */}
      <div className="flex items-center gap-3">
        {/* 인원 라벨 */}
        <p className="text-dark-gray font-normal text-sm">
          {isOverviewMenu ? `${totalCount}명의 멤버` : "참가 멤버"}
        </p>

        {/* 겹쳐지는 아바타 스택 */}
        <div className="flex items-center -space-x-2">
          {visibleMembers.map((member, index) => (
            <div
              key={member.id || index}
              className="w-8 h-8 rounded-full border-2 border-white bg-light-blue overflow-hidden flex items-center justify-center shrink-0 shadow-xs"
            >
              {member.avatar_url && member.avatar_url.startsWith("http") ? (
                <img
                  src={member.avatar_url}
                  alt={member.nickname || "멤버"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              ) : (
                <img
                  src={profileDefault}
                  alt="기본 프로필"
                  className="w-[18px] object-cover"
                />
              )}
            </div>
          ))}

          {/* 타입 1: 4명 초과 시 +N 뱃지 */}
          {isOverviewMenu && extraCount > 0 && (
            <div className="w-8 h-8 rounded-full border-2 border-white bg-light-blue flex items-center justify-center shrink-0 ml-3">
              <p className="text-main-blue text-[14px] leading-none">
                +{extraCount}
              </p>
            </div>
          )}
        </div>

        {/* 타입 2, 3: 진행 상태 뱃지 (클릭 시 토글) */}
        {!isOverviewMenu && activeMeeting && (
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={isUpdatingStatus}
            className="flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
            title="클릭하여 상태 변경"
          >
            <span
              className={`w-2.5 h-2.5 rounded-full inline-block ${
                isPlanning ? "bg-[#F59E0B]" : "bg-[#10B981]"
              }`}
            />
            <p className="text-black font-medium text-sm">
              {isPlanning ? "계획중" : "모임중"}
            </p>
          </button>
        )}
      </div>
    </header>
  );
}
