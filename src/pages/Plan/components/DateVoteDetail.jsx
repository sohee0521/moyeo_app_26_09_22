import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, User, X } from "lucide-react";
import Button from "../../../components/common/Button";
import { supabase } from "../../../services/supabaseClient";
import { roomService } from "../../../services/roomService";
import CloseVoteModal from "./CloseVoteModal"; // ★ 생성하신 모달 import

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 1. 현재 접속자 닉네임 감지 헬퍼
const getActiveNickname = (roomId, propNickname) => {
  if (propNickname) return propNickname;

  const sessionNick = sessionStorage.getItem("current_nickname");
  if (sessionNick) return sessionNick;

  const currentActive = localStorage.getItem("current_user_nickname");
  if (currentActive) return currentActive;

  if (roomId) {
    const roomUser =
      localStorage.getItem(`room_${roomId}_user`) ||
      localStorage.getItem(`room_${roomId.toUpperCase()}_user`) ||
      localStorage.getItem(`room_${roomId.toLowerCase()}_user`);
    if (roomUser) return roomUser;
  }

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("room_") && key.endsWith("_user")) {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
  }

  return "";
};

// 2. 날짜 포맷 헬퍼
const formatDate = (y, m, d) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

const formatLabel = (dateStr) => {
  if (!dateStr?.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${m}/${d} (${WEEKDAYS[new Date(y, m - 1, d).getDay()]})`;
};

export default function DateVoteDetail({ myNickname }) {
  const { roomId, voteId } = useParams();
  const navigate = useNavigate();

  const [currentNickname, setCurrentNickname] = useState(() =>
    getActiveNickname(roomId, myNickname),
  );

  const [poll, setPoll] = useState(null);
  const [totalMembers, setTotalMembers] = useState(0);
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9);
  const [selectedDates, setSelectedDates] = useState([]);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 👑 방장 권한 및 종료 모달 제어 state
  const [isHost, setIsHost] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const minMonth = Number(poll?.date_range?.startMonth) || 1;
  const maxMonth = Number(poll?.date_range?.endMonth) || 12;

  // 1. 방장 권한 판별
  useEffect(() => {
    const checkHost = async () => {
      // 1순위: 스토리지에 저장된 role 확인
      const localRole =
        localStorage.getItem(`room_${roomId}_role`) ||
        localStorage.getItem(`room_${roomId?.toUpperCase()}_role`);

      if (localRole === "host") {
        setIsHost(true);
        return;
      }

      // 2순위: Supabase room_members에서 현재 닉네임의 role 확인
      if (currentNickname && roomId) {
        try {
          const { data } = await supabase
            .from("room_members")
            .select("role")
            .eq("nickname", currentNickname)
            .eq("room_code", roomId.toUpperCase())
            .maybeSingle();

          if (data?.role === "host") {
            setIsHost(true);
          }
        } catch (e) {
          console.error("방장 확인 실패:", e);
        }
      }
    };

    checkHost();
  }, [roomId, currentNickname]);

  // 2. 투표 데이터 조회
  const fetchPollAndOptions = async (targetNickname) => {
    try {
      const [{ data: pollData }, { data: optionsData }] = await Promise.all([
        supabase.from("polls").select("*").eq("id", voteId).single(),
        supabase.from("poll_options").select("*").eq("poll_id", voteId),
      ]);

      if (pollData) {
        setPoll(pollData);
        if (pollData.date_range?.year)
          setCurrentYear(Number(pollData.date_range.year));
        if (pollData.date_range?.startMonth)
          setCurrentMonth(Number(pollData.date_range.startMonth));
      }

      const validOptions = optionsData || [];
      setOptions(validOptions);

      // 내가 투표한 날짜만 선택 상태로 설정
      const activeName = targetNickname || currentNickname;
      if (activeName) {
        const mySelected = validOptions
          .filter(
            (opt) =>
              Array.isArray(opt.voters) && opt.voters.includes(activeName),
          )
          .map((opt) => opt.label);
        setSelectedDates(mySelected);
      }
    } catch (err) {
      console.error("데이터 로드 오류:", err);
    }
  };

  // 3. 초기화
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const nick = getActiveNickname(roomId, myNickname);
        if (nick) setCurrentNickname(nick);

        if (roomId) {
          const meeting = await roomService.getActiveMeeting(roomId);
          if (meeting?.members) {
            setTotalMembers(meeting.members.length);
          }
        }

        await fetchPollAndOptions(nick);
      } catch (err) {
        console.error("초기화 실패:", err);
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [roomId, voteId, myNickname]);

  // 4. Supabase Realtime 동기화
  useEffect(() => {
    if (!voteId) return;

    const channel = supabase
      .channel(`poll_options_sync_${voteId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "poll_options",
          filter: `poll_id=eq.${voteId}`,
        },
        () => {
          supabase
            .from("poll_options")
            .select("*")
            .eq("poll_id", voteId)
            .then(({ data }) => {
              if (data) setOptions(data);
            });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [voteId]);

  // 달력 날짜 계산
  const days = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay();
    const lastDate = new Date(currentYear, currentMonth, 0).getDate();
    const prevLastDate = new Date(currentYear, currentMonth - 1, 0).getDate();

    const result = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      result.push({
        date: prevLastDate - i,
        month: currentMonth - 1,
        isCurrent: false,
      });
    }
    for (let i = 1; i <= lastDate; i++) {
      result.push({ date: i, month: currentMonth, isCurrent: true });
    }
    const remaining = (result.length > 35 ? 42 : 35) - result.length;
    for (let i = 1; i <= remaining; i++) {
      result.push({ date: i, month: currentMonth + 1, isCurrent: false });
    }
    return result;
  }, [currentYear, currentMonth]);

  const handleToggle = ({ month, date, isCurrent }) => {
    if (!isCurrent || month < minMonth || month > maxMonth) return;
    if (poll?.status === "closed") {
      alert("이미 종료된 투표입니다.");
      return;
    }
    const dateStr = formatDate(currentYear, month, date);
    setSelectedDates((prev) =>
      prev.includes(dateStr)
        ? prev.filter((d) => d !== dateStr)
        : [...prev, dateStr],
    );
  };

  // 5. 투표 저장 (신규 행은 id 생략)
  const handleSave = async () => {
    if (poll?.status === "closed") {
      alert("이미 종료된 투표입니다.");
      return;
    }

    if (!currentNickname) {
      alert("로그인된 사용자 정보를 확인할 수 없습니다. 다시 입장해주세요.");
      return;
    }

    try {
      const allLabels = Array.from(
        new Set([...options.map((o) => o.label), ...selectedDates]),
      );

      const updates = [];
      const inserts = [];

      for (const label of allLabels) {
        const exist = options.find((o) => o.label === label);
        const isSelected = selectedDates.includes(label);
        let voters = exist?.voters ? [...exist.voters] : [];

        if (isSelected && !voters.includes(currentNickname)) {
          voters.push(currentNickname);
        }
        if (!isSelected && voters.includes(currentNickname)) {
          voters = voters.filter((n) => n !== currentNickname);
        }

        if (exist) {
          updates.push({
            id: exist.id,
            poll_id: voteId,
            label,
            voters,
          });
        } else if (isSelected && voters.length > 0) {
          inserts.push({
            poll_id: voteId,
            label,
            voters,
          });
        }
      }

      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from("poll_options")
          .upsert(updates);
        if (updateError) throw updateError;
      }

      if (inserts.length > 0) {
        const { error: insertError } = await supabase
          .from("poll_options")
          .insert(inserts);
        if (insertError) throw insertError;
      }

      alert(`[${currentNickname}]님의 가능한 날짜가 저장되었습니다!`);
      await fetchPollAndOptions(currentNickname);
    } catch (err) {
      console.error("저장 오류:", err);
      alert("투표 저장 중 오류가 발생했습니다.");
    }
  };

  const rankedOptions = useMemo(
    () =>
      [...options]
        .filter((o) => o.voters?.length > 0)
        .sort((a, b) => b.voters.length - a.voters.length),
    [options],
  );

  const participantCount = useMemo(
    () => new Set(options.flatMap((o) => o.voters || [])).size,
    [options],
  );

  if (loading) return <div className="p-8 text-mid-gray">로딩 중...</div>;

  const canPrev = currentMonth > minMonth;
  const canNext = currentMonth < maxMonth;
  const isClosed = poll?.status === "closed";

  return (
    <div className="w-full h-full flex flex-col p-8 select-none overflow-y-auto">
      {/* 상단 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/room/${roomId}/plan`)}
            className="p-1 -ml-1 text-black hover:opacity-70 cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-black font-bold text-xl">언제 만날까요?</h3>
            {isClosed && (
              <span className="text-xs bg-[#ECEFF3] text-dark-gray px-2 py-0.5 rounded-md font-medium">
                종료됨
              </span>
            )}
          </div>
        </div>

        {/* 우측 영역: 접속자 표시 및 [방장 전용 투표종료 버튼] */}
        <div className="flex items-center gap-3">
          <div className="text-xs text-dark-gray font-medium">
            참여자:{" "}
            <span className="font-bold text-main-blue">
              {currentNickname || "확인 불가"}
            </span>
          </div>

          {/* 👑 방장에게만 보이는 [투표종료] 버튼 */}
          {isHost && !isClosed && (
            <button
              type="button"
              onClick={() => setIsCloseModalOpen(true)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#FF6B6B] text-[#FF6B6B] hover:bg-[#FFF5F5] transition-colors cursor-pointer"
            >
              투표종료
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-5xl items-start">
        {/* 달력 영역 */}
        <div className="flex-1 w-full flex flex-col gap-3">
          <div className="rounded-xl bg-[#EFF6FF] px-4 py-3 text-main-blue text-sm font-semibold flex justify-between items-center">
            <span>
              📅{" "}
              {minMonth === maxMonth
                ? `${minMonth}월`
                : `${minMonth}월 ~ ${maxMonth}월`}{" "}
              중으로 가능한 날짜를 선택해주세요
            </span>
            {isClosed && (
              <span className="text-xs text-main-blue font-bold">
                확정된 날짜: {formatLabel(poll?.confirmed_label)}
              </span>
            )}
          </div>

          <div className="rounded-2xl border border-light-blue bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={() => canPrev && setCurrentMonth((m) => m - 1)}
                disabled={!canPrev}
                className={`p-1 ${canPrev ? "hover:text-black cursor-pointer" : "opacity-20 cursor-not-allowed"}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h4 className="font-bold text-base">
                {currentYear}년 {currentMonth}월
              </h4>
              <button
                type="button"
                onClick={() => canNext && setCurrentMonth((m) => m + 1)}
                disabled={!canNext}
                className={`p-1 ${canNext ? "hover:text-black cursor-pointer" : "opacity-20 cursor-not-allowed"}`}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 text-center text-xs font-semibold text-dark-gray pb-2 border-b border-[#ECEFF3]">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 text-center text-xs border-b border-l border-[#F0F2F5]">
              {days.map((item, idx) => {
                const isClickable =
                  !isClosed &&
                  item.isCurrent &&
                  item.month >= minMonth &&
                  item.month <= maxMonth;
                const dateKey = formatDate(currentYear, item.month, item.date);
                const isSelected = selectedDates.includes(dateKey);
                const isConfirmedDate =
                  isClosed && poll?.confirmed_label === dateKey;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleToggle(item)}
                    disabled={!isClickable && !isConfirmedDate}
                    className={`relative h-14 border-r border-t border-[#F0F2F5] p-2 flex flex-col items-center justify-between transition-all ${
                      isConfirmedDate
                        ? "bg-main-blue text-white font-bold"
                        : !isClickable
                          ? "text-[#C4C8D4] bg-[#FAFAFA]/70 cursor-not-allowed pointer-events-none"
                          : isSelected
                            ? "bg-[#EAF2FF] text-main-blue font-bold cursor-pointer"
                            : "bg-white text-black hover:bg-black/5 cursor-pointer"
                    }`}
                  >
                    <span
                      className={
                        !isClickable && !isConfirmedDate ? "text-[#C4C8D4]" : ""
                      }
                    >
                      {item.date}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full mb-1 ${isClickable && isSelected ? "bg-main-blue" : ""}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 선택 현황 사이드바 */}
        <div className="w-full lg:w-80 rounded-2xl border border-light-blue bg-white p-6 shadow-xs flex flex-col gap-4">
          <div className="border-b border-[#F5F6F8] pb-3">
            <h5 className="font-bold text-black mb-0.5">선택 현황</h5>
            <p className="text-xs text-mid-gray">
              참여 {participantCount}/{totalMembers}명
            </p>
          </div>

          <div className="flex flex-col gap-3 text-xs">
            {rankedOptions.length === 0 ? (
              <p className="text-mid-gray py-4 text-center">
                아직 선택된 날짜가 없습니다.
              </p>
            ) : (
              rankedOptions.map((opt) => (
                <div key={opt.id} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-medium ${poll?.confirmed_label === opt.label ? "text-main-blue font-bold" : "text-black"}`}
                    >
                      {formatLabel(opt.label)}{" "}
                      {poll?.confirmed_label === opt.label && "(확정)"}
                    </span>
                    <div className="flex items-center gap-1 text-main-blue font-semibold">
                      <User className="w-3.5 h-3.5 fill-current" />
                      <span>
                        {totalMembers > 0 && opt.voters.length >= totalMembers
                          ? "전원"
                          : `${opt.voters.length}명`}
                      </span>
                    </div>
                  </div>
                  <span className="text-mid-gray text-[11px] truncate">
                    {opt.voters.join(", ")}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 하단 바 (종료되지 않았을 때만 노출) */}
      {!isClosed && (
        <div className="w-full max-w-5xl mt-8 pt-6 border-t border-[#F0F2F5] flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-bold text-sm text-black">선택한 날짜</span>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedDates.length === 0 ? (
                <span className="text-xs text-mid-gray">
                  달력에서 날짜를 선택해주세요.
                </span>
              ) : (
                selectedDates.map((dateStr) => (
                  <div
                    key={dateStr}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-main-blue text-main-blue bg-white text-xs font-medium"
                  >
                    <span>{formatLabel(dateStr)}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedDates((prev) =>
                          prev.filter((d) => d !== dateStr),
                        )
                      }
                      className="hover:opacity-70 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            className="px-7 py-2.5"
          >
            저장하기
          </Button>
        </div>
      )}

      {/* 🟢 생성해둔 CloseVoteModal 연결 */}
      <CloseVoteModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        poll={poll}
        options={options}
        totalMembers={totalMembers}
        onConfirmed={() => {
          navigate(`/room/${roomId}/plan`);
        }}
      />
    </div>
  );
}
