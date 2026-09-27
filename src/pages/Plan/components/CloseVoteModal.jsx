import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, X, Check, User } from "lucide-react";
import Button from "../../../components/common/Button";
import { supabase } from "../../../services/supabaseClient";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 라벨 포맷 함수 (2026-10-18 -> 10/18 (일))
const formatLabel = (dateStr) => {
  if (!dateStr || !dateStr.includes("-")) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  const dayName = WEEKDAYS[new Date(y, m - 1, d).getDay()];
  return `${m}/${d} (${dayName})`;
};

export default function CloseVoteModal({
  isOpen,
  onClose,
  poll,
  options = [],
  totalMembers = 0,
  onConfirmed,
}) {
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 날짜 투표 여부 판별
  const isDateVote = poll?.type === "date" || Boolean(poll?.date_range);

  // 일반 투표의 전체 투표수 합산 (백분율 계산용)
  const totalVotes = useMemo(() => {
    return options.reduce((sum, opt) => sum + (opt.voters?.length || 0), 0);
  }, [options]);

  // 득표수가 많은 순서대로 내림차순 정렬
  const sortedOptions = useMemo(() => {
    return [...options].sort(
      (a, b) => (b.voters?.length || 0) - (a.voters?.length || 0),
    );
  }, [options]);

  // 모달 열릴 때 최다 득표 항목 기본 선택
  useEffect(() => {
    if (isOpen && sortedOptions.length > 0) {
      setSelectedOptionId(sortedOptions[0].id);
    }
  }, [isOpen, sortedOptions]);

  if (!isOpen) return null;

  // 종료 및 확정 처리
  const handleConfirmClose = async () => {
    if (!selectedOptionId) {
      alert("확정할 항목을 선택해주세요.");
      return;
    }

    const confirmedOpt = options.find((o) => o.id === selectedOptionId);

    try {
      setIsSubmitting(true);

      // 1. 가장 기본적인 필수 필드만 우선 전송 (status, confirmed_label)
      const updatePayload = {
        status: "closed",
      };

      if (confirmedOpt?.label) {
        updatePayload.confirmed_label = confirmedOpt.label;
      }

      const { error: pollError } = await supabase
        .from("polls")
        .update(updatePayload)
        .eq("id", poll.id);

      // 만약 confirmed_label 컬럼이 없어서 에러가 발생한다면 status만 단독 업데이트 시도
      if (pollError) {
        console.warn(
          "전체 필드 업데이트 실패, status만 단독 업데이트 시도:",
          pollError,
        );
        const { error: fallbackError } = await supabase
          .from("polls")
          .update({ status: "closed" })
          .eq("id", poll.id);

        if (fallbackError) throw fallbackError;
      }

      const displayTitle = isDateVote
        ? formatLabel(confirmedOpt?.label)
        : confirmedOpt?.label;

      alert(`'${displayTitle}' 항목으로 투표가 종료되었습니다.`);
      if (onConfirmed) onConfirmed(confirmedOpt);
      onClose();
    } catch (err) {
      console.error("투표 종료 처리 실패 상세:", err);
      alert("투표 종료 처리 중 오류가 발생했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-[380px] rounded-3xl bg-white p-7 shadow-2xl transition-all">
        {/* 상단 네비게이션 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-black">
            <button
              type="button"
              onClick={onClose}
              className="p-1 -ml-1 text-black hover:opacity-70 transition-opacity cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5 stroke-[2.2]" />
            </button>
            <h4 className="font-bold text-lg">투표종료</h4>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-gray hover:text-black transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 1. 투표 제목 */}
        <div className="mb-5 flex flex-col gap-2">
          <label className="text-sm font-bold text-black">투표 제목</label>
          <div className="w-full rounded-xl border border-light-gray px-4 py-3 text-sm text-black bg-white">
            {poll?.title || (isDateVote ? "언제 만날까요?" : "투표")}
          </div>
        </div>

        {/* 2. 투표 항목 리스트 */}
        <div className="mb-8 flex flex-col gap-2.5">
          <label className="text-sm font-bold text-black">투표 항목</label>
          <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
            {sortedOptions.length === 0 ? (
              <p className="text-xs text-mid-gray py-4 text-center">
                투표 항목이 없습니다.
              </p>
            ) : (
              sortedOptions.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                const votersCount = opt.voters?.length || 0;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOptionId(opt.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-[#B8D3FF] !bg-[#EFF6FF]" /* 체크 시 밝은 하늘색 배경 */
                        : "border-light-gray bg-white hover:bg-[#F9FAFB]"
                    }`}
                  >
                    {/* 항목 이름 */}
                    <span className="text-sm font-medium text-black truncate pr-2">
                      {isDateVote ? formatLabel(opt.label) : opt.label}
                    </span>

                    {/* 우측 지표 (인원수/퍼센트) & 체크 아이콘 */}
                    <div className="flex items-center gap-2.5 shrink-0">
                      {isDateVote ? (
                        /* 날짜 투표: 작은 사람 아이콘 + 파란색 인원수 */
                        <div className="flex items-center gap-1 text-main-blue font-semibold text-xs">
                          <User className="w-3.5 h-3.5 fill-current" />
                          <span>
                            {totalMembers > 0 && votersCount >= totalMembers
                              ? "전원"
                              : `${votersCount}명`}
                          </span>
                        </div>
                      ) : (
                        /* 일반 투표: 퍼센트 표기 */
                        <span className="text-xs font-semibold text-main-blue">
                          {totalVotes > 0
                            ? Math.round((votersCount / totalVotes) * 100)
                            : 0}
                          %
                        </span>
                      )}

                      {/* 체크 표시 */}
                      <Check
                        className={`h-4 w-4 stroke-[2.5] ${
                          isSelected ? "text-main-blue" : "text-mid-gray/30"
                        }`}
                      />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* 하단 확정 버튼 */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            disabled={isSubmitting || !selectedOptionId}
            onClick={handleConfirmClose}
            className="px-6 py-2.5 text-sm font-bold rounded-xl"
          >
            {isSubmitting ? "처리 중..." : "확정"}
          </Button>
        </div>
      </div>
    </div>
  );
}
