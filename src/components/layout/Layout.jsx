// src/components/layout/Layout.jsx
export default function Layout() {
  return (
    <div style={{ display: "flex" }}>
      {/* 1. 항상 고정되는 좌측 사이드바 */}
      <Sidebar />

      {/* 2. URL 경로에 따라 바뀌는 실제 페이지 내용이 꽂히는 구멍(Outlet) */}
      <main>
        <Outlet />
      </main>
    </div>
  );
}
