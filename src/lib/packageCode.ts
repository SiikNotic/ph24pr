// Generates the client-side identity for a package: a globally unique id,
// a short human-readable code derived from it, and the QR payload that
// encodes enough to look the package up. Generated once at creation time —
// reprinting a label must always reuse these same values, never regenerate
// them, so a failed/damaged print never produces a duplicate package.
export function generatePackageIdentity() {
  const id = crypto.randomUUID()
  const code = `PK-${id.slice(0, 8).toUpperCase()}`
  const qrPayload = `MEDROUTE:PKG:${id}`
  return { id, code, qrPayload }
}
