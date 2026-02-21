import { useMemo, useRef, useState } from "react";
import "./App.css";

type Screen = "home" | "setup" | "reveal" | "play" | "vote" | "result";

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  // Setup
  const [players, setPlayers] = useState<string[]>([""]);
  const [impostorsCount, setImpostorsCount] = useState(1);

  // Keep focus in inputs while typing
  const playerInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Round data
  const [secretWord, setSecretWord] = useState<string>("");
  const [impostors, setImpostors] = useState<Set<number>>(new Set());

  // Reveal flow
  const [revealIndex, setRevealIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Vote & result
  const [selectedSuspect, setSelectedSuspect] = useState<number | null>(null);
  const [ejected, setEjected] = useState<number | null>(null);

  const cleanPlayers = useMemo(
    () => players.map((p) => p.trim()).filter(Boolean),
    [players],
  );

  const canStart =
    cleanPlayers.length >= 3 &&
    impostorsCount >= 1 &&
    impostorsCount < cleanPlayers.length;

  const wordBank = [
    "PIZZA",
    "HOSPITAL",
    "PLAYA",
    "ESCUELA",
    "AEROPUERTO",
    "CINE",
    "BIBLIOTECA",
    "GIMNASIO",
    "SUPERMERCADO",
    "RESTAURANTE",
  ];

  function startRound() {
    const p = cleanPlayers;
    const word = pickRandom(wordBank);

    // choose impostors
    const idxs = shuffle(p.map((_, i) => i)).slice(0, impostorsCount);
    setSecretWord(word);
    setImpostors(new Set(idxs));

    // reset reveal
    setRevealIndex(0);
    setIsRevealed(false);

    // reset vote/result
    setSelectedSuspect(null);
    setEjected(null);

    setScreen("reveal");
  }

  function goToVote() {
    setSelectedSuspect(null);
    setScreen("vote");
  }

  function confirmVote() {
    if (selectedSuspect === null) return;
    setEjected(selectedSuspect);
    setScreen("result");
  }

  function playAgainSamePlayers() {
    // keep same players & impostor count; just re-roll word + impostors
    startRound();
  }

  function resetAll() {
    setScreen("home");
    setPlayers([""]);
    setImpostorsCount(1);
    setSecretWord("");
    setImpostors(new Set());
    setRevealIndex(0);
    setIsRevealed(false);
    setSelectedSuspect(null);
    setEjected(null);
  }

  const outcome = useMemo(() => {
    if (ejected === null) return null;
    const ejectedWasImpostor = impostors.has(ejected);
    // Simple rule: if ejected is impostor => crew wins, else impostors win
    return ejectedWasImpostor ? "tripulacion" : "impostores";
  }, [ejected, impostors]);

  // ---------- UI helpers ----------
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div
      style={{
        width: "100%",
        maxWidth: 720,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 18,
      }}
    >
      {children}
    </div>
  );

  const Button = (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button
      {...props}
      style={{
        padding: "10px 14px",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.14)",
        background: "rgba(0,0,0,0.35)",
        color: "inherit",
        cursor: props.disabled ? "not-allowed" : "pointer",
        opacity: props.disabled ? 0.5 : 1,
      }}
    />
  );

  const GhostHint = ({ children }: { children: React.ReactNode }) => (
    <p style={{ marginTop: 12, opacity: 0.6, fontSize: 13 }}>{children}</p>
  );

  return (
    <div style={{ minHeight: "100vh", padding: 22, display: "grid", placeItems: "center" }}>
      {screen === "home" && (
        <Card>
          <h1 style={{ fontSize: 44, margin: "0 0 6px" }}>impostor-neon</h1>
          <p style={{ opacity: 0.85, margin: "0 0 18px" }}>
            Modo 1 dispositivo: se pasan el teléfono para revelar su rol.
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => setScreen("setup")}>Crear partida</Button>
            <Button disabled title="En modo 1 dispositivo no hace falta.">
              Unirme
            </Button>
            <Button
              onClick={() =>
                alert(
                  "1) Agreguen jugadores\n2) Iniciar reparto\n3) Pasen el teléfono: cada jugador revela su rol\n4) Discusión\n5) Votación abierta\n6) Resultado",
                )
              }
            >
              Cómo jugar
            </Button>
          </div>
        </Card>
      )}

      {screen === "setup" && (
        <Card>
          <h2 style={{ margin: "0 0 10px" }}>Configurar partida</h2>

          <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>
            Jugadores (mínimo 3)
          </label>

          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            {players.map((value, i) => (
              <div key={i} style={{ display: "flex", gap: 8 }}>
                <input
                  ref={(el) => {
                    playerInputRefs.current[i] = el;
                  }}
                  value={value}
                  onChange={(e) => {
                    const next = [...players];
                    next[i] = e.target.value;
                    setPlayers(next);
                    queueMicrotask(() => playerInputRefs.current[i]?.focus());
                  }}
                  placeholder={`Jugador ${i + 1}`}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.14)",
                    background: "rgba(0,0,0,0.25)",
                    color: "inherit",
                  }}
                />
                <Button
                  type="button"
                  onClick={() => setPlayers((p) => p.filter((_, idx) => idx !== i))}
                  disabled={players.length <= 1}
                  title="Eliminar"
                >
                  ✕
                </Button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
            <Button type="button" onClick={() => setPlayers((p) => [...p, ""])}>
              + Agregar jugador
            </Button>
            <Button type="button" onClick={() => setPlayers(["", "", ""])}>
              Plantilla 3
            </Button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span style={{ opacity: 0.9 }}>Impostores:</span>
            <Button type="button" onClick={() => setImpostorsCount((n) => Math.max(1, n - 1))}>
              -
            </Button>
            <strong>{impostorsCount}</strong>
            <Button
              type="button"
              onClick={() => setImpostorsCount((n) => Math.min(cleanPlayers.length - 1, n + 1))}
              disabled={cleanPlayers.length <= 1}
            >
              +
            </Button>
          </div>

          {!canStart && (
            <p style={{ margin: "0 0 12px", color: "#ffd6a5", opacity: 0.95 }}>
              Agrega al menos 3 nombres y asegúrate de que los impostores sean menos que los
              jugadores.
            </p>
          )}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => setScreen("home")}>Volver</Button>
            <Button onClick={startRound} disabled={!canStart}>
              Iniciar reparto (pasar el teléfono)
            </Button>
          </div>
        </Card>
      )}

      {screen === "reveal" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Revelar rol</h2>
          <p style={{ margin: "0 0 16px", opacity: 0.85 }}>
            Jugador <strong>{revealIndex + 1}</strong> de <strong>{cleanPlayers.length}</strong>
          </p>

          <div
            style={{
              padding: 16,
              borderRadius: 16,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 18, opacity: 0.9, marginBottom: 8 }}>
              Pásale el teléfono a:
            </div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{cleanPlayers[revealIndex]}</div>

            <div style={{ height: 12 }} />

            {!isRevealed ? (
              <Button onClick={() => setIsRevealed(true)}>Tocar para ver mi rol</Button>
            ) : impostors.has(revealIndex) ? (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 14, opacity: 0.8 }}>Tu rol es:</div>
                <div style={{ fontSize: 34, fontWeight: 800 }}>IMPOSTOR</div>
                <div style={{ opacity: 0.8, marginTop: 6 }}>
                  Finge que sabes la palabra. Escucha y no te delates.
                </div>
              </div>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 14, opacity: 0.8 }}>La palabra es:</div>
                <div style={{ fontSize: 34, fontWeight: 800 }}>{secretWord}</div>
                <div style={{ opacity: 0.8, marginTop: 6 }}>
                  Describe sin decir la palabra. Encuentren al impostor.
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              onClick={() => {
                if (revealIndex + 1 >= cleanPlayers.length) {
                  setScreen("play");
                } else {
                  setRevealIndex((i) => i + 1);
                  setIsRevealed(false);
                }
              }}
            >
              {revealIndex + 1 >= cleanPlayers.length ? "Empezar discusión" : "Siguiente jugador"}
            </Button>

            <Button
              onClick={() => {
                setIsRevealed(false);
                setScreen("setup");
              }}
            >
              Volver a configuración
            </Button>
          </div>

          <GhostHint>Consejo: no mires la pantalla cuando se lo pasas a otra persona.</GhostHint>
        </Card>
      )}

      {screen === "play" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Discusión</h2>
          <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
            Hablen por turnos describiendo. Cuando estén listos, vayan a votación.
          </p>

          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: "pointer" }}>Ver jugadores</summary>
            <ul>
              {cleanPlayers.map((p, i) => (
                <li key={p + i}>{p}</li>
              ))}
            </ul>
          </details>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={goToVote}>Ir a votación</Button>
            <Button onClick={() => setScreen("setup")}>Nueva ronda (reconfigurar)</Button>
            <Button onClick={resetAll}>Salir</Button>
          </div>

          <GhostHint>
            (Luego podemos agregar temporizador y botón “Revelar palabra” para el final.)
          </GhostHint>
        </Card>
      )}

      {screen === "vote" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Votación (abierta)</h2>
          <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
            Elijan a quién expulsar. Luego confirmen el voto.
          </p>

          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            {cleanPlayers.map((p, i) => {
              const selected = selectedSuspect === i;
              return (
                <button
                  key={p + i}
                  type="button"
                  onClick={() => setSelectedSuspect(i)}
                  style={{
                    textAlign: "left",
                    padding: "12px 14px",
                    borderRadius: 14,
                    border: selected
                      ? "1px solid rgba(255,255,255,0.38)"
                      : "1px solid rgba(255,255,255,0.14)",
                    background: selected ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.25)",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {p}
                  {selected ? "  ✓" : ""}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={() => setScreen("play")}>Volver a discusión</Button>
            <Button onClick={confirmVote} disabled={selectedSuspect === null}>
              Confirmar expulsión
            </Button>
          </div>

          <GhostHint>Esto es votación abierta: todos ven la pantalla.</GhostHint>
        </Card>
      )}

      {screen === "result" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Resultado</h2>

          {ejected !== null && (
            <>
              <p style={{ margin: "0 0 10px", opacity: 0.9 }}>
                Expulsado: <strong>{cleanPlayers[ejected]}</strong>
              </p>

              <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
                {impostors.has(ejected)
                  ? "Era IMPOSTOR."
                  : "No era impostor."}
              </p>
            </>
          )}

          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: "pointer" }}>Revelar impostores</summary>
            <ul>
              {cleanPlayers.map((p, i) => (impostors.has(i) ? <li key={p + i}>{p}</li> : null))}
            </ul>
          </details>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              marginBottom: 14,
            }}
          >
            <div style={{ opacity: 0.8, fontSize: 13 }}>Ganador (regla simple):</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {outcome === "tripulacion"
                ? "TRIPULACIÓN"
                : outcome === "impostores"
                  ? "IMPOSTORES"
                  : "-"}
            </div>
            <div style={{ opacity: 0.65, fontSize: 13, marginTop: 6 }}>
              Regla actual: si expulsan a un impostor gana la tripulación, si no, ganan los
              impostores. (Luego la hacemos más pro.)
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={playAgainSamePlayers}>Jugar otra (mismos jugadores)</Button>
            <Button onClick={() => setScreen("setup")}>Cambiar jugadores</Button>
            <Button onClick={resetAll}>Home</Button>
          </div>
        </Card>
      )}
    </div>
  );
}