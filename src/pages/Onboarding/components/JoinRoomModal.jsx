import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, X, Camera, AlertCircle } from "lucide-react";
import Button from "../../../components/common/Button";

export default function JoinRoomModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // 1: 방 코드 입력, 2: 프로필/이름 설정
  const [step, setStep] = useState(1);
  const [roomCode, setRoomCode] = useState("");
  const [nickname, setNickname] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  // 에러 모달 상태
  const [showErrorModal, setShowErrorModal] = useState(false);

  // 모달 오픈 시 초기화
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRoomCode("");
      setNickname("");
      setProfileImage(null);
      setShowErrorModal(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 뒤로가기
  const handlePrev = () => {
    if (step === 1) onClose();
    else setStep(1);
  };

  // 사진 업로드 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  // 방 코드 검증 후 2단계 이동
  const handleVerifyRoomCode = (e) => {
    e.preventDefault();
    const code = roomCode.trim().toUpperCase();
    if (!code) return;

    // [방 존재 여부 확인 로직]
    // 1) 앞서 방만들기로 생성된 방인지 localStorage 확인
    // 2) 개발/테스트용 임시 코드 ('MOYEO', 'TEST12') 허용
    const isRoomExists =
      localStorage.getItem(`room_${code}_role`) !== null ||
      code === "MOYEO" ||
      code === "TEST12";

    if (isRoomExists) {
      setRoomCode(code);
      setStep(2);
    } else {
      setShowErrorModal(true);
    }
  };

  // 최종 방 참여
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    // 참여자 정보 저장 (방장이 아님: member)
    localStorage.setItem(`room_${roomCode}_role`, "member");
    localStorage.setItem(`room_${roomCode}_user`, nickname);
    if (profileImage) {
      localStorage.setItem(`room_${roomCode}_avatar`, profileImage);
    }

    onClose();
    // 모임 홈 또는 상세 페이지로 이동
    navigate(`/room/${roomCode}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <div className="relative w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-xl transition-all">
        {/* 상단 네비게이션 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity"
          >
            <ChevronLeft className="h-5 w-5 stroke-[2.2]" />
            <h5 className="font-bold">참여하기</h5>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="text-dark-gray hover:text-black transition-colors"
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
                className="w-full rounded-lg border-2 border-light-gray px-3.5 py-2.5 !text-[14px] uppercase tracking-wider outline-none transition-colors focus:border-main-blue"
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

        {/* STEP 2: 프로필 & 닉네임 입력 */}
        {step === 2 && (
          <form
            onSubmit={handleJoinRoom}
            className="flex flex-col items-center gap-5"
          >
            {/* 프로필 이미지 선택 */}
            <div className="relative mt-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
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
                    alt="선택된 프로필"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl select-none">🙂</span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full bg-mid-gray text-white shadow hover:opacity-80 transition-opacity"
              >
                <Camera className="h-3.5 w-3.5" />
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
                placeholder="방에서 사용할 이름을 적어주세요."
                className="w-full rounded-lg border border-light-gray px-3 py-2 text-xs sm:text-sm outline-none transition-colors focus:border-main-blue"
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

        {/* [서브 모달] 방이 존재하지 않을 때 뜨는 오류 알림 */}
        {showErrorModal && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-white/95 p-6 backdrop-blur-xs text-center animate-fade-in-up">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-status-important">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h5 className="font-bold text-black mb-1">방을 찾을 수 없어요</h5>
            <p className="text-xs text-dark-gray leading-relaxed mb-6">
              입력하신 코드와 일치하는 방이 없습니다.
              <br />
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
