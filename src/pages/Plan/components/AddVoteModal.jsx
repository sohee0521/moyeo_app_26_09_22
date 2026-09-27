import React, { useState } from "react";
import { ChevronLeft, X, Check } from "lucide-react";
import Button from "../../../components/common/Button";

// 투표 타입 목록
const VOTE_TYPES = [
  { id: "date", label: "날짜" },
  { id: "menu", label: "메뉴" },
  { id: "place", label: "장소" },
  { id: "stay", label: "숙소" },
  { id: "etc", label: "그 외" },
];

export default function AddVoteModal({ isOpen, onClose, onCreateVote }) {
  // 1: 타입 선택 단계 | 2: 세부 설정 단계
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState("date");

  // [날짜 투표 전용 상태]
  const [year, setYear] = useState("2026");
  const [startMonth, setStartMonth] = useState("8");
  const [endMonth, setEndMonth] = useState("9");

  // [일반 투표(메뉴/장소/숙소/그 외) 전용 상태]
  const [title, setTitle] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [allowMultiple, setAllowMultiple] = useState(true);

  if (!isOpen) return null;

  // 모달 닫기 및 폼 초기화
  const handleClose = () => {
    setStep(1);
    setSelectedType("date");
    setTitle("");
    setOptions(["", ""]);
    onClose();
  };

  // 일반 투표 옵션 추가
  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, ""]);
    }
  };

  // 일반 투표 옵션 내용 변경
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  // 일반 투표 옵션 삭제 (최소 2개 유지)
  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  // 최종 생성
  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedType === "date") {
      onCreateVote({
        type: "date",
        title: "날짜 정하기",
        year,
        startMonth,
        endMonth,
      });
    } else {
      const filteredOptions = options.map((opt) => opt.trim()).filter(Boolean);
      if (!title.trim() || filteredOptions.length < 2) return;

      onCreateVote({
        type: selectedType,
        title: title.trim(),
        options: filteredOptions,
        allowMultiple,
      });
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs select-none">
      <div className="w-full max-w-[400px] rounded-2xl bg-white p-6 shadow-xl animate-fade-in-up">
        {/* 상단 네비게이션 헤더 */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0F0F0] mb-5">
          <div className="flex items-center gap-1 ">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="p-1 -ml-1 text-black hover:opacity-70 transition-opacity cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
              </button>
            )}
            <h5 className="text-black font-bold">투표 추가하기</h5>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 text-mid-gray hover:text-black transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ==========================================
            [1단계] 투표 유형 선택 모달
           ========================================== */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div>
              <h6 className="text-black font-bold mb-4">
                무엇을 정해야하나요?
              </h6>
              <div className="flex flex-wrap items-center gap-2">
                {VOTE_TYPES.map((t) => {
                  const isSelected = selectedType === t.id;
                  return (
                    <Button
                      key={t.id}
                      type="button"
                      variant={isSelected ? "chip-primary" : "chip-outline"}
                      onClick={() => setSelectedType(t.id)}
                      className="px-4 py-1.5 font-normal"
                    >
                      {t.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="button"
                variant="dark"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg"
              >
                다음
              </Button>
            </div>
          </div>
        )}

        {/* ==========================================
            [2단계 - A] 날짜 선택 모달
           ========================================== */}
        {step === 2 && selectedType === "date" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <h6 className="text-black font-bold mb-4">
                모임 시기는 언제인가요?
              </h6>
              <div className="flex items-center gap-2">
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="rounded-xl border border-light-gray px-3 py-2.5 outline-none focus:border-main-blue text-sm bg-white"
                >
                  <option value="2026">2026년</option>
                  <option value="2027">2027년</option>
                </select>

                <select
                  value={startMonth}
                  onChange={(e) => setStartMonth(e.target.value)}
                  className="rounded-xl border border-light-gray px-3 py-2.5 outline-none focus:border-main-blue text-sm bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>

                <span className="text-dark-gray text-sm">~</span>

                <select
                  value={endMonth}
                  onChange={(e) => setEndMonth(e.target.value)}
                  className="rounded-xl border border-light-gray px-3 py-2.5 outline-none focus:border-main-blue text-sm bg-white"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m}월
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" className="px-6 py-2.5">
                생성하기
              </Button>
            </div>
          </form>
        )}

        {/* ==========================================
            [2단계 - B] 메뉴/장소/숙소/그 외 모달
           ========================================== */}
        {step === 2 && selectedType !== "date" && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* 투표 제목 */}
            <div className="flex flex-col gap-1.5">
              <h6 className="text-black font-bold">투표 제목</h6>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 점심 메뉴, 여름휴가"
                className="w-full rounded-xl border border-light-gray px-4 py-2.5 outline-none focus:border-main-blue bg-white text-sm"
              />
            </div>

            {/* 투표 항목 리스트 */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h6 className="text-black font-bold">투표 항목</h6>
                {options.length < 8 && (
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="text-xs text-main-blue hover:underline cursor-pointer"
                  >
                    + 항목 추가
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-0.5">
                {options.map((opt, idx) => (
                  <div key={idx} className="relative flex items-center">
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder="항목 입력"
                      className="w-full rounded-xl border border-light-gray px-4 py-2.5 pr-9 outline-none focus:border-main-blue bg-white text-sm"
                    />
                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(idx)}
                        className="absolute right-3 text-mid-gray hover:text-black cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 중복 허용 체크박스 */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div
                onClick={() => setAllowMultiple(!allowMultiple)}
                className={`flex h-4 w-4 items-center justify-center rounded border transition-colors ${
                  allowMultiple
                    ? "border-main-blue bg-main-blue text-white"
                    : "border-light-gray bg-white"
                }`}
              >
                {allowMultiple && <Check className="h-3 w-3 stroke-[3]" />}
              </div>
              <span className="text-xs text-dark-gray font-medium">
                중복 허용
              </span>
            </label>

            {/* 생성하기 버튼 */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                disabled={
                  !title.trim() || options.filter((o) => o.trim()).length < 2
                }
                className="px-6 py-2.5"
              >
                생성하기
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
