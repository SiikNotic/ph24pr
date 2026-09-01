import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

// Renders its children into a dedicated node appended directly to <body>,
// as a sibling of #root — not nested inside it. That's what lets the print
// stylesheet (see index.css) hide the entire app and show only this node's
// contents while printing, regardless of how deeply the trigger is nested
// in the component tree.
export function PrintPortal({ children }: { children: React.ReactNode }) {
  const [node] = useState(() => {
    const el = document.createElement('div')
    el.className = 'print-portal'
    return el
  })

  useEffect(() => {
    document.body.appendChild(node)
    return () => {
      document.body.removeChild(node)
    }
  }, [node])

  return createPortal(children, node)
}
