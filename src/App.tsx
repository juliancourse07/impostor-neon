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
  | "cine_series"
  | "mono_bandido";

type BandidoIntensity = "suave" | "medio" | "salvaje";

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

  mono_bandido: {
    label: "Mono Bandido (Party)",
    words: [
      "BAILE PROHIBIDO",
      "VERDAD INCÓMODA",
      "RISAS NERVIOSAS",
      "AMIGO TOXICO",
      "SUEÑO RARO",
      "ANÉCDOTA PENOSA",
      "APODO SECRETO",
      "BEBIDA FAVORITA",
      "CRUSH IMPOSIBLE",
      "PLAN IMPROVISADO",
      "CHAT FILTRADO",
      "CITA DESASTRE",
      "FIESTA INOLVIDABLE",
      "DRAMA",
      "AMOR ODIO",
      "EL GRUPO DE WHATSAPP",
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
  "mono_bandido",
];

type BandidoEvent = { title: string; rule: string };
type BandidoPunishment = { title: string; text: string };

const BANDIDO_EVENTS: BandidoEvent[] = [
  { title: "Regla Prohibida", rule: "No puedes decir: 'yo', 'sí', 'no'." },
  { title: "Ronda Susurro", rule: "Todos hablan en voz bajita (si gritas, quedas sospechoso)." },
  { title: "Una Palabra", rule: "En tu turno solo puedes decir 1 palabra. El grupo interpreta." },
  { title: "Pista Doble", rule: "Cada quien da 2 pistas: 1 real y 1 falsa (sin decir cuál)." },
  { title: "Modo Actor", rule: "Describe como si estuvieras actuando en una novela." },
  { title: "Modo Noticiero", rule: "Describe como presentador de noticias serias." },
  { title: "Cambio de Silla", rule: "Antes de hablar, cambien de puesto 1 vez (caos controlado)." },
];

const PUNISHMENTS_SUAVE: BandidoPunishment[] = [
  { title: "Acento", text: "Habla con acento inventado hasta la próxima ronda." },
  { title: "Historia Flash", text: "Cuenta una mini-anécdota (10s) sin reírte." },
  { title: "Pose", text: "Haz una pose épica 5s. Foto opcional." },
  { title: "Regla Personal", text: "En la próxima ronda no puedes usar la palabra 'literal'." },
];

const PUNISHMENTS_MEDIO: BandidoPunishment[] = [
  { title: "Karaoke 10s", text: "Canta 10 segundos de cualquier canción." },
  { title: "Freestyle", text: "Improvisa 8 segundos de rap sobre 'trabajo y café'." },
  { title: "Imitación", text: "Imita a alguien del grupo 10 segundos (sin ofender)." },
  { title: "Verdad", text: "Responde: ¿Cuál fue tu peor oso social? (respuesta corta)." },
];

const PUNISHMENTS_SALVAJE: BandidoPunishment[] = [
  { title: "PERREO 15s", text: "Baila 15s. (Perreo permitido si el grupo quiere)." },
  { title: "CHUPA UNA PARTE DEL CUERPO DEL QUE ELIJAN LOS WINNERS 15s", text: "Lame algo no seas perra." },
  { title: "PELA ESAS NALGAS NEN@", text: "Pelalo y daja que lo toquen 2 ganadores'." },
  { title: "GIME SI ERES PERRA O SEDUCE A UNA NENA PUTO", text: "Hazlo durante 10 segundos cachond@ (sin insultar)." },
  { title: "CUENTA UNA HISTORIA OBSENA Y NO MIENTAS GAY", text: "Reto: 25 segundos sin reír. Si fallas, repites 10s." },
  { title: "MUESTRALE UNA PARTE INTIMA A ALGUNO DE LOS WINNER", text: "Si se ponen pendejos y todos quieren ver morbosos hagan un sorteo." },
  { title: "BESA A ALGUIEN DE OTRO SEXO AQUI NO APOYAMOS LAS LOCAS", text: "Besa a alguien de sexo opuesto, al que digan los Winners." },
  { title: "SHOT POR HOMOSEXUAL", text: "Toma un shot sin hacer caras o repite mkon." },
  { title: "VERDAD POTENTE", text: "Responde: ¿Te gusta alguien del grupo? (corto)." },
  { title: "RECREA TU POSE SEXUAL FAVORITA CON ALGUIEN DEL GRUPO", text: "Lucete y muestra tus trucos." },
];

function pickPunishment(intensity: BandidoIntensity) {
  const list =
    intensity === "suave"
      ? PUNISHMENTS_SUAVE
      : intensity === "medio"
        ? PUNISHMENTS_MEDIO
        : PUNISHMENTS_SALVAJE;
  return pickRandom(list);
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("home");

  // Setup
  const [players, setPlayers] = useState<string[]>([""]);
  const [impostorsCount, setImpostorsCount] = useState(1);
  const [pack, setPack] = useState<WordPackKey>("lugares");

  // Toggles
  const [eventsEnabled, setEventsEnabled] = useState(true);
  const [monoBandidoEnabled, setMonoBandidoEnabled] = useState(false);
  const [bandidoIntensity, setBandidoIntensity] = useState<BandidoIntensity>("medio");

  // How-to modal
  const [howToOpen, setHowToOpen] = useState(false);

  // ✅ Theme: activate "Mono Bandido" club-neon look by toggling a body class
  useEffect(() => {
    document.body.classList.toggle("mono-bandido", monoBandidoEnabled);
    return () => document.body.classList.remove("mono-bandido");
  }, [monoBandidoEnabled]);

  // Interactive background (mouse spotlight) via CSS vars
  useEffect(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) return;

    const setVars = (x: number, y: number) => {
      const mx = Math.round((x / window.innerWidth) * 1000) / 1000;
      const my = Math.round((y / window.innerHeight) * 1000) / 1000;
      document.documentElement.style.setProperty("--mx", String(mx));
      document.documentElement.style.setProperty("--my", String(my));
    };

    // default center
    setVars(window.innerWidth / 2, window.innerHeight / 2);

    const onMove = (e: PointerEvent) => setVars(e.clientX, e.clientY);
    window.addEventListener("pointermove", onMove, { passive: true });

    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // If game ends, show result first (so penalty shows), then allow "Ver ganador"
  const [pendingGameOver, setPendingGameOver] = useState<
    "tripulacion" | "impostores" | null
  >(null);

  // Voting (per-player)
  const [voteCounts, setVoteCounts] = useState<number[]>([]);
  const [firstVoterFor, setFirstVoterFor] = useState<Record<number, number>>({});
  const [voterTurn, setVoterTurn] = useState(0);

  // Penalty payer (Mono Bandido)
  const [penaltyPayer, setPenaltyPayer] = useState<number | null>(null);
  const [penaltyReason, setPenaltyReason] = useState<string>("");

  // Keep focus in inputs while typing
  const playerInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  // Game state
  const [alive, setAlive] = useState<boolean[]>([]);
  const [impostors, setImpostors] = useState<Set<number>>(new Set());
  const [round, setRound] = useState(1);

  // Round data
  const [secretWord, setSecretWord] = useState<string>("");

  // Bandido spice
  const [roundEvent, setRoundEvent] = useState<BandidoEvent | null>(null);
  const [roundPunishment, setRoundPunishment] = useState<BandidoPunishment | null>(null);
  const [punishmentRerolled, setPunishmentRerolled] = useState(false);

  // Reveal flow
  const [revealOrder, setRevealOrder] = useState<number[]>([]);
  const [revealPos, setRevealPos] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);

  // Result
  const [ejected, setEjected] = useState<number | null>(null);
  const [lastEjectedWasImpostor, setLastEjectedWasImpostor] = useState<boolean | null>(
    null,
  );

  // Winner
  const [winner, setWinner] = useState<"tripulacion" | "impostores" | null>(null);

  // Discussion timer
  const DURATION_OPTIONS = [30, 60, 90, 120, 180] as const;
  const [discussionDuration, setDiscussionDuration] = useState<
    (typeof DURATION_OPTIONS)[number]
  >(90);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [timerRunning, setTimerRunning] = useState(false);
  const alarmedRef = useRef(false);
  const lastTickedRef = useRef<number | null>(null);

  // --- Home laugh sound (manual toggle; browsers require user interaction) ---
  const laughRef = useRef<HTMLAudioElement | null>(null);
  const [laughOn, setLaughOn] = useState(false);

  useEffect(() => {
    if (!laughRef.current) {
      const a = new Audio(`${import.meta.env.BASE_URL}sensual-laugh.mp3`);
      a.loop = true;
      a.volume = 0.45;
      laughRef.current = a;
    }

    return () => {
      if (laughRef.current) {
        laughRef.current.pause();
        laughRef.current.currentTime = 0;
      }
    };
  }, []);

  useEffect(() => {
    if (screen !== "home" && laughRef.current) {
      laughRef.current.pause();
      laughRef.current.currentTime = 0;
      setLaughOn(false);
    }
  }, [screen]);

  const toggleLaugh = async () => {
    const a = laughRef.current;
    if (!a) return;

    try {
      if (laughOn) {
        a.pause();
        a.currentTime = 0;
        setLaughOn(false);
      } else {
        await a.play();
        setLaughOn(true);
      }
    } catch (err) {
      console.warn("Audio blocked or failed to play", err);
    }
  };

  const cleanPlayers = useMemo(() => players.map((p) => p.trim()).filter(Boolean), [players]);

  const canStart =
    cleanPlayers.length >= 3 && impostorsCount >= 1 && impostorsCount < cleanPlayers.length;

  const aliveCount = useMemo(() => countAlive(alive), [alive]);

  const aliveImpostorsCount = useMemo(() => {
    let c = 0;
    for (const idx of impostors) if (alive[idx]) c++;
    return c;
  }, [alive, impostors]);

  const aliveCrewCount = useMemo(
    () => aliveCount - aliveImpostorsCount,
    [aliveCount, aliveImpostorsCount],
  );

  const effectivePack: WordPackKey = monoBandidoEnabled ? "mono_bandido" : pack;
  const packInfo = WORD_PACKS[effectivePack];
  const packCount = packInfo.words.length;

  function setUpNewGame() {
    const p = cleanPlayers;

    const aliveInit = p.map(() => true);
    setAlive(aliveInit);

    const idxs = shuffle(p.map((_, i) => i)).slice(0, impostorsCount);
    setImpostors(new Set(idxs));

    setRound(1);
    setWinner(null);
    setPendingGameOver(null);

    startRoundWithState(aliveInit);
  }

  function startRoundWithState(aliveState: boolean[]) {
    const word = pickRandom(WORD_PACKS[effectivePack].words);
    setSecretWord(word);

    const order = cleanPlayers.map((_, i) => i).filter((i) => aliveState[i]);

    setRevealOrder(order);
    setRevealPos(0);
    setIsRevealed(false);

    setEjected(null);
    setLastEjectedWasImpostor(null);

    // bandido spice
    if (eventsEnabled) setRoundEvent(pickRandom(BANDIDO_EVENTS));
    else setRoundEvent(null);

    if (monoBandidoEnabled) {
      setRoundPunishment(pickPunishment(bandidoIntensity));
      setPunishmentRerolled(false);
    } else {
      setRoundPunishment(null);
      setPunishmentRerolled(false);
    }

    // reset voting + penalty
    setVoteCounts(cleanPlayers.map(() => 0));
    setFirstVoterFor({});
    setVoterTurn(0);
    setPenaltyPayer(null);
    setPenaltyReason("");

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

    setEventsEnabled(true);
    setMonoBandidoEnabled(false);
    setBandidoIntensity("medio");
    setPendingGameOver(null);

    setHowToOpen(false);

    setVoteCounts([]);
    setFirstVoterFor({});
    setVoterTurn(0);
    setPenaltyPayer(null);
    setPenaltyReason("");

    setAlive([]);
    setImpostors(new Set());
    setRound(1);
    setSecretWord("");

    setRoundEvent(null);
    setRoundPunishment(null);
    setPunishmentRerolled(false);

    setRevealOrder([]);
    setRevealPos(0);
    setIsRevealed(false);

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
    setTimerRunning(false);
    setVoterTurn(0);
    if (voteCounts.length !== cleanPlayers.length) setVoteCounts(cleanPlayers.map(() => 0));
    setScreen("vote");
  }

  function castVoteFor(targetIdx: number) {
    const aliveVoters = cleanPlayers.map((_, i) => i).filter((i) => alive[i]);
    const currentVoter = aliveVoters[voterTurn];
    if (currentVoter === undefined) return;

    setFirstVoterFor((prev) => {
      if (prev[targetIdx] !== undefined) return prev;
      return { ...prev, [targetIdx]: currentVoter };
    });

    setVoteCounts((prev) => {
      const next = prev.length ? [...prev] : cleanPlayers.map(() => 0);
      next[targetIdx] = (next[targetIdx] ?? 0) + 1;
      return next;
    });

    setVoterTurn((t) => Math.min(aliveVoters.length, t + 1));
  }

  function finalizeVotingAndEject() {
    const aliveIdxs = cleanPlayers.map((_, i) => i).filter((i) => alive[i]);
    if (aliveIdxs.length === 0) return;

    let maxVotes = -1;
    for (const i of aliveIdxs) maxVotes = Math.max(maxVotes, voteCounts[i] ?? 0);

    const top = aliveIdxs.filter((i) => (voteCounts[i] ?? 0) === maxVotes);
    const ejectedIdx = maxVotes <= 0 ? pickRandom(aliveIdxs) : pickRandom(top);

    const wasImpostor = impostors.has(ejectedIdx);

    setEjected(ejectedIdx);
    setLastEjectedWasImpostor(wasImpostor);

    // decide who pays in Mono Bandido
    if (monoBandidoEnabled) {
      if (wasImpostor) {
        setPenaltyPayer(ejectedIdx);
        setPenaltyReason("Era el impostor.");
      } else {
        const payer = firstVoterFor[ejectedIdx];
        setPenaltyPayer(payer ?? null);
        setPenaltyReason("Votaron a un inocente. Paga el primero que lo señaló.");
      }
    } else {
      setPenaltyPayer(null);
      setPenaltyReason("");
    }

    const nextAlive = [...alive];
    nextAlive[ejectedIdx] = false;
    setAlive(nextAlive);

    const nextAliveCount = countAlive(nextAlive);
    let nextAliveImpostors = 0;
    for (const imp of impostors) if (nextAlive[imp]) nextAliveImpostors++;

    const nextAliveCrew = nextAliveCount - nextAliveImpostors;

    let nextWinner: "tripulacion" | "impostores" | null = null;
    if (nextAliveImpostors <= 0) nextWinner = "tripulacion";
    else if (nextAliveImpostors >= nextAliveCrew) nextWinner = "impostores";

    if (monoBandidoEnabled) {
      setPendingGameOver(nextWinner);
      if (nextWinner) setWinner(nextWinner);
      setScreen("result");
      return;
    }

    if (nextWinner) {
      setWinner(nextWinner);
      setScreen("gameover");
      return;
    }

    setScreen("result");
  }

  // Timer tick effect
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

  // UI helpers
  const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`card ${className ?? ""}`}
      style={{
        width: "100%",
        maxWidth: 720,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: 18,
      }}
    >
      <div className="screen">{children}</div>
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
    <div className="app-shell">
      {/* Mono Bandido badge fixed */}
      {monoBandidoEnabled && (
        <div className="mb-badge">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="13"
              cy="13"
              r="12"
              stroke="#c96dff"
              strokeWidth="1.5"
              fill="rgba(180,75,255,0.12)"
            />
            <path
              d="M5.5 10.5 Q13 7.5 20.5 10.5"
              stroke="#c96dff"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              opacity="0.7"
            />
            <text
              x="13"
              y="18.5"
              textAnchor="middle"
              fill="#c96dff"
              fontSize="8.5"
              fontWeight="900"
              fontFamily="ui-sans-serif,system-ui,sans-serif"
            >
              MB
            </text>
          </svg>
          Mono Bandido
        </div>
      )}

      {/* How-to modal */}
      {howToOpen && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Cómo jugar"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setHowToOpen(false);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <div className="modal-title">Cómo jugar</div>
              <button className="icon-btn" type="button" onClick={() => setHowToOpen(false)} aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="howto-steps">
                <div className="howto-step">
                  <div className="howto-ico">①</div>
                  <div>
                    <div className="howto-step-title">Configura</div>
                    <div className="howto-step-text">
                      Agrega jugadores, impostores y categoría (o activa Mono Bandido).
                    </div>
                  </div>
                </div>

                <div className="howto-step">
                  <div className="howto-ico">②</div>
                  <div>
                    <div className="howto-step-title">Revela tu rol</div>
                    <div className="howto-step-text">
                      Pásense el teléfono. Cada quien toca para ver su rol y lo vuelve a ocultar.
                    </div>
                  </div>
                </div>

                <div className="howto-step">
                  <div className="howto-ico">③</div>
                  <div>
                    <div className="howto-step-title">Discusión</div>
                    <div className="howto-step-text">
                      Describan la palabra sin decirla. El impostor improvisa y se camufla.
                    </div>
                  </div>
                </div>

                <div className="howto-step">
                  <div className="howto-ico">④</div>
                  <div>
                    <div className="howto-step-title">Votación</div>
                    <div className="howto-step-text">
                      Votan por turnos. La app lleva el progreso (sin revelar quién votó a quién).
                    </div>
                  </div>
                </div>

                <div className="howto-step">
                  <div className="howto-ico">⑤</div>
                  <div>
                    <div className="howto-step-title">Resultado</div>
                    <div className="howto-step-text">
                      Si está activo Mono Bandido, hay penitencia según quién fue expulsado.
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn-primary" type="button" onClick={() => setHowToOpen(false)}>
                  Listo, a jugar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === "home" && (
        <Card className="hero-card">
          <div className="hero">
            <div className="hero-left">
              <div className="hero-kicker">PARTY • 1 DISPOSITIVO • NEÓN</div>
              <h1 className="hero-title">Impostor Neón</h1>
              <p className="hero-subtitle">
                Hablen, engañen, voten. El caos es parte del juego no sean niñas.
              </p>

              <div className="hero-actions">
                <button className="btn-primary" type="button" onClick={() => setScreen("setup")}>
                  Crear partida
                </button>
                <button className="btn-ghost" type="button" onClick={() => setHowToOpen(true)}>
                  Cómo jugar para que no te hagas preguntas como pendejo
                </button>
                  <button className="btn-ghost sound-toggle" type="button" onClick={toggleLaugh}>
                 {laughOn ? "🔊 Risa ON" : "🔈 Risa OFF"}
                  </button>
              </div>

              <div className="hero-marquee" aria-hidden="true">
                <div className="hero-marquee-track">
                  <span>IMPOSTOR</span>
                  <span>NEÓN</span>
                  <span>VOTACIÓN</span>
                  <span>TIMER</span>
                  <span>MONO BANDIDO</span>
                  <span>FIESTA</span>
                  <span>CAOS</span>
                  <span>IMPOSTOR</span>
                  <span>NEÓN</span>
                  <span>VOTACIÓN</span>
                  <span>TIMER</span>
                  <span>MONO BANDIDO</span>
                  <span>FIESTA</span>
                  <span>CAOS</span>
                </div>
              </div>
              <img
                className="party-mascot"
                src={`${import.meta.env.BASE_URL}party-monkey.gif`}
                alt=""
                aria-hidden="true"
              />
            </div>

            <div className="hero-right" aria-hidden="true">
              <div className="hero-emblem">
                <svg viewBox="0 0 220 220" width="220" height="220" role="img" aria-label="">
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0" stopColor="#59f3ff" stopOpacity="0.95" />
                      <stop offset="0.55" stopColor="#b44bff" stopOpacity="0.95" />
                      <stop offset="1" stopColor="#ff4fd8" stopOpacity="0.95" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="b" />
                      <feColorMatrix
                        in="b"
                        type="matrix"
                        values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.9 0"
                      />
                      <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <circle cx="110" cy="110" r="86" stroke="url(#g1)" strokeWidth="3.2" fill="rgba(255,255,255,0.03)" />
                  <path
                    d="M50 96 Q110 60 170 96"
                    stroke="url(#g1)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.9"
                    filter="url(#glow)"
                  />
                  <path
                    d="M70 105 Q110 86 150 105"
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.9"
                  />
                  <text
                    x="110"
                    y="140"
                    textAnchor="middle"
                    fontSize="40"
                    fontWeight="900"
                    fill="url(#g1)"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                    filter="url(#glow)"
                  >
                    MB
                  </text>
                  <text
                    x="110"
                    y="162"
                    textAnchor="middle"
                    fontSize="10"
                    letterSpacing="3"
                    fontWeight="700"
                    fill="rgba(255,255,255,0.65)"
                    fontFamily="ui-sans-serif, system-ui, sans-serif"
                  >
                    MONO BANDIDO
                  </text>
                </svg>
              </div>
              <div className="hero-orbit" />
            </div>
          </div>
        </Card>
      )}

      {screen === "setup" && (
        <Card className="setup-card">
          <div className="card-header">
            <h2 style={{ margin: "0 0 10px" }}>Configurar partida</h2>
            <button className="chip" type="button" onClick={() => setHowToOpen(true)}>
              Cómo jugar
            </button>
          </div>

          <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>Jugadores (mínimo 3)</label>

          <div className="players-scroll">
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

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>Modos</label>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={eventsEnabled}
                  onChange={(e) => setEventsEnabled(e.target.checked)}
                />
                Eventos aleatorios
              </label>

              <label style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={monoBandidoEnabled}
                  onChange={(e) => setMonoBandidoEnabled(e.target.checked)}
                />
                Mono Bandido (Party)
              </label>
            </div>

            {monoBandidoEnabled && (
              <div style={{ marginTop: 10 }}>
                <div style={{ opacity: 0.9, marginBottom: 6 }}>Intensidad:</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {(["suave", "medio", "salvaje"] as const).map((lvl) => {
                    const selected = bandidoIntensity === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setBandidoIntensity(lvl)}
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
                        {lvl.toUpperCase()}
                      </button>
                    );
                  })}
                </div>
                <p style={{ margin: "8px 0 0", opacity: 0.65, fontSize: 13 }}>
                  En Mono Bandido: si atrapan al impostor paga él. Si sacan a un inocente, paga el
                  primero que lo señaló.
                </p>
              </div>
            )}
          </div>

          <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>Categoría de palabras</label>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {PACK_KEYS.filter((k) => k !== "mono_bandido").map((k) => {
              const selected = pack === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setPack(k)}
                  disabled={monoBandidoEnabled}
                  style={{
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: selected
                      ? "1px solid rgba(255,255,255,0.38)"
                      : "1px solid rgba(255,255,255,0.14)",
                    background: selected ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.25)",
                    color: "inherit",
                    cursor: monoBandidoEnabled ? "not-allowed" : "pointer",
                    opacity: monoBandidoEnabled ? 0.5 : 1,
                  }}
                >
                  {WORD_PACKS[k].label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setPack(pickRandom(PACK_KEYS.filter((k) => k !== "mono_bandido")))}
              disabled={monoBandidoEnabled}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(0,0,0,0.25)",
                color: "inherit",
                cursor: monoBandidoEnabled ? "not-allowed" : "pointer",
                opacity: monoBandidoEnabled ? 0.5 : 1,
              }}
              title="Elegir una categoría al azar"
            >
              Random
            </button>
          </div>

          <div style={{ opacity: 0.8, marginBottom: 14, fontSize: 13 }}>
            Pack seleccionado: <strong>{packInfo.label}</strong> — {packCount} palabras
          </div>

          <label style={{ display: "block", marginBottom: 8, opacity: 0.9 }}>Temporizador de discusión</label>
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
              Agrega al menos 3 nombres y asegúrate de que los impostores sean menos que los jugadores.
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

          {roundEvent && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                marginBottom: 12,
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 13 }}>Evento:</div>
              <div style={{ fontWeight: 800 }}>{roundEvent.title}</div>
              <div style={{ opacity: 0.85 }}>{roundEvent.rule}</div>
            </div>
          )}

          <p style={{ margin: "0 0 16px", opacity: 0.85 }}>
            Vivos: <strong>{aliveCount}</strong> (Tripulación {aliveCrewCount} / Impostores {aliveImpostorsCount})
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
                <div style={{ fontSize: 18, opacity: 0.9, marginBottom: 8 }}>Pásale el teléfono a:</div>
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

          {urgent && (
            <div className="urgente-badge">
              <span>⚠</span> URGENTE
            </div>
          )}

          <div style={{ marginBottom: 10, opacity: 0.85 }}>
            Categoría: <strong>{packInfo.label}</strong>
          </div>

          {roundEvent && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                marginBottom: 12,
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 13 }}>Evento:</div>
              <div style={{ fontWeight: 800 }}>{roundEvent.title}</div>
              <div style={{ opacity: 0.85 }}>{roundEvent.rule}</div>
            </div>
          )}

          <div
            style={{
              padding: 14,
              borderRadius: 16,
              border: urgent ? "1px solid rgba(255, 70, 70, 0.45)" : "1px solid rgba(255,255,255,0.12)",
              background: "rgba(0,0,0,0.25)",
              marginBottom: 14,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ opacity: 0.75, fontSize: 13 }}>Tiempo</div>
                <div
                  style={{
                    fontSize: 34,
                    fontWeight: 900,
                    color: urgent ? "#ff6b6b" : "white",
                    fontVariantNumeric: "tabular-nums",
                    fontFeatureSettings: '"tnum"',
                    letterSpacing: 0.5,
                    lineHeight: 1.05,
                    minWidth: 92,
                    textAlign: "left",
                  }}
                >
                  {formatMMSS(timeLeft)}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <Button onClick={() => setTimerRunning((r) => !r)}>{timerRunning ? "Pausar" : "Reanudar"}</Button>
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

            <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.10)", overflow: "hidden" }}>
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
          <h2 style={{ margin: "0 0 8px" }}>Votación</h2>
          <p style={{ margin: "0 0 12px", opacity: 0.85 }}>Votan por turnos. Pásense el celular.</p>

          {(() => {
            const aliveVoters = cleanPlayers.map((_, i) => i).filter((i) => alive[i]);
            const currentVoter = aliveVoters[voterTurn];
            const votingDone = voterTurn >= aliveVoters.length;

            return (
              <>
                <div className="vote-turn">
                  {votingDone ? (
                    <span>Listo: ya votaron todos.</span>
                  ) : (
                    <>
                      Turno de: <span className="vote-turn-name">{cleanPlayers[currentVoter]}</span>
                    </>
                  )}
                </div>

                <div className="vote-progress">
                  <div className="vote-progress-label">
                    {voterTurn} de {aliveVoters.length} votos registrados
                  </div>
                  <div className="vote-progress-track">
                    <div
                      className="vote-progress-fill"
                      style={{
                        width: `${aliveVoters.length > 0 ? (voterTurn / aliveVoters.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8, marginBottom: 14 }}>
                  {alivePlayersList
                    .filter((p) => p.alive)
                    .map((p) => {
                      const votes = voteCounts[p.i] ?? 0;

                      return (
                        <button
                          key={p.name + p.i}
                          type="button"
                          disabled={votingDone}
                          onClick={() => castVoteFor(p.i)}
                          style={{
                            textAlign: "left",
                            padding: "12px 14px",
                            borderRadius: 14,
                            border: "1px solid rgba(255,255,255,0.14)",
                            background: "rgba(0,0,0,0.25)",
                            color: "inherit",
                            cursor: votingDone ? "not-allowed" : "pointer",
                            opacity: votingDone ? 0.65 : 1,
                            display: "flex",
                            justifyContent: "space-between",
                            gap: 12,
                            alignItems: "center",
                          }}
                        >
                          <span>{p.name}</span>
                          <span style={{ opacity: 0.8, fontVariantNumeric: "tabular-nums" }}>
                            {votes} voto{votes === 1 ? "" : "s"}
                          </span>
                        </button>
                      );
                    })}
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Button onClick={() => setScreen("play")}>Volver a discusión</Button>
                  <Button onClick={finalizeVotingAndEject} disabled={!votingDone}>
                    Finalizar votación
                  </Button>
                </div>

                <GhostHint>
                  Cuando toca un nombre, registra el voto del turno actual automáticamente.
                </GhostHint>
              </>
            );
          })()}
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
                {lastEjectedWasImpostor ? "Era IMPOSTOR." : "No era impostor."}
              </p>
            </>
          )}

          {monoBandidoEnabled && roundPunishment && (
            <div
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(0,0,0,0.25)",
                marginBottom: 14,
              }}
            >
              <div style={{ opacity: 0.8, fontSize: 13 }}>Mono Bandido — Penitencia</div>

              <div style={{ marginTop: 6, marginBottom: 10 }}>
                <div style={{ opacity: 0.75, fontSize: 13 }}>PAGA:</div>
                <div style={{ fontSize: 22, fontWeight: 900 }}>
                  {penaltyPayer !== null ? cleanPlayers[penaltyPayer] : "—"}
                </div>
                <div style={{ marginTop: 6, opacity: 0.85 }}>{penaltyReason}</div>
              </div>

              <div style={{ opacity: 0.75, fontSize: 13 }}>RETO:</div>
              <div style={{ fontWeight: 900, fontSize: 18 }}>{roundPunishment.title}</div>
              <div style={{ opacity: 0.9 }}>{roundPunishment.text}</div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
                <Button
                  onClick={() => {
                    if (punishmentRerolled) return;
                    setRoundPunishment(pickPunishment(bandidoIntensity));
                    setPunishmentRerolled(true);
                  }}
                  disabled={punishmentRerolled}
                  title="Solo 1 vez por ronda"
                >
                  Cambiar reto (1x)
                </Button>
              </div>

              <GhostHint>Regla: si alguien no quiere hacerlo, se cambia sin discusión.</GhostHint>
            </div>
          )}

          <p style={{ margin: "0 0 14px", opacity: 0.85 }}>
            Vivos: <strong>{countAlive(alive)}</strong> (Tripulación {aliveCrewCount} / Impostores{" "}
            {aliveImpostorsCount})
          </p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {pendingGameOver ? (
              <Button
                onClick={() => {
                  setPendingGameOver(null);
                  setScreen("gameover");
                }}
              >
                Ver ganador
              </Button>
            ) : (
              <Button onClick={startNextRound}>Siguiente ronda</Button>
            )}
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