import { useState, useEffect, useRef, useCallback } from "react";

const THEMES = [
  "doğa ve çevre",
  "teknoloji ve yapay zeka",
  "uzay ve evren",
  "spor ve rekabet",
  "tarih ve medeniyetler",
  "yemek ve mutfak kültürü",
  "müzik ve sanat",
  "bilim ve keşifler",
];

const LEVELS = [
  { label: "Kolay", words: 30 },
  { label: "Orta", words: 50 },
  { label: "Zor", words: 80 },
];

function getGrade(wpm) {
  if (wpm < 20) return { label: "Yeni Başlayan 🐢", color: "#ef4444" };
  if (wpm < 40) return { label: "Yavaş ✍️", color: "#f97316" };
  if (wpm < 60) return { label: "Ortalama 👍", color: "#eab308" };
  if (wpm < 80) return { label: "Hızlı ⚡", color: "#22c55e" };
  if (wpm < 100) return { label: "Çok Hızlı 🚀", color: "#3b82f6" };
  return { label: "Profesyonel 🏆", color: "#a855f7" };
}

// Konfeti parçacığı
function Confetti({ active }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const pieces = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      w: Math.random() * 12 + 6,
      h: Math.random() * 6 + 4,
      color: ["#38bdf8","#818cf8","#f472b6","#facc15","#4ade80","#fb923c"][Math.floor(Math.random()*6)],
      rot: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 6,
      vy: Math.random() * 3 + 2,
      vx: (Math.random() - 0.5) * 2,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.rotSpeed;
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{ position: "fixed", top: 0, left: 0, pointerEvents: "none", zIndex: 9999 }}
    />
  );
}

// Otomatik yazma animasyonu
function useAutoType(text, onDone) {
  const [autoTyped, setAutoTyped] = useState("");
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!text) return;
    indexRef.current = 0;
    setAutoTyped("");
    const type = () => {
      if (indexRef.current < text.length) {
        indexRef.current++;
        setAutoTyped(text.slice(0, indexRef.current));
        timerRef.current = setTimeout(type, 18 + Math.random() * 20);
      } else {
        onDone && onDone();
      }
    };
    timerRef.current = setTimeout(type, 300);
    return () => clearTimeout(timerRef.current);
  }, [text]);

  return autoTyped;
}

