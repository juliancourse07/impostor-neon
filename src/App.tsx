import "./App.css";

export default function App() {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: 24,
        display: "grid",
        placeItems: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        <h1 style={{ fontSize: 44, margin: "0 0 8px" }}>impostor-neon</h1>

        <p style={{ opacity: 0.85, margin: "0 0 24px" }}>
          Juego party tipo impostor (PWA) en español, pasando el teléfono, estilo
          neón.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button">Crear partida</button>
          <button type="button">Unirme</button>
          <button type="button">Cómo jugar</button>
        </div>

        <p style={{ opacity: 0.65, marginTop: 18, fontSize: 14 }}>
          Tip: para publicar cambios en tu web, haz <code>npm run deploy</code>.
        </p>
      </div>
    </div>
  );
}