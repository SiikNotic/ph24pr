// Hands turn-by-turn off to the device's own maps app instead of
// reimplementing routing — the correct approach here, not a shortcut: it
// works with nothing but a text address (this app has no geocoding
// pipeline for customer addresses) and gives the driver whatever app they
// already navigate with day to day.
export function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`
}
