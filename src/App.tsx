import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

// --- CONFIGURATION & TIME TARGETS ---
interface TargetConfig {
  date: Date;
  label: string;
}

const TARGETS: Record<string, TargetConfig> = {
  abertura: {
    date: new Date(Date.UTC(2026, 5, 11, 19, 0, 0)), // 11th June 2026, 16:00 BRT (19:00 UTC)
    label: "11 de Junho de 2026 às 16:00 (Horário de Brasília)"
  },
  brasil: {
    date: new Date(Date.UTC(2026, 5, 13, 22, 0, 0)), // 13th June 2026, 19:00 BRT (22:00 UTC)
    label: "13 de Junho de 2026 às 19:00 (Horário de Brasília)"
  }
};

interface HistoryItem {
  year: string;
  host: string;
  desc: string;
  stars: string;
}

const HISTORY_ITEMS: HistoryItem[] = [
  { year: "1958", host: "Suécia", desc: "O nascimento do Rei Pelé para o mundo aos 17 anos e a nossa primeira taça.", stars: "★" },
  { year: "1962", host: "Chile", desc: "A genialidade mágica de Mané Garrincha comandando o nosso Bicampeonato.", stars: "★★" },
  { year: "1970", host: "México", desc: "O Tri definitivo com a maior seleção de futebol de todos os tempos.", stars: "★★★" },
  { year: "1994", host: "EUA", desc: "O fim do jejum de 24 anos com o grito épico de \"É Tetra!\" de Romário e Baggio.", stars: "★★★★" },
  { year: "2002", host: "Coreia/Japão", desc: "A superação do Fenômeno Ronaldo liderando a campanha perfeita do Penta.", stars: "★★★★★" }
];

// --- MATCH SCHEDULE DATA ---
interface MatchItem {
  date: string;
  hour: string;
  teams: string;
  group: string;
  venue: string;
  channels: string;
  isBrasil: boolean;
}

const BRASIL_MATCHES: MatchItem[] = [
  { date: "13 de Junho (Sáb)", hour: "19:00", teams: "Brasil x Marrocos", group: "Grupo C - Rodada 1", venue: "MetLife Stadium (NY/NJ)", channels: "Globo, CazéTV, SporTV", isBrasil: true },
  { date: "19 de Junho (Sex)", hour: "21:30", teams: "Brasil x Haiti", group: "Grupo C - Rodada 2", venue: "Lincoln Financial Field (Filadélfia)", channels: "Globo, CazéTV, SporTV", isBrasil: true },
  { date: "24 de Junho (Qua)", hour: "19:00", teams: "Escócia x Brasil", group: "Grupo C - Rodada 3", venue: "Hard Rock Stadium (Miami)", channels: "Globo, CazéTV, SporTV", isBrasil: true }
];

