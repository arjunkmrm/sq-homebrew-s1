import { useEffect, useId, useRef, useState } from 'react'

export function RunPicker({ value, options, onChange }: { value: string; options: { value: string; label: string }[]; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const id = useId()
  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', close)
    const buttons = list.current?.querySelectorAll<HTMLButtonElement>('button')
    buttons?.[Math.max(0, options.findIndex(option => option.value === value))]?.focus()
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  return <div className="run-picker" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false) }} onKeyDown={event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus() }
    if (open && ['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation()
      const buttons = Array.from(list.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])
      const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
      buttons[next]?.focus()
    }
  }}>
    <button ref={trigger} className="run-picker-trigger" aria-label="Inspect run" aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(current => !current)} onKeyDown={event => { if (!open && ['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); setOpen(true) } }}><span>{options.find(option => option.value === value)?.label}</span><svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></button>
    {open && <div className="run-picker-menu" id={id} role="menu" aria-label="Select run" ref={list}>{options.map(option => <button key={option.value} role="menuitemradio" aria-checked={option.value === value} onClick={() => { onChange(option.value); setOpen(false); trigger.current?.focus() }}><span className="run-picker-check">{option.value === value ? '✓' : ''}</span><span>{option.label}</span></button>)}</div>}
  </div>
}
