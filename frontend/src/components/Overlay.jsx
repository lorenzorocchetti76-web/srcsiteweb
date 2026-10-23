import { useEffect, useState } from "react";

const PHASES = ["Ascolto", "Strategia", "Sviluppo", "Lancio", "Misurazione"];

export default function Overlay({ loadPct, ready, failed }) {
  const [active, setActive] = useState(0);
  const [hintGone, setHintGone] = useState(false);

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
          <span>Studio Rocchetti &amp; Partners</span>
        </a>
        <a className="ov-classic" href="/landing.html" data-testid="link-classic">Versione classica ↗</a>
      </header>

      <nav className="ov-dots" aria-label="Le 5 fasi">
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
