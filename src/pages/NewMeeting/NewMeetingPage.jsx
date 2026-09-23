import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { Sparkles } from "lucide-react";
import Button from "../../components/common/Button";
import { roomService } from "../../services/roomService";
import CreateMeetingForm from "./components/CreateMeetingForm";
import ActiveMeetingNotice from "./components/ActiveMeetingNotice";

export default function NewMeetingPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [roomMembers, setRoomMembers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);

  // 모임 종료 모달 제어 상태
  const [isFinishModalOpen, setIsFinishModalOpen] = useState(false);

  // 폼 입력 상태
  const [meetingTitle, setMeetingTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);

  // 데이터 로드
  const fetchData = async () => {
    if (!roomId) return;
    try {
      setLoading(true);
      const [meeting, members] = await Promise.all([
        roomService.getActiveMeeting(roomId),
        roomService.getRoomMembers(roomId),
      ]);

      setActiveMeeting(meeting);
      setRoomMembers(members || []);

      if (meeting) {
        setMeetingTitle(meeting.title || "");
        setSelectedMembers(meeting.members || []);
      } else {
        setMeetingTitle("");
        if (members && members.length > 0) {
          setSelectedMembers(members.map((m) => m.nickname));
        }
      }
    } catch (err) {
      console.error("데이터 로드 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [roomId]);

  // 개별 멤버 토글
  const handleToggleMember = (nickname) => {
    setSelectedMembers((prev) =>
      prev.includes(nickname)
        ? prev.filter((name) => name !== nickname)
        : [...prev, nickname],
    );
  };

  // '모두' 선택 확인 및 토글
  const isAllSelected =
    roomMembers.length > 0 && selectedMembers.length === roomMembers.length;

  const handleToggleAll = () => {
    if (isAllSelected) {
      setSelectedMembers([]);
    } else {
      setSelectedMembers(roomMembers.map((m) => m.nickname));
    }
  };

  // 1. 새 모임 생성
  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    if (!meetingTitle.trim() || selectedMembers.length === 0) return;

    try {
      await roomService.createMeeting({
        roomCode: roomId,
        title: meetingTitle.trim(),
        members: selectedMembers,
      });
      fetchData();
    } catch (err) {
      console.error("모임 생성 실패:", err);
      alert("모임을 생성하지 못했습니다.");
    }
  };

  // 2. 수정 사항 Supabase에 저장
  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    if (!meetingTitle.trim() || selectedMembers.length === 0 || !activeMeeting)
      return;

    try {
      await roomService.updateMeeting({
        meetingId: activeMeeting.id,
        title: meetingTitle.trim(),
        members: selectedMembers,
      });
      setIsEditing(false); // 수정 모드 닫기
      fetchData(); // 카드 상태로 복귀 및 갱신
    } catch (err) {
      console.error("모임 수정 실패:", err);
      alert("모임 정보를 수정하지 못했습니다.");
    }
  };

  // 3. 모임 종료 버튼 클릭 -> 종료 모달 열기
  const handleOpenFinishModal = () => {
    setIsFinishModalOpen(true);
  };

  // 4. 모달에서 '모임 추억 보러가기' 클릭 시 -> DB 저장(completed) & 페이지 이동
  const handleConfirmFinishMeeting = async () => {
    if (!activeMeeting) return;
    try {
      // Supabase에 상태를 'completed'로 업데이트하여 저장
      await roomService.completeMeeting(activeMeeting.id);
      setIsFinishModalOpen(false);
      setIsEditing(false);

      // 모임 추억 페이지로 이동
      navigate(`/room/${roomId}/memory`);
    } catch (err) {
      console.error("모임 종료 처리 실패:", err);
      alert("모임 종료 중 오류가 발생했습니다.");
    }
  };

  // 5. 모임 삭제
  const handleDeleteMeeting = async () => {
    if (!window.confirm("진행 중인 모임을 삭제하시겠습니까?")) return;
    try {
      await roomService.deleteMeeting(activeMeeting.id);
      setIsEditing(false);
      setActiveMeeting(null);
      setMeetingTitle("");
      setSelectedMembers(roomMembers.map((m) => m.nickname));
    } catch (err) {
      console.error("모임 삭제 실패:", err);
      alert("모임 삭제 중 오류가 발생했습니다.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-mid-gray">로딩 중...</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center justify-center w-full h-full px-4 mt-30 select-none">
        {/* 생성 또는 수정 폼 */}
        {!activeMeeting || isEditing ? (
          <CreateMeetingForm
            isEditing={isEditing}
            meetingTitle={meetingTitle}
            setMeetingTitle={setMeetingTitle}
            selectedMembers={selectedMembers}
            roomMembers={roomMembers}
            isAllSelected={isAllSelected}
            onToggleAll={handleToggleAll}
            onToggleMember={handleToggleMember}
            onSubmit={isEditing ? handleUpdateMeeting : handleCreateMeeting}
            onComplete={handleOpenFinishModal}
          />
        ) : (
          /* 안내 카드 */
          <ActiveMeetingNotice
            activeMeeting={activeMeeting}
            roomId={roomId}
            onStartEdit={() => setIsEditing(true)}
            onDeleteMeeting={handleDeleteMeeting}
          />
        )}
      </div>

      {/* 모임 종료 확인 모달 */}
      {isFinishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-xs">
          <div className="w-full max-w-[340px] rounded-2xl bg-white p-6 shadow-xl text-center animate-fade-in-up">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-light-blue text-main-blue">
              <Sparkles className="h-6 w-6 stroke-[2]" />
            </div>

            <h5 className="text-black mb-1 font-bold">즐거운 모임이었나요?</h5>
            <p className="text-dark-gray leading-relaxed mb-6">
              모임 추억에서 오늘 모임을
              <br />
              언제든 되돌아볼 수 있어요!
            </p>

            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setIsFinishModalOpen(false)}
                className="w-full py-2.5"
              >
                취소
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmFinishMeeting}
                className="w-full py-2.5"
              >
                추억 보러가기
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
