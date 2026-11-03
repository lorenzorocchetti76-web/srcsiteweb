const CITIES = [
  { name: "Roma", lon: 12.5, lat: 41.9 },
  { name: "New York", lon: -74, lat: 40.7 },
  { name: "Londra", lon: -0.1, lat: 51.5 },
  { name: "Dubai", lon: 55.3, lat: 25.2 },
  { name: "Mosca", lon: 37.6, lat: 55.7 },
];

const CONTINENTS = [
  "M20,55 L45,25 L80,20 L95,35 L85,55 L70,75 L55,80 L40,70 L25,65 Z",
  "M70,90 L85,85 L95,100 L90,125 L78,142 L70,120 Z",
  "M165,50 L180,40 L195,45 L200,60 L185,70 L170,65 Z",
  "M165,75 L195,72 L210,90 L205,120 L190,136 L175,115 L165,95 Z",
  "M200,40 L260,24 L310,30 L322,55 L300,75 L270,80 L240,70 L210,60 Z",
  "M285,115 L315,110 L325,130 L305,146 L288,135 Z",
];

export default function Minimap({ active }) {
  const X = (lon) => ((lon + 180) / 360) * 360;
  const Y = (lat) => ((90 - lat) / 180) * 180;
  return (
    <div className="minimap" data-testid="minimap">
      <span className="mm-label" data-testid="mm-label">{CITIES[active].name}</span>
      <svg viewBox="0 0 360 180" aria-hidden="true">
        {CONTINENTS.map((p, i) => (
          <path key={i} d={p} fill="rgba(255,255,255,.16)" />
        ))}
        {CITIES.map((c, i) => (
          <g key={c.name}>
            {active === i && (
              <circle className="mm-pulse" cx={X(c.lon)} cy={Y(c.lat)} r="8" />
            )}
            <circle
              className={"mm-dot" + (active === i ? " on" : "")}
              cx={X(c.lon)}
              cy={Y(c.lat)}
              r={active === i ? 4.5 : 2.8}
              data-testid={"mm-" + i}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
