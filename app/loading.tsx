export default function Loading() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(2, 6, 23, 0.35)",
        display: "grid",
        placeItems: "center",
        zIndex: 9999
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 14,
          padding: "18px 22px",
          border: "1px solid rgba(209, 213, 219, 1)",
          boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: 12
        }}
      >
        <div
          aria-hidden
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            border: "3px solid rgba(12,61,122,0.25)",
            borderTopColor: "rgba(12,61,122,1)",
            animation: "spin 0.9s linear infinite"
          }}
        />
        <div style={{ fontWeight: 800, color: "#0c3d7a" }}>CARGANDO…</div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }`}</style>
    </div>
  );
}

