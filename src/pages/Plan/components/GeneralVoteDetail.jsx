import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ChevronLeft, Plus, Check, X } from "lucide-react";
import Button from "../../../components/common/Button";
import { supabase } from "../../../services/supabaseClient";
import CloseVoteModal from "./CloseVoteModal"; // ★ 종료 모달 import

// 현재 접속자 닉네임을 확실하게 가져오는 헬퍼 함수
const getActiveNickname = (roomId, propNickname) => {
  if (propNickname && propNickname !== "나") return propNickname;

  // 1순위: JoinRoomModal에서 설정된 세션 닉네임
  const sessionNick = sessionStorage.getItem("current_nickname");
  if (sessionNick) return sessionNick;

  const currentActive = localStorage.getItem("current_user_nickname");
  if (currentActive) return currentActive;

  // 2순위: 방 코드 기반 스토리지 확인
  if (roomId) {
    const roomUser =
      localStorage.getItem(`room_${roomId}_user`) ||
      localStorage.getItem(`room_${roomId.toUpperCase()}_user`) ||
      localStorage.getItem(`room_${roomId.toLowerCase()}_user`);
    if (roomUser) return roomUser;
  }

  // 3순위: 브라우저 내 다른 room_*_user 패턴 전수 조사
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("room_") && key.endsWith("_user")) {
      const val = localStorage.getItem(key);
      if (val) return val;
    }
  }

  return "";
};

