import { useMemo, useRef, useState } from "react";
import "./App.css";

type Screen = "home" | "setup" | "reveal" | "play" | "vote" | "result" | "gameover";

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

function countAlive(alive: boolean[]) {
  return alive.reduce((acc, v) => acc + (v ? 1 : 0), 0);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  // Setup
  const [players, setPlayers] = useState<string[]>([""]);
  const [impostorsCount, setImpostorsCount] = useState(1);

  // Keep focus in inputs while typing
  const playerInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Game state (persists across rounds)
  const [alive, setAlive] = useState<boolean[]>([]);
  const [impostors, setImpostors] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(1);

  // Round data
  const [secretWord, setSecretWord] = useState<string>("");

  // Reveal flow
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  const [revealPos, setRevealPos] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Vote & result
  const [selectedSuspect, setSelectedSuspect] = useState<number | null>(null);
  const [ejected, setEjected] = useState<number | null>(null);
  const [lastEjectedWasImpostor, setLastEjectedWasImpostor] = useState<boolean | null>(null);

  // Winner
  const [winner, setWinner] = useState<"tripulacion" | "impostores" | null>(null);

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

  const aliveCount = useMemo(() => countAlive(alive), [alive]);

  const aliveImpostorsCount = useMemo(() => {
    let c = 0;
    for (const idx of impostors) if (alive[idx]) c++;
    return c;
  }, [alive, impostors]);

  const aliveCrewCount = useMemo(() => {
    return aliveCount - aliveImpostorsCount;
  }, [aliveCount, aliveImpostorsCount]);

  function setUpNewGame() {
    const p = cleanPlayers;

    // init alive status
    const aliveInit = p.map(() => true);
    setAlive(aliveInit);

    // choose impostors among all players
    const idxs = shuffle(p.map((_, i) => i)).slice(0, impostorsCount);
    setImpostors(new Set(idxs));

    // reset round counter
    setRound(1);

    // reset winner
    setWinner(null);

    // start first round
    startRoundWithState(aliveInit);
  }

  function startRoundWithState(aliveState: boolean[]) {
    // choose new word each round
    const word = pickRandom(wordBank);
    setSecretWord(word);

    // build reveal order only with alive players
    const order = cleanPlayers
      .map((_, i) => i)
      .filter((i) => aliveState[i]);

    setRevealOrder(order);
    setRevealPos(0);
    setIsRevealed(false);

    // reset vote/result
    setSelectedSuspect(null);
    setEjected(null);
    setLastEjectedWasImpostor(null);

    setScreen("reveal");
  }

  function startNextRound() {
    setRound((r) => r + 1);
    // use current alive state
    startRoundWithState(alive);
  }

  function resetAll() {
    setScreen("home");
    setPlayers([""]);
    setImpostorsCount(1);

    setAlive([]);
    setImpostors(new Set());
    setRound(1);
    setSecretWord("");

    setRevealOrder([]);
    setRevealPos(0);
    setIsRevealed(false);

    setSelectedSuspect(null);
    setEjected(null);
    setLastEjectedWasImpostor(null);

    setWinner(null);
  }

  function goToVote() {
    setSelectedSuspect(null);
    setScreen("vote");
  }

  function confirmVote() {
    if (selectedSuspect === null) return;

    // Eject the selected suspect
    const idx = selectedSuspect;
    const wasImpostor = impostors.has(idx);

    setEjected(idx);
    setLastEjectedWasImpostor(wasImpostor);

    const nextAlive = [...alive];
    nextAlive[idx] = false;
    setAlive(nextAlive);

    // Check win conditions AFTER ejection
    const nextAliveCount = countAlive(nextAlive);
    let nextAliveImpostors = 0;
    for (const imp of impostors) if (nextAlive[imp]) nextAliveImpostors++;

    const nextAliveCrew = nextAliveCount - nextAliveImpostors;

    if (nextAliveImpostors <= 0) {
      setWinner("tripulacion");
      setScreen("gameover");
      return;
    }

    if (nextAliveImpostors >= nextAliveCrew) {
      setWinner("impostores");
      setScreen("gameover");
      return;
    }

    // otherwise continue
    setScreen("result");
  }

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

  const alivePlayersList = useMemo(() => {
    return cleanPlayers.map((p, i) => ({ name: p, i, alive: alive[i] ?? false }));
  }, [cleanPlayers, alive]);

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
            <Button
              onClick={() =>
                alert(
                  "Flujo:\n1) Configura jugadores\n2) Reparto (pasar el teléfono)\n3) Discusión\n4) Votación (abierta)\n5) Se expulsa y se evalúa victoria\n6) Si nadie gana, siguiente ronda",
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
            <Button onClick={setUpNewGame} disabled={!canStart}>
              Empezar juego
            </Button>
          </div>
        </Card>
      )}

      {screen === "reveal" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Revelar rol — Ronda {round}</h2>
          <p style={{ margin: "0 0 16px", opacity: 0.85 }}>
            Vivos: <strong>{aliveCount}</strong> (Tripulación {aliveCrewCount} / Impostores{" "}
            {aliveImpostorsCount})
          </p>

          {revealOrder.length > 0 && (
            <>
              <p style={{ margin: "0 0 16px", opacity: 0.85 }}>
                Jugador <strong>{revealPos + 1}</strong> de <strong>{revealOrder.length}</strong>
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
                <div style={{ fontSize: 28, fontWeight: 700 }}>
                  {cleanPlayers[revealOrder[revealPos]]}
                </div>

                <div style={{ height: 12 }} />

                {!isRevealed ? (
                  <Button onClick={() => setIsRevealed(true)}>Tocar para ver mi rol</Button>
                ) : impostors.has(revealOrder[revealPos]) ? (
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
                    if (revealPos + 1 >= revealOrder.length) {
                      setScreen("play");
                    } else {
                      setRevealPos((p) => p + 1);
                      setIsRevealed(false);
                    }
                  }}
                >
                  {revealPos + 1 >= revealOrder.length ? "Empezar discusión" : "Siguiente jugador"}
                </Button>

                <Button
                  onClick={() => {
                    setIsRevealed(false);
                    setScreen("setup");
                  }}
                >
                  Reiniciar juego
                </Button>
              </div>

              <GhostHint>Consejo: no mires la pantalla cuando se lo pasas a otra persona.</GhostHint>
            </>
          )}
        </Card>
      )}

      {screen === "play" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Discusión — Ronda {round}</h2>
          <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
            Hablen por turnos describiendo. Cuando estén listos, vayan a votación.
          </p>

          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: "pointer" }}>Ver vivos</summary>
            <ul>
              {alivePlayersList
                .filter((p) => p.alive)
                .map((p) => (
                  <li key={p.name + p.i}>{p.name}</li>
                ))}
            </ul>
          </details>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={goToVote}>Ir a votación</Button>
            <Button onClick={resetAll}>Salir</Button>
          </div>
        </Card>
      )}

      {screen === "vote" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Votación (abierta)</h2>
          <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
            Elijan a quién expulsar (solo jugadores vivos).
          </p>

          <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
            {alivePlayersList
              .filter((p) => p.alive)
              .map((p) => {
                const selected = selectedSuspect === p.i;
                return (
                  <button
                    key={p.name + p.i}
                    type="button"
                    onClick={() => setSelectedSuspect(p.i)}
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
                    {p.name}
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
        </Card>
      )}

      {screen === "result" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Resultado de votación</h2>

          {ejected !== null && (
            <>
              <p style={{ margin: "0 0 10px", opacity: 0.9 }}>
                Expulsado: <strong>{cleanPlayers[ejected]}</strong>
              </p>
              <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
                {lastEjectedWasImpostor ? "Era IMPOSTOR." : "No era impostor."}
              </p>
            </>
          )}

          <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
            Quedan vivos: <strong>{countAlive(alive)}</strong> (Tripulación {aliveCrewCount} /
            Impostores {aliveImpostorsCount})
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button onClick={startNextRound}>Siguiente ronda</Button>
            <Button onClick={resetAll}>Salir</Button>
          </div>

          <GhostHint>La palabra cambia cada ronda.</GhostHint>
        </Card>
      )}

      {screen === "gameover" && (
        <Card>
          <h2 style={{ margin: "0 0 8px" }}>Fin del juego</h2>

          <div
            style={{
              padding: 12,
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              marginBottom: 14,
            }}
          >
            <div style={{ opacity: 0.8, fontSize: 13 }}>Ganador:</div>
            <div style={{ fontSize: 24, fontWeight: 900 }}>
              {winner === "tripulacion"
                ? "TRIPULACIÓN"
                : winner === "impostores"
                  ? "IMPOSTORES"
                  : "-"}
            </div>
          </div>

          <details style={{ marginBottom: 14 }}>
            <summary style={{ cursor: "pointer" }}>Revelar impostores</summary>
            <ul>
              {cleanPlayers.map((p, i) => (impostors.has(i) ? <li key={p + i}>{p}</li> : null))}
            </ul>
          </details>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button
              onClick={() => {
                // restart with same players & impostor count (new impostors are re-picked)
                setUpNewGame();
              }}
            >
              Jugar otra (mismos nombres)
            </Button>
            <Button onClick={() => setScreen("setup")}>Cambiar configuración</Button>
            <Button onClick={resetAll}>Home</Button>
          </div>
        </Card>
      )}
    </div>
  );
}