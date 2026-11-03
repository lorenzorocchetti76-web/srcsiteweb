import { useEffect, useState } from "react";
import Minimap from "@/components/Minimap";
import { toggleAudio } from "@/utils/audio";

const PHASES = ["Roma", "New York", "Londra", "Dubai", "Mosca"];

export default function Overlay({ loadPct, ready, failed }) {
  const [active, setActive] = useState(0);
  const [hintGone, setHintGone] = useState(false);
  const [audioOn, setAudioOn] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const secs = document.querySelectorAll("[data-panel]");
      let best = 1, bd = Infinity;
      secs.forEach((s, i) => {
        const dd = Math.abs(s.getBoundingClientRect().top + s.offsetHeight / 2 - window.innerHeight / 2);
        if (dd < bd) { bd = dd; best = i; }
      });
      setActive(Math.max(0, Math.min(PHASES.length - 1, best - 1)));
      if (window.scrollY > 60) setHintGone(true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = (i) => {
    const s = document.querySelector(`[data-panel="${i + 1}"]`);
    if (s) window.scrollTo({ top: s.offsetTop, behavior: "smooth" });
  };

  return (
    <>
      <header className="ov-header">
        <a className="ov-logo" href="/" data-testid="logo">
          <span>Studio Rocchetti Comunicazione</span>
        </a>
        <div className="ov-actions">
          <button
            className={"ov-audio" + (audioOn ? " on" : "")}
            data-testid="audio-toggle"
            aria-label={audioOn ? "Disattiva audio" : "Attiva audio"}
            aria-pressed={audioOn}
            onClick={async () => setAudioOn(await toggleAudio())}
          >
            {audioOn ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
                <path d="M15.5 8.5a5 5 0 0 1 0 7" />
                <path d="M18.5 5.5a9 9 0 0 1 0 13" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M11 5 6 9H2v6h4l5 4V5z" fill="currentColor" stroke="none" />
                <line x1="16" y1="9" x2="22" y2="15" />
                <line x1="22" y1="9" x2="16" y2="15" />
              </svg>
            )}
          </button>
          <button className="ov-classic" data-testid="link-galleria" onClick={() => goTo(0)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", font: "inherit", letterSpacing: "inherit", textTransform: "inherit" }}>Galleria</button>
        </div>
      </header>

      <nav className="ov-dots" aria-label="Galleria — le 5 città">
        {PHASES.map((name, i) => (
          <button
            key={name}
            data-testid={"dot-" + i}
            className={"dot" + (active === i ? " on" : "")}
            onClick={() => goTo(i)}
            aria-label={name}
          />
        ))}
      </nav>

      <div className={"ov-hint" + (hintGone ? " gone" : "")} data-testid="hint">
        Scorri e scopri · Trascina per guardare · Tocca gli elementi
      </div>

      <Minimap active={active} />

      {!ready && !failed && (
        <div className="ov-loader" data-testid="loader">
          <svg viewBox="0 0 64 64" width="44" height="44" aria-hidden="true">
            <rect width="64" height="64" rx="14" fill="#224d8a" />
            <circle cx="32" cy="32" r="9" fill="#f6f6f4" />
          </svg>
          <p>Preparazione degli ambienti</p>
          <div className="bar"><i style={{ width: loadPct + "%" }} /></div>
          <span className="pct" data-testid="loader-pct">{loadPct}%</span>
        </div>
      )}

      {failed && (
        <div className="ov-loader" data-testid="webgl-error">
          <p>Esperienza 3D non disponibile su questo dispositivo.</p>
          <a className="ov-classic" href="/landing.html">Apri la versione classica ↗</a>
        </div>
      )}
    </>
  );
}
