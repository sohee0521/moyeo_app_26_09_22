import React from "react";
import { useNavigate } from "react-router";
import { Pencil, Trash2 } from "lucide-react";
import moyeoCharacters from "../../../img/main-characters.png";
import profileDefault from "../../../img/profile-default.png";

export default function ActiveMeetingNotice({
  activeMeeting,
  roomId,
  onStartEdit,
  onDeleteMeeting,
}) {
  const navigate = useNavigate();

  const isPlanning = activeMeeting?.status === "planning";

  return (
    <div className="flex flex-col items-center w-full max-w-md">
      <div className="mb-6">
        <img
          src={moyeoCharacters}
          alt="MOYEO 캐릭터"
          className="w-44 h-auto object-contain"
        />
      </div>

      <h2 className="text-black font-bold mb-2">
        이미 진행중인 모임이 있어요!
      </h2>
      <p className="text-mid-gray mb-8">
        현재 모임이 끝나면 새 모임을 만들 수 있어요
      </p>

      {/* 모임 정보 카드 */}
      <div className="w-full rounded-2xl border border-light-blue bg-white p-6 shadow-[0_0_15px_color-mix(in_srgb,theme(colors.sub-blue)_50%,transparent)]">
        <div className="flex items-start justify-between">
          <div
            onClick={() => navigate(`/room/${roomId}/plan`)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-black font-bold">{activeMeeting.title}</h3>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full inline-block transition-colors ${
                    isPlanning ? "bg-status-preparing" : "bg-status-active"
                  }`}
                />
                <p className="text-mid-gray text-[14px]">
                  {isPlanning ? "계획중" : "모임중"}
                </p>
              </div>
            </div>

            {/* 실제 참가 멤버  */}
            <div className="flex items-center -space-x-2">
              {Array.isArray(activeMeeting.members) &&
                activeMeeting.members.map((_, idx) => (
                  <div
                    key={idx}
                    className="flex justify-center items-center w-8 h-8 rounded-full border-2 border-white bg-light-blue shrink-0"
                  >
                    <img
                      src={profileDefault}
                      alt="기본 프로필"
                      className="w-[18px] object-cover "
                    />
                  </div>
                ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-mid-gray">
            <button
              type="button"
              onClick={onStartEdit}
              className="hover:text-black p-1 transition-colors cursor-pointer"
              title="모임 정보 수정"
            >
              <Pencil size={16} color="#828282" />
            </button>
            <button
              type="button"
              onClick={onDeleteMeeting}
              className=" p-1 transition-colors text-status-important/70 cursor-pointer"
              title="모임 삭제"
            >
              <Trash2 size={16} color="#fa6464" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
