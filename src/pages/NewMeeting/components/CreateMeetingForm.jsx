import React from "react";
import Button from "../../../components/common/Button";
import moyeoCharacters from "../../../img/main-characters.png";

export default function CreateMeetingForm({
  isEditing = false,
  meetingTitle,
  setMeetingTitle,
  selectedMembers = [],
  roomMembers = [],
  isAllSelected,
  onToggleAll,
  onToggleMember,
  onSubmit,
  onComplete,
}) {
  return (
    <div className="flex flex-col items-center w-full max-w-md">
      {/* 캐릭터 & 말풍선 */}
      <div className="relative mb-6 flex flex-col items-center">
        <div className="absolute -top-3 right-0 translate-x-12">
          <p className="text-[#AEB3C7]">우리 또 어디갈까?</p>
        </div>
        <img
          src={moyeoCharacters}
          alt="MOYEO 캐릭터"
          className="w-44 h-auto object-contain"
        />
      </div>

      {!isEditing && (
        <h2 className="text-black font-bold mb-8">
          새로운 약속을 만들어볼까요?
        </h2>
      )}

      <form onSubmit={onSubmit} className="w-full flex flex-col gap-6">
        {/* 모임 이름 입력 */}
        <div className="flex flex-col gap-2">
          <h6 className="text-black font-bold">모임 이름</h6>
          <input
            type="text"
            value={meetingTitle}
            onChange={(e) => setMeetingTitle(e.target.value)}
            placeholder="예) 2월 경주 여행"
            className="w-full rounded-xl border border-light-gray px-4 py-3 outline-none focus:border-main-blue bg-white"
          />
        </div>

        {/* 참가 멤버 선택 칩 */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h6 className="text-black font-bold">참가 멤버</h6>
            <p className="text-mid-gray">{selectedMembers.length}명 선택됨</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 py-2">
            {/* '모두' 토글 버튼 */}
            <Button
              type="button"
              variant={isAllSelected ? "chip-primary" : "chip-default"}
              onClick={onToggleAll}
            >
              모두
            </Button>

            {/* 개별 멤버 칩 */}
            {roomMembers.map((member) => {
              const isSelected = selectedMembers.includes(member.nickname);
              return (
                <Button
                  key={member.id}
                  type="button"
                  variant={isSelected ? "chip-primary" : "chip-default"}
                  onClick={() => onToggleMember(member.nickname)}
                >
                  {member.nickname}
                </Button>
              );
            })}
          </div>
        </div>

        {/* 하단 버튼 분기 */}
        {!isEditing ? (
          <Button
            type="submit"
            variant="primary"
            disabled={!meetingTitle.trim() || selectedMembers.length === 0}
            className="w-full py-3.5 mt-2"
          >
            새 모임 만들기
          </Button>
        ) : (
          <div className="flex items-center gap-3 w-full mt-2">
            <Button
              type="submit"
              variant="secondary"
              disabled={!meetingTitle.trim() || selectedMembers.length === 0}
              className="flex-1 py-3.5"
            >
              저장
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={onComplete}
              className="flex-1 py-3.5"
            >
              모임 종료
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}
