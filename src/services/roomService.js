import { supabase } from "./supabaseClient";

export const roomService = {
  // 1. 방 생성 + 방장을 room_members에 host로 등록
  async createRoom({ roomCode, roomName, hostNickname, hostAvatarUrl = null }) {
    // 1-1. rooms 테이블에 방 생성
    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .insert([
        {
          room_code: roomCode,
          room_name: roomName,
        },
      ])
      .select()
      .single();

    if (roomError) throw roomError;

    // 1-2. 방장을 room_members에 등록
    const { error: memberError } = await supabase.from("room_members").insert([
      {
        room_code: roomCode,
        nickname: hostNickname,
        avatar_url: hostAvatarUrl,
        role: "host",
      },
    ]);

    if (memberError) throw memberError;

    return roomData;
  },

  // 2. 방 존재 여부 확인
  async checkRoomExists(roomCode) {
    const { data, error } = await supabase
      .from("rooms")
      .select("room_code")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // 3. 방 코드로 방 단건 조회
  async getRoomByCode(roomCode) {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 4. 방 멤버 목록 조회
  async getRoomMembers(roomCode) {
    const { data, error } = await supabase
      .from("room_members")
      .select("*")
      .eq("room_code", roomCode)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 5. 일반 멤버 참여 등록
  async joinRoom({ roomCode, nickname, avatarUrl = null }) {
    const { data, error } = await supabase
      .from("room_members")
      .insert([
        {
          room_code: roomCode,
          nickname,
          avatar_url: avatarUrl,
          role: "member",
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 6. 현재 활성(계획/진행) 중인 모임 조회
  async getActiveMeeting(roomCode) {
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", roomCode)
      .maybeSingle();

    if (roomError || !room) return null;

    const { data, error } = await supabase
      .from("meetings")
      .select("*")
      .eq("room_id", room.id)
      .neq("status", "completed") // 종료된 건 제외하고 진행/계획 중인 모임만 조회
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // 7. 새 모임 생성
  async createMeeting({ roomCode, title, members }) {
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .select("id")
      .eq("room_code", roomCode)
      .single();

    if (roomError) throw roomError;

    const { data, error } = await supabase
      .from("meetings")
      .insert([
        {
          room_id: room.id,
          title: title,
          status: "planning",
          members: members,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // 8. 모임 정보(이름, 참가 멤버) 수정
  async updateMeeting({ meetingId, title, members }) {
    const { error } = await supabase
      .from("meetings")
      .update({
        title,
        members,
      })
      .eq("id", meetingId);

    if (error) throw error;
    return true;
  },

  // 9. 모임 상태 변경 (계획중 <-> 모임중 토글용)
  async updateMeetingStatus(meetingId, newStatus) {
    const { error } = await supabase
      .from("meetings")
      .update({ status: newStatus })
      .eq("id", meetingId);

    if (error) throw error;
    return true;
  },

  // 10. 모임 종료 ('completed' 상태로 변경)
  async completeMeeting(meetingId) {
    const { error } = await supabase
      .from("meetings")
      .update({ status: "completed" })
      .eq("id", meetingId);

    if (error) throw error;
    return true;
  },

  // 11. 모임 삭제 (취소)
  async deleteMeeting(meetingId) {
    const { error } = await supabase
      .from("meetings")
      .delete()
      .eq("id", meetingId);

    if (error) throw error;
    return true;
  },

  // 모임에 속한 모든 투표 및 하위 옵션 목록 조회
  async getVotesByMeetingId(meetingId) {
    if (!meetingId) return [];

    const { data, error } = await supabase
      .from("polls")
      .select(
        `
        *,
        options:poll_options(*)
      `,
      )
      .eq("meeting_id", meetingId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // 새 투표 생성
  async createVote({
    meetingId,
    type,
    title,
    options = [],
    allowMultiple = true,
    dateRange = null,
  }) {
    // 1. polls 테이블에 투표 기본 정보 삽입
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .insert([
        {
          meeting_id: meetingId,
          type,
          title,
          status: "in_progress",
          allow_multiple: allowMultiple,
          date_range: dateRange,
        },
      ])
      .select()
      .single();

    if (pollError) throw pollError;

    // 2. 일반 투표(메뉴, 장소, 숙소, 기타)인 경우 poll_options에 선택지들 추가
    if (type !== "date" && options.length > 0) {
      const optionRows = options.map((label) => ({
        poll_id: poll.id,
        label,
        voters: [],
      }));

      const { error: optionError } = await supabase
        .from("poll_options")
        .insert(optionRows);

      if (optionError) throw optionError;
    }

    return poll;
  },
  // 현재 접속한 유저의 정보 조회 (Supabase Auth 또는 방 세션 기준)
  async getCurrentMember(roomId) {
    // 1. Supabase Auth 사용자 확인
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      // rooms_members 또는 members 테이블에서 해당 유저의 닉네임 조회
      const { data: member } = await supabase
        .from("room_members") // 프로젝트의 멤버 테이블 이름에 맞춰 확인
        .select("*")
        .eq("room_id", roomId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (member) return member;
      return {
        nickname: user.user_metadata?.nickname || user.email?.split("@")[0],
        user_id: user.id,
      };
    }

    return null;
  },
};