const ALL_MATCHES: MatchItem[] = [
  { date: "11 de Junho (Qui)", hour: "16:00", teams: "México x África do Sul", group: "Grupo A - Abertura da Copa", venue: "Estádio Azteca (Cid. do México)", channels: "Globo, CazéTV, SporTV", isBrasil: false },
  { date: "12 de Junho (Sex)", hour: "20:00", teams: "EUA x Paraguai", group: "Grupo D - Rodada 1", venue: "SoFi Stadium (Los Angeles)", channels: "Globo, SporTV", isBrasil: false },
  { date: "13 de Junho (Sáb)", hour: "19:00", teams: "Brasil x Marrocos", group: "Grupo C - Rodada 1", venue: "MetLife Stadium (NY/NJ)", channels: "Globo, CazéTV, SporTV", isBrasil: true },
  { date: "14 de Junho (Dom)", hour: "18:00", teams: "Argentina x Argélia", group: "Grupo J - Rodada 1", venue: "NRG Stadium (Houston)", channels: "CazéTV, SporTV", isBrasil: false },
  { date: "15 de Junho (Seg)", hour: "21:00", teams: "França x Senegal", group: "Grupo I - Rodada 1", venue: "BC Place (Vancouver)", channels: "Globo, SporTV", isBrasil: false },
  { date: "16 de Junho (Ter)", hour: "17:00", teams: "Alemanha x Equador", group: "Grupo E - Rodada 1", venue: "Lumen Field (Seattle)", channels: "CazéTV", isBrasil: false },
  { date: "17 de Junho (Qua)", hour: "20:00", teams: "Espanha x Uruguay", group: "Grupo H - Rodada 1", venue: "AT&T Stadium (Dallas)", channels: "Globo, SporTV, CazéTV", isBrasil: false },
  { date: "18 de Junho (Qui)", hour: "15:00", teams: "Inglaterra x Croácia", group: "Grupo L - Rodada 1", venue: "Mercedes-Benz Stadium (Atlanta)", channels: "SBT, SporTV", isBrasil: false },
  { date: "19 de Junho (Sex)", hour: "21:30", teams: "Brasil x Haiti", group: "Grupo C - Rodada 2", venue: "Lincoln Financial Field (Filadélfia)", channels: "Globo, CazéTV, SporTV", isBrasil: true },
  { date: "20 de Junho (Sáb)", hour: "19:00", teams: "Portugal x Colômbia", group: "Grupo K - Rodada 1", venue: "Gillette Stadium (Boston)", channels: "Globo, SporTV", isBrasil: false },
  { date: "24 de Junho (Qua)", hour: "19:00", teams: "Escócia x Brasil", group: "Grupo C - Rodada 3", venue: "Hard Rock Stadium (Miami)", channels: "Globo, CazéTV, SporTV", isBrasil: true },
  { date: "19 de Julho (Dom)", hour: "16:00", teams: "A Grande Final 🏆", group: "Decisão do Título", venue: "MetLife Stadium (NY/NJ)", channels: "Globo, CazéTV, SporTV", isBrasil: false }
];

