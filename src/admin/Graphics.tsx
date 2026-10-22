import React from 'react'

/** The Theia mark: an iris made of two arcs around a pupil. */
function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="16" r="15" fill="#0B3B5C" />
      <path d="M5 16c3.2-5.4 7-8 11-8s7.8 2.6 11 8c-3.2 5.4-7 8-11 8s-7.8-2.6-11-8z" fill="#fff" />
      <circle cx="16" cy="16" r="5.2" fill="#0E9F9A" />
      <circle cx="16" cy="16" r="2.2" fill="#0B3B5C" />
    </svg>
  )
}

export function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Mark size={44} />
      <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>Theia</span>
    </div>
  )
}

export function Icon() {
  return <Mark size={26} />
}
