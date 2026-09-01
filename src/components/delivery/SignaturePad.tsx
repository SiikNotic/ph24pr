import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Eraser } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const { t } = useTranslation()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    // Render crisply at device pixel ratio without distorting the drawing surface.
    const ratio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * ratio
    canvas.height = rect.height * ratio
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(ratio, ratio)
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = '#111827'
    }
  }, [])

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    drawingRef.current = true
    const { x, y } = pointerPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const { x, y } = pointerPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    if (!hasDrawn) setHasDrawn(true)
  }

  function finishStroke() {
    if (!drawingRef.current) return
    drawingRef.current = false
    if (canvasRef.current) onChange(canvasRef.current.toDataURL('image/png'))
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    onChange(null)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative overflow-hidden rounded-lg border border-border bg-white">
        <canvas
          ref={canvasRef}
          className="h-40 w-full touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishStroke}
          onPointerLeave={finishStroke}
        />
        {!hasDrawn && (
          <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-neutral-400">
            {t('delivery.signHere')}
          </p>
        )}
      </div>
      <Button variant="outline" size="sm" className="self-start" onClick={clear} disabled={!hasDrawn}>
        <Eraser className="h-3.5 w-3.5" /> {t('common.clear')}
      </Button>
    </div>
  )
}
