import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  ChevronLeft,
  X,
  Camera,
  AlertCircle,
  UserCheck,
  UserPlus,
} from "lucide-react";
import Button from "../../../components/common/Button";
import profileDefault from "../../../img/profile-default.png";
import { roomService } from "../../../services/roomService";
import { supabase } from "../../../services/supabaseClient";

export default function JoinRoomModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // steps:
  // 1: 방 코드 입력
  // 'auto_return': 내 기기 로컬에 이미 정보가 있을 때 빠른 재입장 안내
  // 'choose_type': 로컬에 없을 때 (새 멤버 vs 기존 멤버 선택)
  // 'new_member': 새 닉네임/프로필 등록
  // 'select_existing': 기존 방 멤버 목록 중 본인 선택
  const [step, setStep] = useState(1);
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  // 기존 멤버 목록 & 로컬 저장된 기존 정보
  const [existingMembers, setExistingMembers] = useState([]);
  const [cachedUser, setCachedUser] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRoomCode("");
      setNickname("");
      setProfileImage(null);
      setExistingMembers([]);
      setCachedUser(null);
      setShowErrorModal(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 1단계: 코드 입력 후 검증 (기존 기기 자동 복구 테스트용 주석 처리)
  const handleVerifyRoomCode = async (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    try {
      const exists = await roomService.checkRoomExists(code);
      if (!exists) {
        setShowErrorModal(true);
        return;
      }

      setRoomCode(code);

      /* =========================================================
         [테스트를 위해 주석 처리] 
         같은 기기 자동 재입장(auto_return) 로직을 건너뛰고 
         무조건 신규/기존 멤버 선택 분기('choose_type')로 이동합니다.
      ========================================================= */
      // const localUser = localStorage.getItem(`room_${code}_user`);
      // const localAvatar = localStorage.getItem(`room_${code}_avatar`);

      // if (localUser) {
      //   setCachedUser({ nickname: localUser, avatar: localAvatar });
      //   setStep('auto_return');
      // } else {
      //   setStep('choose_type');
      // }

      // 바로 선택 화면으로 직행
      setStep("choose_type");
    } catch (err) {
      console.error("검증 오류:", err);
      alert("코드 확인 중 오류가 발생했습니다.");
    }
  };

  // 기존 멤버 목록 불러오기 (다른 기기에서 접속했을 때)
  const handleLoadExistingMembers = async () => {
    try {
      const { data, error } = await supabase
        .from("room_members")
        .select("*")
        .eq("room_code", roomCode);

      if (error) throw error;
      setExistingMembers(data || []);
      setStep("select_existing");
    } catch (err) {
      console.error("멤버 목록 로드 실패:", err);
      alert("멤버 목록을 불러오지 못했습니다.");
    }
  };

  // 기존 멤버 선택 시 입장 처리
  const handleSelectMember = (member) => {
    localStorage.setItem(`room_${roomCode}_role`, member.role);
    localStorage.setItem(`room_${roomCode}_user`, member.nickname);
    if (member.avatar_url) {
      localStorage.setItem(`room_${roomCode}_avatar`, member.avatar_url);
    }
    onClose();
    navigate(`/room/${roomCode}`);
  };

  // 새 멤버로 등록 후 입장
  const handleJoinAsNew = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    try {
      // Supabase 멤버 등록
      await supabase.from("room_members").insert([
        {
          room_code: roomCode,
          nickname: nickname.trim(),
          avatar_url: profileImage || null,
          role: "member",
        },
      ]);

      // 로컬 스토리지 저장
      localStorage.setItem(`room_${roomCode}_role`, "member");
      localStorage.setItem(`room_${roomCode}_user`, nickname.trim());
      if (profileImage) {
        localStorage.setItem(`room_${roomCode}_avatar`, profileImage);
      }

      onClose();
      navigate(`/room/${roomCode}`);
    } catch (err) {
      console.error("참여 등록 실패:", err);
      alert("참여 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <div className="relative w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-xl transition-all">
        {/* 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (step === 1 ? onClose() : setStep(1))}
            className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.2]" />
            <h5 className="font-bold">참여하기</h5>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-dark-gray hover:text-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* STEP 1: 방 코드 입력 */}
        {step === 1 && (
          <form onSubmit={handleVerifyRoomCode} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-black">방 코드</label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="예) D92H3"
                className="w-full rounded-lg border-2 border-light-gray px-3.5 py-2.5 text-sm uppercase tracking-wider outline-none focus:border-main-blue"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="dark"
              disabled={!roomCode.trim()}
              className="w-full py-3 mt-4"
            >
              다음
            </Button>
          </form>
        )}

        {/* STEP: 내 브라우저 기록으로 바로 재입장 */}
        {step === "auto_return" && cachedUser && (
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-light-blue shadow-inner mb-3">
              {cachedUser.avatar ? (
                <img
                  src={cachedUser.avatar}
                  alt="내 프로필"
                  className="h-full w-full object-cover"
                />
              ) : (
                <img
                  src={profileDefault}
                  alt="기본 프로필"
                  className="w-[40px] object-cover"
                />
              )}
            </div>
            <h5 className="font-bold text-black mb-1">
              {cachedUser.nickname}님,
            </h5>
            <p className="text-xs text-dark-gray mb-6">
              이 방에 참여했던 기록이 있어요!
              <br />
              이전 프로필로 바로 입장할까요?
            </p>

            <Button
              variant="primary"
              onClick={() => {
                onClose();
                navigate(`/room/${roomCode}`);
              }}
              className="w-full py-3 mb-2"
            >
              이대로 입장하기
            </Button>

            <button
              type="button"
              onClick={() => setStep("choose_type")}
              className="text-xs text-mid-gray underline hover:text-dark-gray"
            >
              다른 프로필로 들어갈래요
            </button>
          </div>
        )}

        {/* STEP: 신규 vs 기존 멤버 선택 분기 */}
        {step === "choose_type" && (
          <div className="flex flex-col gap-1 py-">
            <button
              onClick={() => setStep("new_member")}
              className="flex items-center gap-3 p-3.5 rounded-xl  hover:!bg-light-blue transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-light-blue text-main-blue">
                <UserPlus />
              </div>
              <div className="">
                <p className="text-[16px] h-[20px] font-semibold text-black">
                  새 멤버로 참여
                </p>
                <p className="text-[14px] text-mid-gray">
                  이 방에 처음 들어와요
                </p>
              </div>
            </button>

            <button
              onClick={handleLoadExistingMembers}
              className="flex items-center gap-3 p-3.5 rounded-xl hover:!bg-light-blue  transition-colors text-left"
            >
              <div className="p-3 rounded-lg bg-[#F5F5F5] text-dark-gray">
                <UserCheck />
              </div>
              <div>
                <p className="text-[16px]  h-[20px]  font-semibold text-black">
                  기존 멤버로 참여
                </p>
                <p className="text-[14px] text-mid-gray">
                  이미 입장했던 방이에요
                </p>
              </div>
            </button>
          </div>
        )}

        {/* STEP: 기존 멤버 목록에서 본인 프로필 선택 */}
        {step === "select_existing" && (
          <div className="flex flex-col">
            <p className="text-[14px] text-dark-gray mb-3 text-center">
              본인의 프로필을 선택해 주세요
            </p>
            <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
              {existingMembers.length === 0 ? (
                <p className="text-xs text-mid-gray text-center py-6">
                  등록된 멤버가 없습니다.
                </p>
              ) : (
                existingMembers.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => handleSelectMember(m)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-light-gray hover:bg-light-blue/40 transition-colors text-left"
                  >
                    <div className="h-12 w-12 shrink-0 rounded-full bg-light-blue overflow-hidden flex items-center justify-center">
                      {m.avatar_url ? (
                        <img
                          src={m.avatar_url}
                          alt={m.nickname}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <img
                          src={profileDefault}
                          alt="기본 프로필"
                          className="w-[30px] object-cover"
                        />
                      )}
                    </div>
                    <span className="text-[14px] font-medium text-black">
                      {m.nickname}
                    </span>
                    {m.role === "host" && (
                      <span className="text-[14px] text-main-blue font-bold ml-auto">
                        방장
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* STEP: 새 멤버 프로필 생성 */}
        {step === "new_member" && (
          <form
            onSubmit={handleJoinAsNew}
            className="flex flex-col items-center gap-5"
          >
            <div className="relative mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setProfileImage(URL.createObjectURL(file));
                }}
                accept="image/*"
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-light-blue shadow-inner"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="프로필"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <img
                    src={profileDefault}
                    alt="기본 프로필"
                    className="w-[40px] object-cover"
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full !bg-mid-gray !border-2 !border-white  hover:opacity-80 transition-opacity"
              >
                <Camera size={15} color="white" strokeWidth={2} />
              </button>
            </div>

            <div className="flex w-full items-center gap-3">
              <span className="shrink-0 text-sm font-bold text-black">
                이름
              </span>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder=" 사용할 이름을 적어주세요."
                className="!text-[14px] w-full rounded-lg border-2 border-light-gray px-3 py-2 outline-none transition-colors focus:border-main-blue"
                autoFocus
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={!nickname.trim()}
              className="w-full py-3 mt-2"
            >
              참여하기
            </Button>
          </form>
        )}

        {/* 에러 모달 */}
        {showErrorModal && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/95 p-6 backdrop-blur-xs text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-status-important">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h5 className="font-bold text-black mb-1">방을 찾을 수 없어요</h5>
            <p className="text-xs text-dark-gray leading-relaxed mb-6">
              코드를 다시 확인해 주세요.
            </p>
            <Button
              variant="secondary"
              onClick={() => setShowErrorModal(false)}
              className="w-full py-2.5 text-xs font-semibold"
            >
              다시 입력하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