export default function GeneralVoteDetail({ myNickname }) {
  const { roomId, voteId } = useParams();
  const navigate = useNavigate();

  // 현재 접속 유저 확정
  const [currentNickname, setCurrentNickname] = useState(() =>
    getActiveNickname(roomId, myNickname),
  );

  const [poll, setPoll] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOptionIds, setSelectedOptionIds] = useState([]);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const [newOptionText, setNewOptionText] = useState("");
  const [loading, setLoading] = useState(true);

  // 👑 방장 권한 및 종료 모달 상태
  const [isHost, setIsHost] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  // 1. 방장 권한 확인
  useEffect(() => {
    const checkHostRole = async () => {
      // 1순위: 로컬 스토리지에 저장된 role 확인
      const storedRole =
        localStorage.getItem(`room_${roomId}_role`) ||
        localStorage.getItem(`room_${roomId?.toUpperCase()}_role`);

      if (storedRole === "host") {
        setIsHost(true);
        return;
      }

      // 2순위: Supabase room_members에서 현재 닉네임 role 조회
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

    checkHostRole();
  }, [roomId, currentNickname]);

  // 2. 데이터 로드 (내 투표 상태 반영)
  const fetchPollDetail = async (userNick) => {
    try {
      setLoading(true);
      const activeUser = userNick || currentNickname;

      const [
        { data: pollData, error: pollError },
        { data: optionsData, error: optError },
      ] = await Promise.all([
        supabase.from("polls").select("*").eq("id", voteId).single(),
        supabase
          .from("poll_options")
          .select("*")
          .eq("poll_id", voteId)
          .order("created_at", { ascending: true }),
      ]);

      if (pollError) throw pollError;
      if (optError) throw optError;

      setPoll(pollData);
      const validOptions = optionsData || [];
      setOptions(validOptions);

      // 내가 투표한 항목만 체크 상태로 초기화
      if (activeUser) {
        const mySelected = validOptions
          .filter(
            (opt) =>
              Array.isArray(opt.voters) && opt.voters.includes(activeUser),
          )
          .map((opt) => opt.id);
        setSelectedOptionIds(mySelected);
      }
    } catch (err) {
      console.error("투표 상세 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const nick = getActiveNickname(roomId, myNickname);
    if (nick) setCurrentNickname(nick);
    fetchPollDetail(nick);
  }, [roomId, voteId, myNickname]);

  // 3. Supabase Realtime 실시간 동기화
  useEffect(() => {
    if (!voteId) return;

    const channel = supabase
      .channel(`general_poll_sync_${voteId}`)
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
            .order("created_at", { ascending: true })
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

  // 옵션 선택 토글
  const handleToggleOption = (id) => {
    if (poll?.status === "closed") {
      alert("이미 종료된 투표입니다.");
      return;
    }

    if (poll?.allow_multiple) {
      setSelectedOptionIds((prev) =>
        prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
      );
    } else {
      setSelectedOptionIds((prev) => (prev.includes(id) ? [] : [id]));
    }
  };

  // 새로운 선택 항목 추가 처리
  const handleAddNewOption = async (e) => {
    e.preventDefault();
    if (poll?.status === "closed") {
      alert("종료된 투표에는 항목을 추가할 수 없습니다.");
      return;
    }
    if (!newOptionText.trim()) return;

    try {
      const { error } = await supabase.from("poll_options").insert([
        {
          poll_id: voteId,
          label: newOptionText.trim(),
          voters: [],
        },
      ]);
      if (error) throw error;
      setNewOptionText("");
      setIsAddingOption(false);
      fetchPollDetail(currentNickname);
    } catch (err) {
      console.error("항목 추가 실패:", err);
      alert("항목을 추가하지 못했습니다.");
    }
  };

  // 4. 투표 저장
  const handleSubmitVote = async () => {
    if (poll?.status === "closed") {
      alert("이미 종료된 투표입니다.");
      return;
    }

    if (!currentNickname) {
      alert("로그인된 사용자 정보를 확인할 수 없습니다. 다시 입장해주세요.");
      return;
    }

    try {
      for (const opt of options) {
        const isSelected = selectedOptionIds.includes(opt.id);
        const currentVoters = Array.isArray(opt.voters) ? opt.voters : [];
        const hasVoted = currentVoters.includes(currentNickname);

        let updatedVoters = [...currentVoters];
        if (isSelected && !hasVoted) {
          updatedVoters.push(currentNickname);
        } else if (!isSelected && hasVoted) {
          updatedVoters = updatedVoters.filter(
            (name) => name !== currentNickname,
          );
        }

        if (updatedVoters.length !== currentVoters.length) {
          const { error } = await supabase
            .from("poll_options")
            .update({ voters: updatedVoters })
            .eq("id", opt.id);

          if (error) throw error;
        }
      }

      alert(`[${currentNickname}]님의 투표가 완료되었습니다!`);
      fetchPollDetail(currentNickname);
    } catch (err) {
      console.error("투표 제출 실패:", err);
      alert("투표 저장 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return <div className="p-8 text-mid-gray">로딩 중...</div>;
  }

  // 전체 투표 수 계산
  const totalVotesCount = options.reduce(
    (sum, opt) => sum + (opt.voters?.length || 0),
    0,
  );

  const isClosed = poll?.status === "closed";

  return (
    <div className="w-full h-full flex flex-col p-8 select-none overflow-y-auto">
      {/* 상단 뒤로가기 & 헤더 */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate(`/room/${roomId}/plan`)}
            className="p-1 -ml-1 text-black hover:opacity-70 transition-opacity cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
          </button>
          <div className="flex items-center gap-2">
            <h3 className="text-black font-bold text-xl">
              {poll?.type === "menu" ? "무엇을 먹을까요?" : poll?.title}
            </h3>
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

      {/* 투표 상세 카드 컨테이너 */}
      <div className="w-full max-w-3xl rounded-2xl border border-light-blue bg-white p-7 shadow-xs">
        {/* 카드 헤더 */}
        <div className="flex items-center justify-between pb-6 border-b border-[#F5F6F8]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-black font-bold text-lg">{poll?.title}</h4>
              {isClosed && poll?.confirmed_label && (
                <span className="text-xs bg-light-blue text-main-blue font-bold px-2 py-0.5 rounded-md">
                  확정: {poll.confirmed_label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-main-blue text-xs font-medium">
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{poll?.allow_multiple ? "중복 가능" : "단일 선택"}</span>
            </div>
          </div>

          {!isClosed && (
            <button
              type="button"
              onClick={() => setIsAddingOption(true)}
              className="flex items-center gap-1 text-dark-gray hover:text-black text-sm font-medium cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>항목 추가하기</span>
            </button>
          )}
        </div>

        {/* 새 항목 인라인 추가 폼 */}
        {isAddingOption && !isClosed && (
          <form
            onSubmit={handleAddNewOption}
            className="flex items-center gap-2 my-4 p-3 bg-light-blue/20 rounded-xl"
          >
            <input
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="새로운 항목 입력"
              className="flex-1 bg-white px-3 py-2 rounded-lg border border-light-gray text-sm outline-none focus:border-main-blue"
              autoFocus
            />
            <Button
              type="submit"
              variant="primary"
              className="py-2 px-4 text-xs"
            >
              추가
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddingOption(false)}
              className="py-2 px-3 text-xs"
            >
              취소
            </Button>
          </form>
        )}

        {/* 투표 옵션 리스트 */}
        <div className="flex flex-col gap-5 py-6">
          {options.map((option) => {
            const isChecked = selectedOptionIds.includes(option.id);
            const isConfirmed =
              isClosed && poll?.confirmed_label === option.label;
            const votersCount = option.voters?.length || 0;
            const percent =
              totalVotesCount > 0
                ? Math.round((votersCount / totalVotesCount) * 100)
                : 0;

            return (
              <div
                key={option.id}
                onClick={() => handleToggleOption(option.id)}
                className={`flex items-center justify-between gap-4 p-2 rounded-xl transition-all ${
                  isClosed
                    ? "cursor-default"
                    : "cursor-pointer group hover:bg-[#F9FAFB]"
                } ${isConfirmed ? "bg-[#EFF6FF]" : ""}`}
              >
                {/* 항목 이름 */}
                <span
                  className={`text-sm w-32 truncate ${isConfirmed ? "font-bold text-main-blue" : "font-medium text-black"}`}
                >
                  {option.label} {isConfirmed && "(확정)"}
                </span>

                {/* 득표자 수 */}
                <span className="text-mid-gray text-xs w-10 text-right">
                  {votersCount}명
                </span>

                {/* 게이지 바 */}
                <div className="flex-1 h-2 rounded-full bg-[#ECEFF3] overflow-hidden">
                  <div
                    className="h-full bg-main-blue rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>

                {/* 백분율 */}
                <span className="text-xs text-dark-gray font-medium w-10 text-right">
                  {percent}%
                </span>

                {/* 체크박스 박스 */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                    isChecked
                      ? "bg-black border-black text-white"
                      : "border-light-gray bg-white group-hover:border-mid-gray"
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[2.8]" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 하단 고정 액션 바 (종료되지 않았을 때만 노출) */}
      {!isClosed && (
        <div className="w-full max-w-3xl mt-8 pt-6 border-t border-[#F0F2F5] flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-black font-bold text-sm">선택한 항목</span>
            <div className="flex items-center gap-2 flex-wrap">
              {selectedOptionIds.length === 0 ? (
                <span className="text-xs text-mid-gray">
                  선택된 항목이 없습니다.
                </span>
              ) : (
                selectedOptionIds.map((id) => {
                  const opt = options.find((o) => o.id === id);
                  if (!opt) return null;
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-main-blue text-main-blue bg-white text-xs font-medium"
                    >
                      <span>{opt.label}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleOption(id);
                        }}
                        className="hover:opacity-70 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            onClick={handleSubmitVote}
            className="px-7 py-2.5"
          >
            투표하기
          </Button>
        </div>
      )}

      {/* 🟢 일반 투표 종료 모달 (득표율 %로 표시) */}
      <CloseVoteModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        poll={poll}
        options={options}
        onConfirmed={() => {
          navigate(`/room/${roomId}/plan`);
        }}
      />
    </div>
  );
}
