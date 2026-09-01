import L from 'leaflet'

// react-leaflet's default marker images reference URLs that don't survive
// a Vite bundle (the classic "broken marker" issue) — we never use the
// default icon at all, only DivIcons built from our own tokens below, so
// there's nothing to patch. This file just centralizes those DivIcons so
// the fleet map and the driver's own "you are here" map render markers
// identically instead of each inventing their own.

// A small filled circle with a two-letter label — used for a driver's
// live position. `tone` picks the marker's ring/fill color; keep this to
// CSS custom properties (not hard-coded hex) so it matches both themes.
export function driverDivIcon(label: string, tone: 'primary' | 'warning' | 'muted' = 'primary') {
  const bg =
    tone === 'primary'
      ? 'var(--color-primary, #16a34a)'
      : tone === 'warning'
        ? 'var(--color-warning, #d97706)'
        : 'var(--color-muted-foreground, #737373)'
  return L.divIcon({
    className: 'medroute-driver-marker',
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:34px;height:34px;border-radius:9999px;
      background:${bg};color:#fff;font-weight:700;font-size:11px;
      box-shadow:0 0 0 3px color-mix(in oklab, ${bg} 25%, transparent), 0 2px 6px rgba(0,0,0,0.35);
      font-family:inherit;letter-spacing:-0.02em;
    ">${label}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  })
}

// A pulsing dot for "your current location" on the driver's own mini map —
// deliberately not the same look as a fleet driver marker (this one has no
// label; it's always "you").
export function selfLocationDivIcon() {
  return L.divIcon({
    className: 'medroute-self-marker',
    html: `<span style="position:relative;display:block;width:18px;height:18px;">
      <span style="position:absolute;inset:0;border-radius:9999px;background:var(--color-primary, #16a34a);opacity:0.35;animation:medroute-pulse 1.8s ease-out infinite;"></span>
      <span style="position:absolute;inset:4px;border-radius:9999px;background:var(--color-primary, #16a34a);box-shadow:0 0 0 2px #fff, 0 1px 4px rgba(0,0,0,0.4);"></span>
    </span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}
