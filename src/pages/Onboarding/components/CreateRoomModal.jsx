import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, X, Copy, Check, Camera } from "lucide-react";
import profileDefault from "../../../img/profile-default.png";
import crown from "../../../img/crown.png";
import Button from "../../../components/common/Button";
import { roomService } from "../../../services/roomService";

export default function CreateRoomModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Step 관리 (1: 방 이름 -> 2: 프로필/닉네임 -> 3: 방 코드 -> 4: 방장 완료)
  const [step, setStep] = useState(1);
  const [roomName, setRoomName] = useState("");
  const [nickname, setNickname] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [profileImage, setProfileImage] = useState(null); // 프로필 이미지 미리보기 URL
  const [isCopied, setIsCopied] = useState(false);

  // 모달이 열릴 때 초기화 & 자동 6자리 방 코드 생성
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setRoomName("");
      setNickname("");
      setProfileImage(null);
      setIsCopied(false);

      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let result = "";
      for (let i = 0; i < 6; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length),
        );
      }
      setRoomCode(result);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // 이전 단계 이동
  const handlePrev = () => {
    if (step === 1) onClose();
    else setStep((prev) => prev - 1);
  };

  // 이미지 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  // 코드 클립보드 복사
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("코드 복사 실패:", err);
    }
  };

  // 방 최종 생성 완료 후 방장으로 이동
  const handleEnterRoom = async () => {
    try {
      // 1. Supabase rooms 테이블에 방 저장
      await roomService.createRoom({
        roomCode,
        roomName,
        hostNickname: nickname,
      });

      // 2. 방장 식별 정보 로컬 저장
      localStorage.setItem(`room_${roomCode}_role`, "host");
      localStorage.setItem(`room_${roomCode}_user`, nickname);
      if (profileImage) {
        localStorage.setItem(`room_${roomCode}_avatar`, profileImage);
      }

      onClose();
      // 3. 생성된 방으로 이동
      navigate(`/room/${roomCode}/new-meeting`);
    } catch (err) {
      console.error("방 생성 오류:", err);
      alert("방 생성에 실패했습니다. 다시 시도해 주세요.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
      <div className="relative w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl transition-all">
        {/* 상단 네비게이션 헤더 */}
        <div className="mb-6 flex items-center justify-between">
          {/* 좌측: 뒤로가기 버튼 (Step 1~3일 때 노출) */}
          <div>
            {step < 4 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="flex items-center gap-1 text-black hover:opacity-70 transition-opacity"
              >
                <ChevronLeft size={25} />
                <h5 className="font-bold text-[20px]">
                  {step === 2 ? "참여하기" : "방 만들기"}
                </h5>
              </button>
            ) : (
              <div className="w-5" /> // Step 4일 때 우측 X 버튼 정렬을 위한 빈 공간
            )}
          </div>

          {/* 우측: 닫기(X) 버튼 (항상 노출되어 바로 닫기 가능) */}
          <button
            type="button"
            onClick={onClose}
            className="text-dark-gray hover:text-black transition-colors"
          >
            <X size={25} />
          </button>
        </div>

        {/* STEP 1: 방 이름 입력 */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (roomName.trim()) setStep(2);
            }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-2">
              <label className="text-[16px] font-bold text-black">
                방 이름
              </label>
              <input
                type="text"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder="예) 24 디자인과"
                className="!text-[14px] w-full rounded-lg border-2 border-light-gray px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-main-blue"
                autoFocus
              />
            </div>
            <Button
              type="submit"
              variant="dark"
              disabled={!roomName.trim()}
              className="w-full py-3 mt-4"
            >
              다음
            </Button>
          </form>
        )}

        {/* STEP 2: 프로필 사진 & 닉네임 입력 */}
        {step === 2 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (nickname.trim()) setStep(3);
            }}
            className="flex flex-col items-center gap-5"
          >
            {/* 프로필 이미지 선택 영역 */}
            <div className="relative mt-2">
              {/* 실제 파일 선택 input (숨김) */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*"
                className="hidden"
              />

              {/* 프로필 아바타 (기본 캐릭터 or 업로드한 이미지) */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex h-20 w-20 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-light-blue border-1 border-light-gray"
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="선택된 프로필"
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

              {/* 카메라 버튼 아이콘 */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full !bg-mid-gray !border-2 !border-white  hover:opacity-80 transition-opacity"
              >
                <Camera size={15} color="white" strokeWidth={2} />
              </button>
            </div>

            <div className="flex w-full items-center gap-3">
              <span className="shrink-0 text-[16px] font-bold text-black">
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
              variant="dark"
              disabled={!nickname.trim()}
              className="w-full py-3 mt-2"
            >
              다음
            </Button>
          </form>
        )}

        {/* STEP 3: 자동 생성된 방 코드 */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[16px] font-bold text-black">
                방 코드
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  readOnly
                  value={roomCode}
                  className="w-full rounded-lg border-2 border-light-gray px-3.5 py-2.5 text-sm font-medium tracking-wider !text-dark-gray outline-none bg-white"
                />
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="absolute right-3 text-dark-gray hover:text-black transition-colors"
                >
                  {isCopied ? (
                    <Check className=" text-status-active" size={20} />
                  ) : (
                    <Copy size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="text-left mt-1">
              <p className="font-semibold text-main-blue">
                우리 모임의 방 코드예요!
              </p>
              <p className="text-[14px] text-dark-gray ">
                방 코드를 친구들과 공유하고 함께 모임을 준비해보세요.
              </p>
            </div>

            <Button
              variant="primary"
              onClick={() => setStep(4)}
              className="w-full py-3 mt-4"
            >
              생성하기
            </Button>
          </div>
        )}

        {/* STEP 4: 방장 안내 완료 (선택한 프로필 연동) */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-5 mt-2">
              <img
                src={crown}
                alt=""
                className="absolute -top-3 left-1/2 -translate-x-1/2 text-xl animate-bounce"
              />

              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-light-blue shadow-inner">
                <img
                  src={profileDefault}
                  alt="기본 프로필"
                  className="w-[40px] object-cover"
                />
              </div>
            </div>

            <h5 className="!text-[16px] text-main-blue mb-1">
              방장이 되었어요!
            </h5>
            <p className="text-[14px] text-dark-gray leading-relaxed mb-6">
              방장은 모임을 만들고, 새로운 투표를 추가하거나
              <br />
              진행 중인 투표를 종료할 수 있어요.
            </p>

            <Button
              variant="primary"
              onClick={handleEnterRoom}
              className="w-full py-3"
            >
              방 이동하기
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