export default function WPMTest() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [typed, setTyped] = useState("");
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedThemeIdx, setSelectedThemeIdx] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(LEVELS[0]);
  const [errorCount, setErrorCount] = useState(0);
  // Easter egg states
  const [easterEgg, setEasterEgg] = useState(false);
  const [eggAutoText, setEggAutoText] = useState("");
  const [eggDone, setEggDone] = useState(false);
  const [confetti, setConfetti] = useState(false);
  const [eggWpm, setEggWpm] = useState(0);
  const eggStartTime = useRef(null);

  const inputRef = useRef(null);
  const timerRef = useRef(null);

  const randomTheme = useCallback(() => {
    return THEMES[Math.floor(Math.random() * THEMES.length)];
  }, []);

  const fetchText = useCallback(async (themeOverride) => {
    setLoading(true);
    setText("");
    setTyped("");
    setStarted(false);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    setElapsedTime(0);
    setErrorCount(0);
    setEasterEgg(false);
    setEggAutoText("");
    setEggDone(false);
    setConfetti(false);
    clearInterval(timerRef.current);

    const theme = themeOverride ?? randomTheme();

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: `"${theme}" konusunda Türkçe, ${selectedLevel.words} kelimelik akıcı ve ilginç bir paragraf yaz. Sadece paragrafı yaz, başlık veya açıklama ekleme. Tırnak işareti kullanma.`,
            },
          ],
        }),
      });
      const data = await response.json();
      const result = data.content?.map((i) => i.text || "").join("").trim();
      setText(result || "Metin yüklenemedi.");
    } catch {
      setText("Metin yüklenirken hata oluştu.");
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [randomTheme, selectedLevel]);

  useEffect(() => {
    return () => clearInterval(timerRef.current);
  }, []);

  // Auto type hook for easter egg
  const autoTyped = useAutoType(eggAutoText, () => {
    setEggDone(true);
    setConfetti(true);
    const elapsed = (Date.now() - eggStartTime.current) / 60000;
    const wordCount = text.split(" ").length;
    setEggWpm(Math.round(wordCount / elapsed));
    setTimeout(() => setConfetti(false), 5000);
  });

  const handleInput = (e) => {
    if (easterEgg) return; // easter egg modunda input engelle
    const val = e.target.value;

    // Easter egg tetikleyici: "baycow" yazıldı mı?
    if (started && val.includes("baycow") && !easterEgg) {
      setEasterEgg(true);
      setTyped(val);
      eggStartTime.current = Date.now();
      // Timer zaten çalışıyor, onu durdurma — süre sayılmaya devam etsin
      // Otomatik yazma başlasın: metnin geri kalanını tamamla
      setEggAutoText(text);
      return;
    }

    if (!started && val.length > 0) {
      setStarted(true);
      const now = Date.now();
      setStartTime(now);
      timerRef.current = setInterval(() => {
        setElapsedTime(((Date.now() - now) / 1000).toFixed(1));
      }, 100);
    }
    setTyped(val);

    let errors = 0;
    for (let i = 0; i < val.length; i++) {
      if (val[i] !== text[i]) errors++;
    }
    setErrorCount(errors);

    const acc = val.length > 0 ? Math.max(0, Math.round(((val.length - errors) / val.length) * 100)) : 100;
    setAccuracy(acc);

    if (val.length >= text.length && text.length > 0) {
      clearInterval(timerRef.current);
      const elapsed = (Date.now() - startTime) / 60000;
      const wordCount = text.split(" ").length;
      const calculatedWpm = Math.round(wordCount / elapsed);
      setWpm(calculatedWpm);
      setFinished(true);
    }
  };

  // Easter egg: autoTyped tamamlandığında
  useEffect(() => {
    if (eggDone) {
      clearInterval(timerRef.current);
    }
  }, [eggDone]);

  const handleTheme = (idx) => {
    setSelectedThemeIdx(idx);
    fetchText(THEMES[idx]);
  };

  const handleRandom = () => {
    setSelectedThemeIdx(null);
    fetchText();
  };

  const handleRestart = () => {
    setTyped("");
    setStarted(false);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    setElapsedTime(0);
    setErrorCount(0);
    setEasterEgg(false);
    setEggAutoText("");
    setEggDone(false);
    setConfetti(false);
    clearInterval(timerRef.current);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // Render text: easter egg modunda autoTyped kullan
  const renderText = () => {
    const display = easterEgg ? autoTyped : typed;
    return text.split("").map((char, i) => {
      let color = "#94a3b8";
      let bg = "transparent";
      if (i < display.length) {
        // easter egg modunda hepsi yeşil
        color = easterEgg ? "#22c55e" : (display[i] === char ? "#22c55e" : "#ef4444");
        if (!easterEgg && display[i] !== char) bg = "#fee2e2";
      }
      if (!easterEgg && i === display.length) bg = "#dbeafe";
      return (
        <span key={i} style={{ color, backgroundColor: bg, borderRadius: 2 }}>
          {char}
        </span>
      );
    });
  };

  const grade = (finished || eggDone) ? getGrade(eggDone ? eggWpm : wpm) : null;

  return (
    <div style={{
      minHeight: "100vh",
      background: easterEgg
        ? "linear-gradient(135deg, #1a0533 0%, #0f172a 50%, #1a0533 100%)"
        : "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "32px 16px",
      fontFamily: "'Segoe UI', system-ui, sans-serif",
      color: "#f1f5f9",
      transition: "background 0.5s",
    }}>
      <Confetti active={confetti} />

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: -1 }}>
          ⌨️ <span style={{ background: "linear-gradient(90deg, #38bdf8, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>WPM Testi</span>
        </h1>
        <p style={{ color: "#94a3b8", margin: "8px 0 0", fontSize: 15 }}>Yapay zeka her seferinde farklı bir metin üretir</p>
      </div>

      {/* Level & Theme Selection */}
      {!text && !loading && (
        <div style={{ width: "100%", maxWidth: 680, display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Zorluk Seviyesi</p>
            <div style={{ display: "flex", gap: 10 }}>
              {LEVELS.map((l) => (
                <button key={l.label} onClick={() => setSelectedLevel(l)} style={{
                  flex: 1, padding: "10px", borderRadius: 10, border: "2px solid",
                  borderColor: selectedLevel.label === l.label ? "#38bdf8" : "#334155",
                  background: selectedLevel.label === l.label ? "#0f3a52" : "#1e293b",
                  color: selectedLevel.label === l.label ? "#38bdf8" : "#94a3b8",
                  fontWeight: 600, cursor: "pointer", fontSize: 14, transition: "all 0.2s",
                }}>
                  {l.label} <span style={{ opacity: 0.6, fontSize: 12 }}>~{l.words} kelime</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ color: "#94a3b8", fontSize: 13, marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Konu Seç</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {THEMES.map((t, i) => (
                <button key={t} onClick={() => handleTheme(i)} style={{
                  padding: "10px 14px", borderRadius: 10, border: "2px solid",
                  borderColor: selectedThemeIdx === i ? "#818cf8" : "#334155",
                  background: selectedThemeIdx === i ? "#1e1b4b" : "#1e293b",
                  color: selectedThemeIdx === i ? "#818cf8" : "#94a3b8",
                  fontWeight: 500, cursor: "pointer", fontSize: 14, textAlign: "left", transition: "all 0.2s",
                }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleRandom} style={{
            padding: "14px", borderRadius: 12, border: "none",
            background: "linear-gradient(90deg, #38bdf8, #818cf8)",
            color: "#0f172a", fontWeight: 800, cursor: "pointer", fontSize: 16,
            boxShadow: "0 4px 20px rgba(56,189,248,0.3)",
          }}>
            🎲 Rastgele Konu ile Başla
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", marginTop: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✨</div>
          <p style={{ color: "#94a3b8", fontSize: 16 }}>Yapay zeka metin üretiyor...</p>
        </div>
      )}

      {/* Test Area */}
      {text && !loading && !finished && !eggDone && (
        <div style={{ width: "100%", maxWidth: 720, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Easter Egg Banner */}
          {easterEgg && (
            <div style={{
              background: "linear-gradient(90deg, #7c3aed, #db2777)",
              borderRadius: 12, padding: "12px 20px", textAlign: "center",
              fontSize: 16, fontWeight: 700, letterSpacing: 0.5,
              animation: "pulse 1s infinite",
              boxShadow: "0 0 30px rgba(124,58,237,0.5)",
            }}>
              🐄 BAYCOW MODU AKTİF! Kelimeler kendiliğinden yazılıyor... 🐄
            </div>
          )}

          {/* Stats Bar */}
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {[
              { label: "Süre", value: `${elapsedTime}s` },
              { label: "Doğruluk", value: easterEgg ? "🐄 ∞%" : `${accuracy}%` },
              { label: "Hata", value: easterEgg ? "🤫" : errorCount },
            ].map(({ label, value }) => (
              <div key={label} style={{
                background: easterEgg ? "rgba(124,58,237,0.2)" : "#1e293b",
                border: `1px solid ${easterEgg ? "#7c3aed" : "#334155"}`,
                borderRadius: 10, padding: "10px 20px", textAlign: "center", flex: 1,
              }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: easterEgg ? "#c084fc" : "#38bdf8" }}>{value}</div>
                <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Text Display */}
          <div style={{
            background: easterEgg ? "rgba(124,58,237,0.1)" : "#1e293b",
            border: `1px solid ${easterEgg ? "#7c3aed" : "#334155"}`,
            borderRadius: 16, padding: "24px", lineHeight: 2, fontSize: 18, letterSpacing: 0.3,
          }}>
            {renderText()}
          </div>

          {/* Input */}
          {!easterEgg && (
            <textarea
              ref={inputRef}
              value={typed}
              onChange={handleInput}
              placeholder="Yazmaya başla... (psst: gizli bir kod var 🤫)"
              style={{
                width: "100%", boxSizing: "border-box", padding: "16px",
                borderRadius: 12, border: "2px solid #38bdf8",
                background: "#0f172a", color: "#f1f5f9", fontSize: 16,
                resize: "none", height: 100, outline: "none", fontFamily: "inherit",
              }}
            />
          )}

          {easterEgg && (
            <div style={{
              background: "rgba(124,58,237,0.15)", border: "2px solid #7c3aed",
              borderRadius: 12, padding: "16px", textAlign: "center",
              color: "#c084fc", fontSize: 15, fontStyle: "italic",
            }}>
              🐄 Baycow her şeyi biliyor. Bekle...
            </div>
          )}

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={handleRestart} style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "2px solid #334155",
              background: "#1e293b", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}>
              🔄 Yeniden Başla
            </button>
            <button onClick={() => { setText(""); setTyped(""); setStarted(false); setEasterEgg(false); clearInterval(timerRef.current); }} style={{
              flex: 1, padding: "12px", borderRadius: 10, border: "2px solid #334155",
              background: "#1e293b", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 14,
            }}>
              ← Konu Seç
            </button>
          </div>
        </div>
      )}

      {/* Easter Egg Result */}
      {eggDone && (
        <div style={{ width: "100%", maxWidth: 560, textAlign: "center" }}>
          <div style={{
            background: "linear-gradient(135deg, #1a0533, #1e293b)",
            border: "2px solid #7c3aed", borderRadius: 20, padding: "40px 32px",
            boxShadow: "0 0 60px rgba(124,58,237,0.4)",
          }}>
            <div style={{ fontSize: 72, marginBottom: 8 }}>🐄</div>
            <h2 style={{ fontSize: 28, fontWeight: 900, margin: "0 0 4px", color: "#c084fc" }}>BAYCOW KODU BULUNDU!</h2>
            <p style={{ color: "#94a3b8", fontSize: 14, margin: "8px 0 24px" }}>
              Sen kodu buldun, Baycow gerisini halletti 😎
            </p>

            <div style={{ display: "flex", gap: 12, marginBottom: 24, justifyContent: "center" }}>
              {[
                { label: "Baycow WPM", value: eggWpm, color: "#c084fc" },
                { label: "Doğruluk", value: "∞%", color: "#4ade80" },
                { label: "Hata", value: "0 🐄", color: "#38bdf8" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "#0f172a", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 26, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleRestart} style={{
                padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(90deg, #7c3aed, #db2777)",
                color: "#fff", fontWeight: 800, cursor: "pointer", fontSize: 16,
              }}>
                🔄 Adil Şekilde Tekrar Dene
              </button>
              <button onClick={() => { setText(""); setTyped(""); setStarted(false); setFinished(false); setEggDone(false); setEasterEgg(false); clearInterval(timerRef.current); }} style={{
                padding: "14px", borderRadius: 12, border: "2px solid #334155",
                background: "#1e293b", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 15,
              }}>
                🎲 Yeni Metin Dene
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Normal Results */}
      {finished && !easterEgg && grade && (
        <div style={{ width: "100%", maxWidth: 500, textAlign: "center", display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: "#1e293b", border: "2px solid #334155", borderRadius: 20, padding: "40px 32px",
          }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🏁</div>
            <h2 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 4px", color: grade.color }}>{grade.label}</h2>

            <div style={{ display: "flex", gap: 16, margin: "24px 0", justifyContent: "center" }}>
              {[
                { label: "WPM", value: wpm, color: "#38bdf8" },
                { label: "Doğruluk", value: `${accuracy}%`, color: "#22c55e" },
                { label: "Süre", value: `${elapsedTime}s`, color: "#818cf8" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "#0f172a", borderRadius: 12, padding: "16px 20px" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color }}>{value}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button onClick={handleRestart} style={{
                padding: "14px", borderRadius: 12, border: "none",
                background: "linear-gradient(90deg, #38bdf8, #818cf8)",
                color: "#0f172a", fontWeight: 800, cursor: "pointer", fontSize: 16,
              }}>
                🔄 Aynı Metni Tekrar Dene
              </button>
              <button onClick={() => { setText(""); setTyped(""); setStarted(false); setFinished(false); clearInterval(timerRef.current); }} style={{
                padding: "14px", borderRadius: 12, border: "2px solid #334155",
                background: "#1e293b", color: "#94a3b8", fontWeight: 600, cursor: "pointer", fontSize: 15,
              }}>
                🎲 Yeni Metin Dene
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
