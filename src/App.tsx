import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

type Screen = "home" | "setup" | "reveal" | "play" | "vote" | "result" | "gameover";

type WordPackKey =
  | "lugares"
  | "comida"
  | "objetos"
  | "profesiones"
  | "fiesta"
  | "citas"
  | "internet"
  | "trabajo"
  | "viajes"
  | "deportes"
  | "musica"
  | "cine_series";

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

function formatMMSS(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

async function playAlarm() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.06;
  master.connect(ctx.destination);

  const beep = (t: number, freq: number, dur: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(gain);
    gain.connect(master);

    osc.start(t);
    osc.stop(t + dur + 0.02);
  };

  beep(now + 0.0, 880, 0.18);
  beep(now + 0.25, 988, 0.18);
  beep(now + 0.5, 1108, 0.22);

  setTimeout(() => ctx.close().catch(() => {}), 1200);
}

async function playTick() {
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  const ctx = new AudioCtx();
  const now = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = 0.03;
  master.connect(ctx.destination);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "square";
  osc.frequency.value = 1200;

  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(1, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

  osc.connect(gain);
  gain.connect(master);

  osc.start(now);
  osc.stop(now + 0.07);

  setTimeout(() => ctx.close().catch(() => {}), 200);
}

// --- Word packs (categories) ---
const WORD_PACKS: Record<WordPackKey, { label: string; words: string[] }> = {
  lugares: {
    label: "Lugares",
    words: [
      "PLAYA",
      "HOSPITAL",
      "ESCUELA",
      "AEROPUERTO",
      "CINE",
      "BIBLIOTECA",
      "GIMNASIO",
      "SUPERMERCADO",
      "RESTAURANTE",
      "HOTEL",
      "PARQUE",
      "IGLESIA",
      "MUSEO",
      "ESTADIO",
      "GASOLINERA",
      "METRO",
      "ZOO",
      "TEATRO",
      "BAR",
      "DISCOTECA",
      "CAFETERIA",
      "UNIVERSIDAD",
      "OFICINA",
    ],
  },

  comida: {
    label: "Comida",
    words: [
      "PIZZA",
      "HAMBURGUESA",
      "SUSHI",
      "TACOS",
      "AREPA",
      "PASTA",
      "ENSALADA",
      "HELADO",
      "CHOCOLATE",
      "EMPANADA",
      "PAN",
      "ARROZ",
      "POLLO",
      "SOPA",
      "CAFÉ",
      "JUGO",
      "CERVEZA",
      "VINO",
      "TEQUILA",
      "AGUARDIENTE",
    ],
  },

  objetos: {
    label: "Objetos",
    words: [
      "CELULAR",
      "TECLADO",
      "AUDIFONOS",
      "MOCHILA",
      "LAPIZ",
      "CUADERNO",
      "RELOJ",
      "GAFAS",
      "LLAVES",
      "BOTELLA",
      "CONTROL",
      "CAMARA",
      "SILLA",
      "ESPEJO",
      "PARAGUAS",
      "CARGADOR",
      "ANILLO",
      "MAQUILLAJE",
      "PERFUME",
      "MALETA",
    ],
  },

  profesiones: {
    label: "Profesiones",
    words: [
      "DOCTOR",
      "ENFERMERA",
      "PROFESOR",
      "POLICIA",
      "BOMBERO",
      "CHEF",
      "PILOTO",
      "ABOGADO",
      "INGENIERO",
      "DENTISTA",
      "VETERINARIO",
      "ARQUITECTO",
      "PROGRAMADOR",
      "DISEÑADOR",
      "MUSICO",
      "PSICOLOGO",
      "PERIODISTA",
      "FOTOGRAFO",
      "BARBERO",
      "EMPRENDEDOR",
    ],
  },

  // ---- FUN PACKS (20-35) ----
  fiesta: {
    label: "Fiesta",
    words: [
      "SHOT",
      "BRINDIS",
      "KARAOKE",
      "DJ",
      "COPA",
      "CERVEZA",
      "VINO",
      "COCTEL",
      "AMIGOS",
      "AFTER",
      "BAILE",
      "REGGAETON",
      "ELECTRONICA",
      "DISFRAZ",
      "CUMPLEAÑOS",
      "CONFETI",
      "RESACA",
      "FIESTA SORPRESA",
    ],
  },

  citas: {
    label: "Citas",
    words: [
      "PRIMERA CITA",
      "MATCH",
      "GHOSTING",
      "RED FLAG",
      "GREEN FLAG",
      "COMPLIMENTO",
      "FLORES",
      "CENA",
      "BESO",
      "FRIENDZONE",
      "PLAN TRANQUI",
      "PLAN IMPROVISADO",
      "RELACION",
      "EX",
      "CELOS",
      "STALK",
    ],
  },

  internet: {
    label: "Internet",
    words: [
      "MEME",
      "VIRAL",
      "TIKTOK",
      "INSTAGRAM",
      "TWITTER",
      "STREAM",
      "CHAT",
      "LIKE",
      "FOLLOW",
      "HATER",
      "INFLUENCER",
      "PODCAST",
      "SPOILER",
      "CAPTURA",
      "WIFI",
      "CRINGE",
      "BAIT",
    ],
  },

  trabajo: {
    label: "Trabajo",
    words: [
      "REUNION",
      "JUNTA",
      "PRESENTACION",
      "JEFE",
      "OFICINA",
      "TELETRABAJO",
      "HOME OFFICE",
      "EXCEL",
      "CORREO",
      "LLAMADA",
      "HORAS EXTRA",
      "SALARIO",
      "RENUNCIA",
      "VACACIONES",
      "BURNOUT",
      "CAFÉ",
    ],
  },

  viajes: {
    label: "Viajes",
    words: [
      "AEROPUERTO",
      "MALETA",
      "PASAPORTE",
      "HOTEL",
      "HOSTAL",
      "MAPA",
      "TOUR",
      "PLAYA",
      "MONTAÑA",
      "MUSEO",
      "FOTO",
      "SOUVENIR",
      "AVION",
      "TREN",
      "UBER",
      "RESERVA",
    ],
  },

  deportes: {
    label: "Deportes",
    words: [
      "FUTBOL",
      "BASKET",
      "TENIS",
      "CICLISMO",
      "GIMNASIO",
      "PESAS",
      "CARDIO",
      "ENTRENADOR",
      "PARTIDO",
      "FINAL",
      "GOL",
      "EQUIPO",
      "CAMISETA",
      "MARATON",
      "YOGA",
      "PILATES",
    ],
  },

  musica: {
    label: "Música",
    words: [
      "CONCIERTO",
      "FESTIVAL",
      "PLAYLIST",
      "SPOTIFY",
      "AURICULARES",
      "GUITARRA",
      "PIANO",
      "BATERIA",
      "CANTANTE",
      "BANDA",
      "ALBUM",
      "CORO",
      "RITMO",
      "LETRA",
      "MELODIA",
      "AUTO-TUNE",
    ],
  },

  cine_series: {
    label: "Cine/Series",
    words: [
      "NETFLIX",
      "CINE",
      "SERIE",
      "TEMPORADA",
      "FINAL",
      "SPOILER",
      "TRAILER",
      "ACTOR",
      "ACTRIZ",
      "DIRECTOR",
      "POPCORN",
      "MARATON",
      "CAPITULO",
      "VILLANO",
      "HEROE",
      "ESCENA POST-CREDITOS",
    ],
  },
};

const PACK_KEYS: WordPackKey[] = [
  "lugares",
  "comida",
  "objetos",
  "profesiones",
  "fiesta",
  "citas",
  "internet",
  "trabajo",
  "viajes",
  "deportes",
  "musica",
  "cine_series",
];

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  // Setup
  const [players, setPlayers] = useState<string[]>([""]);
  const [impostorsCount, setImpostorsCount] = useState(1);

  // Pack selection
  const [pack, setPack] = useState<WordPackKey>("lugares");

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

  // Discussion timer
  const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;
  const [discussionDuration, setDiscussionDuration] = useState<(typeof DURATION_OPTIONS)[number]>(
    90,
  );
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const alarmedRef = useRef(false);
  const lastTickedRef = useRef<number | null>(null);

  const cleanPlayers = useMemo(
    () => players.map((p) => p.trim()).filter(Boolean),
    [players],
  );

  const canStart =
    cleanPlayers.length >= 3 &&
    impostorsCount >= 1 &&
    impostorsCount < cleanPlayers.length;

  const aliveCount = useMemo(() => countAlive(alive), [alive]);

  const aliveImpostorsCount = useMemo(() => {
    let c = 0;
    for (const idx of impostors) if (alive[idx]) c++;
    return c;
  }, [alive, impostors]);

  const aliveCrewCount = useMemo(() => {
    return aliveCount - aliveImpostorsCount;
  }, [aliveCount, aliveImpostorsCount]);

  const packInfo = WORD_PACKS[pack];
  const packCount = packInfo.words.length;

  function setUpNewGame() {
    const p = cleanPlayers;

    const aliveInit = p.map(() => true);
    setAlive(aliveInit);

    const idxs = shuffle(p.map((_, i) => i)).slice(0, impostorsCount);
    setImpostors(new Set(idxs));

    setRound(1);
    setWinner(null);

    startRoundWithState(aliveInit);
  }

  function startRoundWithState(aliveState: boolean[]) {
    const word = pickRandom(WORD_PACKS[pack].words);
    setSecretWord(word);

    const order = cleanPlayers
      .map((_, i) => i)
      .filter((i) => aliveState[i]);

    setRevealOrder(order);
    setRevealPos(0);
    setIsRevealed(false);

    setSelectedSuspect(null);
    setEjected(null);
    setLastEjectedWasImpostor(null);

    setTimeLeft(discussionDuration);
    setTimerRunning(false);
    alarmedRef.current = false;
    lastTickedRef.current = null;

    setScreen("reveal");
  }

  function startNextRound() {
    setRound((r) => r + 1);
    startRoundWithState(alive);
  }

  function resetAll() {
    setScreen("home");
    setPlayers([""]);
    setImpostorsCount(1);
    setPack("lugares");

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

    setDiscussionDuration(90);
    setTimeLeft(90);
    setTimerRunning(false);
    alarmedRef.current = false;
    lastTickedRef.current = null;
  }

  function goToVote() {
    setSelectedSuspect(null);
    setTimerRunning(false);
    setScreen("vote");
  }

  function confirmVote() {
    if (selectedSuspect === null) return;

    const idx = selectedSuspect;
    const wasImpostor = impostors.has(idx);

    setEjected(idx);
    setLastEjectedWasImpostor(wasImpostor);

    const nextAlive = [...alive];
    nextAlive[idx] = false;
    setAlive(nextAlive);

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

    setScreen("result");
  }

  // Timer tick effect (only active on play screen and when running)
  useEffect(() => {
    if (screen !== "play") return;
    if (!timerRunning) return;

    const id = window.setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);

    return () => window.clearInterval(id);
  }, [screen, timerRunning]);

  // Tick in last 10 seconds
  useEffect(() => {
    if (screen !== "play") return;
    if (!timerRunning) return;

    if (timeLeft <= 10 && timeLeft >= 1) {
      if (lastTickedRef.current !== timeLeft) {
        lastTickedRef.current = timeLeft;
        playTick().catch(() => {});
        try {
          navigator.vibrate?.(20);
        } catch {
          // ignore
        }
      }
    }
  }, [screen, timerRunning, timeLeft]);

  // Alarm effect when time reaches 0
  useEffect(() => {
    if (screen !== "play") return;
    if (timeLeft !== 0) return;
    if (alarmedRef.current) return;

    alarmedRef.current = true;
    setTimerRunning(false);

    try {
      navigator.vibrate?.([120, 80, 120, 80, 240]);
    } catch {
      // ignore
    }

    playAlarm().catch(() => {});
  }, [screen, timeLeft]);

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

  const progress = useMemo(() => {
    const total = discussionDuration;
    if (total <= 0) return 0;
    return Math.max(0, Math.min(1, timeLeft / total));
  }, [discussionDuration, timeLeft]);

  const urgent = timeLeft <= 10 && timeLeft > 0;

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
                  "Flujo:\n1) Configura jugadores\n2) Elige categoría de palabras\n3) Reparto\n4) Discusión con temporizador\n5) Votación\n6) Rondas hasta que alguien gane",
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

          <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>
            Categoría de palabras
          </label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {PACK_KEYS.map((k) => {
              const selected = pack === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPack(k)}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: selected
                      ? "1px solid rgba(255,255,255,0.38)"
                      : "1px solid rgba(255,255,255,0.14)",
                    background: selected ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.25)",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {WORD_PACKS[k].label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPack(pickRandom(PACK_KEYS))}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "inherit",
                cursor: "pointer",
              }}
              title="Elegir una categoría al azar"
            >
              Random
            </button>
          </div>

          <div style={{ opacity: 0.8, marginBottom: 14, fontSize: 13 }}>
            Pack seleccionado: <strong>{packInfo.label}</strong> — {packCount} palabras
          </div>

          <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>
            Temporizador de discusión
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            {DURATION_OPTIONS.map((sec) => {
              const selected = discussionDuration === sec;
              return (
                <button
                  key={sec}
                  type="button"
                  onClick={() => {
                    setDiscussionDuration(sec);
                    setTimeLeft(sec);
                    setTimerRunning(false);
                    alarmedRef.current = false;
                    lastTickedRef.current = null;
                  }}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: selected
                      ? "1px solid rgba(255,255,255,0.38)"
                      : "1px solid rgba(255,255,255,0.14)",
                    background: selected ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.25)",
                    color: "inherit",
                    cursor: "pointer",
                  }}
                >
                  {sec >= 60 ? `${Math.round(sec / 60)} min` : `${sec}s`}
                </button>
              );
            })}
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
          <p style={{ margin: "0 0 10px", opacity: 0.85 }}>
            Categoría: <strong>{packInfo.label}</strong>
          </p>
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
                      setTimerRunning(true);
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

          <div style={{ marginBottom: 10, opacity: 0.85 }}>
            Categoría: <strong>{packInfo.label}</strong>
          </div>

          <div
            style={{
              padding: 14,
              borderRadius: 16,
              border: urgent
                ? "1px solid rgba(255, 70, 70, 0.45)"
                : "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Tiempo</div>
                <div style={{ fontSize: 34, fontWeight: 900, color: urgent ? "#ff6b6b" : "white" }}>
                  {formatMMSS(timeLeft)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Button onClick={() => setTimerRunning((r) => !r)}>
                  {timerRunning ? "Pausar" : "Reanudar"}
                </Button>
                <Button
                  onClick={() => {
                    setTimeLeft(discussionDuration);
                    setTimerRunning(false);
                    alarmedRef.current = false;
                    lastTickedRef.current = null;
                  }}
                >
                  Reiniciar
                </Button>
              </div>
            </div>

            <div style={{ height: 10 }} />

            <div
              style={{
                height: 10,
                borderRadius: 999,
                background: "rgba(255,255,255,0.10)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${Math.round(progress * 100)}%`,
                  background: urgent ? "rgba(255, 70, 70, 0.85)" : "rgba(120, 220, 255, 0.75)",
                  transition: "width 0.35s linear",
                }}
              />
            </div>

            <GhostHint>Últimos 10s hacen tick + vibración cortica.</GhostHint>
          </div>

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
            <Button onClick={setUpNewGame}>Jugar otra (mismos nombres)</Button>
            <Button onClick={() => setScreen("setup")}>Cambiar configuración</Button>
            <Button onClick={resetAll}>Home</Button>
          </div>
        </Card>
      )}
    </div>
  );
}