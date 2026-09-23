import { useState, useEffect } from "react";
import { roomService } from "../services/roomService";

export function useRoom(roomId) {
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("👉 useRoom으로 전달된 roomId:", roomId);

    if (!roomId) {
      console.warn(
        "⚠️ roomId가 없습니다. 라우터의 path 파라미터 이름을 확인하세요.",
      );
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function fetchRoom() {
      try {
        setLoading(true);
        const data = await roomService.getRoomByCode(roomId);
        console.log("👉 Supabase에서 받아온 방 데이터:", data);

        if (isMounted) {
          setRoom(data);
          setError(null);
        }
      } catch (err) {
        console.error("❌ 방 조회 실패 에러:", err);
        if (isMounted) setError(err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchRoom();

    return () => {
      isMounted = false;
    };
  }, [roomId]);

  return { room, loading, error };
}
