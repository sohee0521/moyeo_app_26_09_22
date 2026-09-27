import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Plus,
  Calendar,
  MapPin,
  Utensils,
  Home,
  HelpCircle,
  ChevronRight,
  Check,
  User,
} from "lucide-react";
import { roomService } from "../../services/roomService";
import AddVoteModal from "./components/AddVoteModal";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 라벨 포맷 함수 (YYYY-MM-DD -> M/D(요일))
const formatDateLabel = (dateStr) => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayOfWeek = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}/${d}(${dayOfWeek})`;
};

// 날짜 투표 최다 가능 인원 순 그룹화 (최대 2줄)
const getTopDateVoteSummaries = (options = [], totalMembersCount = 0) => {
  const validOptions = options.filter((opt) => (opt.voters?.length || 0) > 0);
  if (validOptions.length === 0) return [];

  const groupsByCount = {};
  validOptions.forEach((opt) => {
    const count = opt.voters.length;
    if (!groupsByCount[count]) {
      groupsByCount[count] = [];
    }
    groupsByCount[count].push(opt.label);
  });

  const sortedCounts = Object.keys(groupsByCount)
    .map(Number)
    .sort((a, b) => b - a);

  return sortedCounts.slice(0, 2).map((count) => {
    const dates = groupsByCount[count];
    const isAll = totalMembersCount > 0 && count >= totalMembersCount;
    const formattedDateText = dates.sort().map(formatDateLabel).join(", ");

    return {
      count,
      isAll,
      dateText: formattedDateText,
    };
  });
};

export default function PlanPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [votes, setVotes] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // 데이터 로드
  const fetchPlanData = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const meeting = await roomService.getActiveMeeting(roomId);
      setActiveMeeting(meeting);

      if (meeting) {
        const votesData = await roomService.getVotesByMeetingId(meeting.id);
        setVotes(votesData || []);
      }
    } catch (err) {
      console.error("투표 데이터 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanData();
  }, [roomId]);

  // 투표 생성 핸들러
  const handleCreateVote = async (voteData) => {
    if (!activeMeeting) {
      alert(
        "진행 중인 모임 정보를 찾을 수 없습니다. '새 모임' 메뉴를 먼저 확인해 주세요.",
      );
      return;
    }

    try {
      await roomService.createVote({
        meetingId: activeMeeting.id,
        type: voteData.type,
        title: voteData.title,
        options: voteData.options || [],
        allowMultiple: voteData.allowMultiple ?? true,
        dateRange:
          voteData.type === "date"
            ? {
                year: voteData.year,
                startMonth: voteData.startMonth,
                endMonth: voteData.endMonth,
              }
            : null,
      });

      fetchPlanData();
    } catch (err) {
      console.error("투표 생성 실패:", err);
      alert("투표를 생성하지 못했습니다.");
    }
  };

  // 소제목 분기
  const getVoteSectionTitle = (type) => {
    switch (type) {
      case "date":
        return "언제 만날까요?";
      case "place":
        return "어딜 갈까요?";
      case "menu":
        return "뭘 먹을까요?";
      case "stay":
        return "어디서 잘까요?";
      default:
        return "무엇을 정할까요?";
    }
  };

  // 아이콘 분기
  const getVoteIcon = (type) => {
    switch (type) {
      case "date":
        return (
          <div className="w-10 h-10 rounded-xl bg-light-blue flex items-center justify-center text-main-blue shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
        );
      case "place":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-main-blue shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
        );
      case "menu":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#F0F5FF] flex items-center justify-center text-main-blue shrink-0">
            <Utensils className="w-5 h-5" />
          </div>
        );
      case "stay":
        return (
          <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] flex items-center justify-center text-purple-500 shrink-0">
            <Home className="w-5 h-5" />
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-dark-gray shrink-0">
            <HelpCircle className="w-5 h-5" />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-mid-gray">로딩 중...</p>
      </div>
    );
  }

  const totalMeetingMembersCount = activeMeeting?.members?.length || 0;

  return (
    <div className="w-full h-full flex flex-col p-8 select-none overflow-y-auto">
      {/* 1. 생성된 투표가 없을 때 */}
      {votes.length === 0 ? (
        <div className="w-full flex justify-center pt-8">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="w-full max-w-2xl h-44 rounded-2xl border-2 border-dashed border-[#B8D3FF] bg-transparent hover:bg-light-blue/20 transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
          >
            <div className="flex items-center gap-1.5 text-main-blue group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5 stroke-[2.2]" />
              <span className="font-semibold text-base">
                새로운 투표를 만들어 볼까요?
              </span>
            </div>
            <p className="text-xs text-mid-gray">
              날짜, 메뉴, 장소 등 우리 모임에 필요한 결정을 추가해보세요!
            </p>
          </button>
        </div>
      ) : (
        /* 2. 생성된 투표 카드 리스트 (2열 그리드) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl">
          {votes.map((vote) => {
            const isClosed =
              vote.status === "closed" || vote.status === "completed";

            const allVotersSet = new Set(
              vote.options?.flatMap((opt) => opt.voters || []) || [],
            );
            const participatedCount = allVotersSet.size;

            const totalVoteHits =
              vote.options?.reduce(
                (sum, opt) => sum + (opt.voters?.length || 0),
                0,
              ) || 0;

            const dateSummaries =
              vote.type === "date"
                ? getTopDateVoteSummaries(
                    vote.options,
                    totalMeetingMembersCount,
                  )
                : [];

            // 확정된 항목명 추출 (confirmed_label이 없으면 최다 득표 항목으로 fallback)
            const confirmedDisplay =
              vote.confirmed_label ||
              (vote.options && vote.options.length > 0
                ? [...vote.options].sort(
                    (a, b) => (b.voters?.length || 0) - (a.voters?.length || 0),
                  )[0]?.label
                : "");

            return (
              <div key={vote.id} className="flex flex-col gap-2.5">
                <h4 className="text-black font-bold tracking-tight">
                  {getVoteSectionTitle(vote.type)}
                </h4>

                {/* 카드 본체: 종료 시 테두리 파란색 및 클릭 비활성화 */}
                <div
                  onClick={() => {
                    if (isClosed) return; // 종료된 경우 이동 차단
                    navigate(
                      vote.type === "date"
                        ? `/room/${roomId}/date/${vote.id}`
                        : `/room/${roomId}/vote/${vote.id}`,
                    );
                  }}
                  className={`w-full min-h-[200px] rounded-2xl bg-white p-6 shadow-xs flex flex-col transition-all ${
                    isClosed
                      ? "border-2 border-main-blue cursor-default shadow-xs"
                      : "border border-light-blue hover:shadow-[0_0_20px_color-mix(in_srgb,theme(colors.main-blue)_25%,transparent)] cursor-pointer"
                  }`}
                >
                  {/* 상단 헤더 */}
                  <div className="flex items-start justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      {getVoteIcon(vote.type)}
                      <div>
                        <h4 className="text-black font-bold">{vote.title}</h4>
                        <p className="text-xs text-mid-gray mt-0.5">
                          참여 {participatedCount}/{totalMeetingMembersCount}명
                        </p>
                      </div>
                    </div>

                    {/* 종료 상태: '투표종료' + 파란색 체크 */}
                    {isClosed ? (
                      <div className="flex items-center gap-1.5 text-status-active font-bold text-xs">
                        <span>투표종료</span>
                        <Check className="w-3.5 h-3.5 stroke-[2.8]" />
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-dark-gray hover:text-black">
                        <span>투표하기</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>

                  {/* 하단 내용 영역 */}
                  <div className="flex-1 flex flex-col justify-center items-center pt-4">
                    {isClosed ? (
                      /* 🎯 [투표 확정 시 UI]: 게이지 모두 제거하고 확정 항목만 크고 볼드하게 가운데 표시 */
                      <div className="flex flex-col items-center justify-center gap-1 py-2">
                        <span className="text-lg font-bold text-black tracking-tight text-center">
                          {vote.type === "date"
                            ? formatDateLabel(confirmedDisplay)
                            : confirmedDisplay}
                        </span>
                        <span className="text-xs font-semibold text-main-blue">
                          확정
                        </span>
                      </div>
                    ) : vote.type === "date" ? (
                      /* [진행 중인 날짜 투표] */
                      <div className="w-full flex flex-col gap-2.5 text-sm">
                        {dateSummaries.length === 0 ? (
                          <div className="flex items-center justify-between text-mid-gray text-xs py-1">
                            <span>
                              {vote.date_range
                                ? `${vote.date_range.startMonth}월 ~ ${vote.date_range.endMonth}월 일정 조율`
                                : "일정 조율 중"}
                            </span>
                            <span className="text-main-blue font-semibold">
                              투표 전
                            </span>
                          </div>
                        ) : (
                          dateSummaries.map((summary, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between gap-2"
                            >
                              <span className="text-black font-medium truncate">
                                {summary.dateText}
                              </span>

                              {summary.isAll ? (
                                <div className="flex items-center gap-1 text-main-blue text-xs font-semibold shrink-0">
                                  <User className="w-3.5 h-3.5 fill-current" />
                                  <span>전원 가능</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-main-blue text-xs font-semibold shrink-0">
                                  <User className="w-3.5 h-3.5 fill-current" />
                                  <span>{summary.count}명 가능</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      /* [진행 중인 일반 투표 (게이지 바)] */
                      <div className="w-full flex flex-col gap-3 text-sm">
                        {vote.options?.slice(0, 3).map((option) => {
                          const optionVotes = option.voters?.length || 0;
                          const percent =
                            totalVoteHits > 0
                              ? Math.round((optionVotes / totalVoteHits) * 100)
                              : 0;

                          return (
                            <div
                              key={option.id}
                              className="flex items-center justify-between gap-4"
                            >
                              <span className="text-black font-medium w-24 truncate">
                                {option.label}
                              </span>
                              <div className="flex-1 h-2 rounded-full bg-[#ECEFF3] overflow-hidden">
                                <div
                                  className="h-full bg-main-blue rounded-full transition-all duration-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <span className="text-xs text-dark-gray font-medium w-8 text-right">
                                {percent}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 우측 하단 '+ 투표 추가' 점선 카드 */}
          <div className="flex flex-col gap-2.5">
            <h4 className="text-transparent select-none">&nbsp;</h4>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              style={{ border: "1.5px dashed #d0e0f2" }}
              className="w-full min-h-[200px] rounded-2xl bg-transparent hover:bg-light-blue/20 transition-all flex items-center justify-center cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-main-blue group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5 stroke-[2.2]" />
                <span className="font-semibold text-base">투표 추가</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* 투표 생성 모달 */}
      <AddVoteModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreateVote={handleCreateVote}
      />
    </div>
  );
}
