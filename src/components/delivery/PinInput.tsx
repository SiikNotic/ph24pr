import { useRef } from 'react'

export function PinInput({ value, onChange, length = 4 }: { value: string; onChange: (v: string) => void; length?: number }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  function setDigit(index: number, digit: string) {
    const clean = digit.replace(/\D/g, '').slice(-1)
    const chars = value.padEnd(length, ' ').split('')
    chars[index] = clean || ' '
    const next = chars.join('').replace(/ +$/, '')
    onChange(next)
    if (clean && index < length - 1) refs.current[index + 1]?.focus()
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      refs.current[index - 1]?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (pasted) {
      e.preventDefault()
      onChange(pasted)
      refs.current[Math.min(pasted.length, length - 1)]?.focus()
    }
  }

  return (
    <div className="flex gap-2" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => setDigit(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-14 w-12 rounded-md border border-input bg-background text-center text-2xl font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      ))}
    </div>
  )
}
