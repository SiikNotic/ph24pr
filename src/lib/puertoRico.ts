// Puerto Rico address helpers. This app is built for a single market
// (Puerto Rico), so customer addresses use the island's 78 municipios
// instead of a free-text city, and "state" is always Puerto Rico — there's
// no state selector to show.

export const PR_MUNICIPALITIES = [
  'Adjuntas', 'Aguada', 'Aguadilla', 'Aguas Buenas', 'Aibonito', 'Añasco',
  'Arecibo', 'Arroyo', 'Barceloneta', 'Barranquitas', 'Bayamón', 'Cabo Rojo',
  'Caguas', 'Camuy', 'Canóvanas', 'Carolina', 'Cataño', 'Cayey', 'Ceiba',
  'Ciales', 'Cidra', 'Coamo', 'Comerío', 'Corozal', 'Culebra', 'Dorado',
  'Fajardo', 'Florida', 'Guánica', 'Guayama', 'Guayanilla', 'Guaynabo',
  'Gurabo', 'Hatillo', 'Hormigueros', 'Humacao', 'Isabela', 'Jayuya',
  'Juana Díaz', 'Juncos', 'Lajas', 'Lares', 'Las Marías', 'Las Piedras',
  'Loíza', 'Luquillo', 'Manatí', 'Maricao', 'Maunabo', 'Mayagüez', 'Moca',
  'Morovis', 'Naguabo', 'Naranjito', 'Orocovis', 'Patillas', 'Peñuelas',
  'Ponce', 'Quebradillas', 'Rincón', 'Río Grande', 'Sabana Grande',
  'Salinas', 'San Germán', 'San Juan', 'San Lorenzo', 'San Sebastián',
  'Santa Isabel', 'Toa Alta', 'Toa Baja', 'Trujillo Alto', 'Utuado',
  'Vega Alta', 'Vega Baja', 'Vieques', 'Villalba', 'Yabucoa', 'Yauco',
] as const

// PR ZIP codes fall in the 006xx-009xx ranges (00601-00988, plus 009xx PO
// box ranges in San Juan). Loose enough to accept the real range without
// a giant lookup table; a trailing +4 is optional.
export function isValidPrZip(zip: string): boolean {
  return /^00[6-9]\d{2}(-\d{4})?$/.test(zip.trim())
}