function App() {
  const [targetKey, setTargetKey] = useState<string>('abertura');
  const [accepted, setAccepted] = useState<boolean>(false);
  const [isMoving, setIsMoving] = useState<boolean>(false);
  const [naoStyle, setNaoStyle] = useState<React.CSSProperties>({});
  const [timeLeft, setTimeLeft] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [isCopaStarted, setIsCopaStarted] = useState<boolean>(false);
  
  // Tab control for matches
  const [matchesTab, setMatchesTab] = useState<'brasil' | 'todos'>('brasil');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // --- COUNTDOWN EFFECT ---
  useEffect(() => {
    const calculateTime = () => {
      const target = TARGETS[targetKey].date;
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ days: "00", hours: "00", minutes: "00", seconds: "00" });
        setIsCopaStarted(true);
        return;
      }

      setIsCopaStarted(false);
      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft({
        days: String(d).padStart(2, '0'),
        hours: String(h).padStart(2, '0'),
        minutes: String(m).padStart(2, '0'),
        seconds: String(s).padStart(2, '0')
      });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [targetKey]);

  // --- RUNAWAY BUTTON ---
  const runawayButton = (e: React.MouseEvent<HTMLButtonElement> | React.TouchEvent<HTMLButtonElement>) => {
    e.preventDefault();

    const btnWidth = 120;
    const btnHeight = 50;
    
    // Size based on device viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Calculations covering the entire visible viewport with safe boundaries
    const maxX = vw - btnWidth - 40;
    const maxY = vh - btnHeight - 40;

    let randomX = Math.max(20, Math.floor(Math.random() * maxX));
    let randomY = Math.max(20, Math.floor(Math.random() * maxY));

    // Evasion logic to jump away from cursor position
    let cursorX = 0;
    let cursorY = 0;

    if ('clientX' in e) {
      cursorX = e.clientX;
      cursorY = e.clientY;
    } else if ('touches' in e && e.touches[0]) {
      cursorX = e.touches[0].clientX;
      cursorY = e.touches[0].clientY;
    }

    const dist = Math.hypot(randomX - cursorX, randomY - cursorY);
    if (dist < 180) {
      randomX = (randomX + 220) % maxX;
      randomY = (randomY + 220) % maxY;
      if (randomX < 20) randomX = 20;
      if (randomY < 20) randomY = 20;
    }

    setIsMoving(true);
    setNaoStyle({
      left: `${randomX}px`,
      top: `${randomY}px`
    });
  };

  // --- PLAY CELEBRATION AUDIO FANFARE (Web Audio API) ---
  const playCelebrationSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const audioCtx = new AudioContextClass();
      audioCtxRef.current = audioCtx;

      const arpeggio = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C4, E4, G4, C5, E5, G5
      const timeOffsetUnit = 0.12;
      const now = audioCtx.currentTime;

      // Master Gain for smooth fade out
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.25, now);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
      masterGain.connect(audioCtx.destination);

      arpeggio.forEach((freq, idx) => {
        const startTime = now + (idx * timeOffsetUnit);

        // Warm brass wave (triangle)
        const osc = audioCtx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, startTime);

        // Shiny detuned subwave (sawtooth)
        const subOsc = audioCtx.createOscillator();
        subOsc.type = 'sawtooth';
        subOsc.frequency.setValueAtTime(freq + (Math.random() * 2 - 1), startTime);

        // Note Envelope
        const noteGain = audioCtx.createGain();
        noteGain.gain.setValueAtTime(0.0, startTime);
        noteGain.gain.linearRampToValueAtTime(0.4, startTime + 0.05); // Attack
        noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.6); // Decay

        osc.connect(noteGain);
        subOsc.connect(noteGain);
        noteGain.connect(masterGain);

        osc.start(startTime);
        subOsc.start(startTime);

        osc.stop(startTime + 0.7);
        subOsc.stop(startTime + 0.7);
      });

      // Bass drum kicker
      const drum = audioCtx.createOscillator();
      const drumGain = audioCtx.createGain();
      drum.frequency.setValueAtTime(90, now);
      drum.frequency.exponentialRampToValueAtTime(40, now + 0.25);

      drumGain.gain.setValueAtTime(0.3, now);
      drumGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      drum.connect(drumGain);
      drumGain.connect(audioCtx.destination);

      drum.start(now);
      drum.stop(now + 0.35);

    } catch (err) {
      console.warn("Audio synthesis was blocked or failed: ", err);
    }
  };

  // --- FIREWORKS CANVAS EFFECT ---
  useEffect(() => {
    if (!accepted) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let fireworks: any[] = [];
    let particles: any[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    // Rockets class
    class FireworkRocket {
      x: number; y: number; sx: number; sy: number; tx: number; ty: number;
      distanceToTarget: number; distanceTraveled: number;
      coordinates: [number, number][]; angle: number; speed: number;
      acceleration: number; brightness: number; hue: number;

      constructor(sx: number, sy: number, tx: number, ty: number) {
        this.x = sx;
        this.y = sy;
        this.sx = sx;
        this.sy = sy;
        this.tx = tx;
        this.ty = ty;
        this.distanceToTarget = Math.hypot(tx - sx, ty - sy);
        this.distanceTraveled = 0;
        this.coordinates = [[sx, sy], [sx, sy], [sx, sy]];
        this.angle = Math.atan2(ty - sy, tx - sx);
        this.speed = 2.5;
        this.acceleration = 1.04;
        this.brightness = Math.random() * 50 + 50;
        const colors = [45, 140, 210, 0]; // yellow, green, blue, white
        this.hue = colors[Math.floor(Math.random() * colors.length)];
      }

      update(index: number) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.acceleration;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;
        this.distanceTraveled = Math.hypot(this.sx - (this.x + vx), this.sy - (this.y + vy));

        if (this.distanceTraveled >= this.distanceToTarget) {
          explode(this.tx, this.ty, this.hue);
          fireworks.splice(index, 1);
        } else {
          this.x += vx;
          this.y += vy;
        }
      }

      draw() {
        ctx!.beginPath();
        ctx!.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx!.lineTo(this.x, this.y);
        ctx!.strokeStyle = this.hue === 0 ? `hsla(0, 0%, 100%, ${this.brightness / 100})` : `hsla(${this.hue}, 100%, 60%, ${this.brightness / 100})`;
        ctx!.lineWidth = 2;
        ctx!.stroke();
      }
    }

    // Explosion Spark Particle class
    class Spark {
      x: number; y: number; coordinates: [number, number][];
      angle: number; speed: number; friction: number; gravity: number;
      hue: number; brightness: number; alpha: number; decay: number;

      constructor(x: number, y: number, hue: number) {
        this.x = x;
        this.y = y;
        this.coordinates = [[x, y], [x, y], [x, y], [x, y], [x, y]];
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 8 + 1;
        this.friction = 0.95;
        this.gravity = 0.12;
        this.hue = hue;
        this.brightness = Math.random() * 40 + 60;
        this.alpha = 1;
        this.decay = Math.random() * 0.015 + 0.01;
      }

      update(index: number) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        if (this.alpha <= this.decay) {
          particles.splice(index, 1);
        }
      }

      draw() {
        ctx!.beginPath();
        ctx!.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx!.lineTo(this.x, this.y);
        if (this.hue === 0) {
          ctx!.strokeStyle = `rgba(255, 255, 255, ${this.alpha})`;
        } else {
          ctx!.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        }
        ctx!.lineWidth = 1.5;
        ctx!.stroke();
      }
    }

    const explode = (x: number, y: number, hue: number) => {
      let count = 40 + Math.floor(Math.random() * 30);
      while (count--) {
        particles.push(new Spark(x, y, hue));
      }
    };

    const loop = () => {
      animFrameId = requestAnimationFrame(loop);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = 'lighter';

      let i = fireworks.length;
      while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
      }

      let j = particles.length;
      while (j--) {
        particles[j].draw();
        particles[j].update(j);
      }

      if (Math.random() < 0.04) {
        const startX = Math.random() * canvas.width;
        const targetX = Math.random() * canvas.width;
        const targetY = Math.random() * (canvas.height / 2);
        fireworks.push(new FireworkRocket(startX, canvas.height, targetX, targetY));
      }
    };

    loop();

    const handleCanvasClick = (e: MouseEvent) => {
      const startX = canvas.width / 2 + (Math.random() * 200 - 100);
      fireworks.push(new FireworkRocket(startX, canvas.height, e.clientX, e.clientY));
    };
    canvas.addEventListener('click', handleCanvasClick);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', handleCanvasClick);
    };
  }, [accepted]);

  // --- TRANSITIONS ---
  const handleAccept = () => {
    setAccepted(true);
    playCelebrationSound();
  };

  const handleReset = () => {
    setAccepted(false);
    setIsMoving(false);
    setNaoStyle({});
    if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
      audioCtxRef.current.close().then(() => {
        audioCtxRef.current = null;
      });
    }
  };

  return (
    <>
      {/* Canvas for Fireworks */}
      <canvas ref={canvasRef} id="fireworksCanvas" className={accepted ? 'active' : ''} />

      {/* Glowing Orbs in Background */}
      <div className="glow-orb orb-green"></div>
      <div className="glow-orb orb-gold"></div>
      <div className="glow-orb orb-blue"></div>

      <div className="container">
        {/* Header */}
        <header className="app-header">
          <div className="brazil-badge">
            <span className="stars">★ ★ ★ ★ ★</span>
            <span className="badge-text">BRASIL RUMO AO HEXA</span>
          </div>
          <h1 className="main-title">COPA 2026</h1>
        </header>

        <main className="main-content">
          {!accepted ? (
            /* Active Invitation Card (Restored Elegant Glassmorphic Card Layout) */
            <section className="card invitation-card" id="invitationCard">
              <div className="card-accent-bar"></div>
              <div className="cup-icon-container">
                <svg className="trophy-svg" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 3H18V5C18 7.2 16.2 9 14 9H10C7.8 9 6 7.2 6 5V3Z" stroke="url(#goldGradient)" strokeWidth="1.5" strokeLinejoin="round" />
                  <path d="M10 9V17H14V9" stroke="url(#goldGradient)" stroke-width="1.5" strokeLinecap="round" />
                  <path d="M8 17H16V21H8V17Z" stroke="url(#goldGradient)" stroke-width="1.5" strokeLinejoin="round" />
                  <path d="M6 5H4C2.9 5 2 5.9 2 7V8C2 9.1 2.9 10 4 10H6" stroke="url(#goldGradient)" stroke-width="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M18 5H20C21.1 5 22 5.9 22 7V8C22 9.1 21.1 10 20 10H18" stroke="url(#goldGradient)" stroke-width="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="goldGradient" x1="2" y1="3" x2="22" y2="21" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#FFE000" />
                      <stop offset="0.5" stopColor="#799F0C" />
                      <stop offset="1" stopColor="#005C53" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="card-body">
                <h2 className="card-title">Vamos assistir à Copa juntos?</h2>
                <p className="card-text">
                  A maior festa do futebol mundial está de volta! Vista a amarelinha, prepare a corneta e junte-se a nós para torcer pela nossa seleção.
                </p>

                {/* Countdown Component */}
                <div className="countdown-section">
                  <div className="countdown-toggle-container">
                    <button
                      className={`toggle-btn ${targetKey === 'abertura' ? 'active' : ''}`}
                      onClick={() => setTargetKey('abertura')}
                    >
                      Abertura da Copa
                    </button>
                    <button
                      className={`toggle-btn ${targetKey === 'brasil' ? 'active' : ''}`}
                      onClick={() => setTargetKey('brasil')}
                    >
                      Estreia do Brasil
                    </button>
                  </div>

                  <div className="countdown-display">
                    <div className="countdown-time-box">
                      <span className="time-num">{timeLeft.days}</span>
                      <span className="time-label">Dias</span>
                    </div>
                    <div className="countdown-divider">:</div>
                    <div className="countdown-time-box">
                      <span className="time-num">{timeLeft.hours}</span>
                      <span className="time-label">Horas</span>
                    </div>
                    <div className="countdown-divider">:</div>
                    <div className="countdown-time-box">
                      <span className="time-num">{timeLeft.minutes}</span>
                      <span className="time-label">Min</span>
                    </div>
                    <div className="countdown-divider">:</div>
                    <div className="countdown-time-box">
                      <span className="time-num">{timeLeft.seconds}</span>
                      <span className="time-label">Seg</span>
                    </div>
                  </div>
                  <p className="target-date-text">
                    {isCopaStarted ? "A Copa começou! ⚽🏆" : TARGETS[targetKey].label}
                  </p>
                </div>

                {/* Invitation Action Buttons */}
                <div className="actions-container">
                  <button className="btn btn-primary" id="btnSim" onClick={handleAccept}>
                    <span>Sim, com certeza! 🇧🇷</span>
                    <span className="btn-shine"></span>
                  </button>
                  
                  {/* Inline normal button when NOT moving */}
                  {!isMoving && (
                    <button
                      className="btn btn-secondary"
                      id="btnNao"
                      onMouseOver={runawayButton}
                      onClick={runawayButton}
                      onTouchStart={runawayButton}
                    >
                      Não
                    </button>
                  )}
                </div>
              </div>
            </section>
          ) : (
            /* Success / Confirmed Card */
            <section className="card success-card" id="successCard">
              <div className="card-accent-bar success-bar"></div>
              <div className="success-icon-container">
                <div className="success-checkmark">⚽</div>
              </div>
              <div className="card-body">
                <h2 className="card-title success-title">Presença Confirmada! 🎉</h2>
                <p className="card-text success-text">
                  Que excelente escolha! A energia positiva já está garantida. Prepare o coração, porque o grito de gol vai ecoar forte!
                </p>

                {/* Event Details Card */}
                <div className="event-details">
                  <h3 className="details-title">Nosso Ponto de Encontro</h3>
                  <div className="detail-item">
                    <span className="detail-icon">📍</span>
                    <div className="detail-info">
                      <strong>Local:</strong>
                      <span>Na nossa Arena Oficial</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">📅</span>
                    <div className="detail-info">
                      <strong>Data de Estreia:</strong>
                      <span>13 de Junho de 2026</span>
                    </div>
                  </div>
                  <div className="detail-item">
                    <span className="detail-icon">⏰</span>
                    <div className="detail-info">
                      <strong>Horário:</strong>
                      <span>A partir das 18:00 (Jogo às 19:00 BRT)</span>
                    </div>
                  </div>
                </div>

                <button className="btn btn-primary btn-back" onClick={handleReset}>
                  Voltar ao Convite
                </button>
              </div>
            </section>
          )}

          {/* Render RUNAWAY button inside Portal if it IS moving */}
          {isMoving && !accepted && createPortal(
            <button
              className="btn btn-secondary moving"
              id="btnNao"
              style={naoStyle}
              onMouseOver={runawayButton}
              onClick={runawayButton}
              onTouchStart={runawayButton}
            >
              Não
            </button>,
            document.body
          )}

          {/* SCHEDULE (JOGOS) SECTION (Tighter width, no scroll) */}
          <section className="matches-section">
            <header className="matches-header">
              <h2 className="matches-title">Tabela de Jogos - Copa 2026</h2>
              <p className="matches-subtitle">Acompanhe a agenda da maior Copa da história (Horários de Brasília)</p>
            </header>

            <div className="matches-tabs">
              <button
                className={`tab-btn ${matchesTab === 'brasil' ? 'active' : ''}`}
                onClick={() => setMatchesTab('brasil')}
              >
                🇧🇷 Jogos do Brasil
              </button>
              <button
                className={`tab-btn ${matchesTab === 'todos' ? 'active' : ''}`}
                onClick={() => setMatchesTab('todos')}
              >
                🌍 Principais Jogos da Copa
              </button>
            </div>

            <div className="matches-list">
              {(matchesTab === 'brasil' ? BRASIL_MATCHES : ALL_MATCHES).map((match, idx) => (
                <div key={idx} className={`match-card ${match.isBrasil ? 'brasil-match' : ''}`}>
                  <div className="match-header-row">
                    <span className="match-date-time">
                      📅 {match.date} às {match.hour}
                    </span>
                    <span className="match-group-badge">{match.group}</span>
                  </div>
                  <div className="match-teams-row">
                    {match.teams.includes(' x ') ? (
                      <>
                        <span>{match.teams.split(' x ')[0]}</span>
                        <span className="match-vs-badge">VS</span>
                        <span>{match.teams.split(' x ')[1]}</span>
                      </>
                    ) : (
                      <span style={{ color: 'var(--gold)' }}>{match.teams}</span>
                    )}
                  </div>
                  <div className="match-footer-row">
                    <span className="match-stadium">📍 {match.venue}</span>
                    <span className="match-broadcast">📺 {match.channels}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Brazil Cup History Section */}
          <section className="history-section">
            <h3 className="history-title">A Nossa Gloriosa História</h3>
            <p className="history-subtitle">Nenhum país brilha tanto na história das Copas. Relembre nossas 5 estrelas:</p>

            <div className="history-grid">
              {HISTORY_ITEMS.map((item, idx) => (
                <div key={idx} className="history-card">
                  <div className="history-year">{item.year}</div>
                  <div className="history-host">{item.host}</div>
                  <p className="history-desc">{item.desc}</p>
                  <div className="history-stars">{item.stars}</div>
                </div>
              ))}
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>Criado com amor e paixão verde-amarela &copy; 2026</p>
          <p style={{ marginTop: '0.3rem' }}>
            Desenvolvido por{' '}
            <a href="https://instagram.com/andreantonio96" target="_blank" rel="noopener noreferrer">
              André Antonio
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}

export default App;
