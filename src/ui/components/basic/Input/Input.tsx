import React, { CSSProperties } from 'react'
import './Input.css'

export const Input = (props: {
  placeholder?: string
  defaultValue?: string
  value?: string
  disabled?: boolean
  onChange?: (val: string) => void
  style?: CSSProperties
}) => {
  const { placeholder, defaultValue, value, onChange, style, disabled } = props
  return (
    <div style={style}>
      <input
        className="kiwi-input"
        placeholder={placeholder}
        defaultValue={defaultValue}
        value={value}
        style={{
          paddingTop: 0,
          paddingRight: 0,
          paddingBottom: 0,
          paddingLeft: 5,
          borderTop: 'none',
          borderRight: 'none',
          borderLeft: 'none',
          borderBottom: '2px solid var(--lineColor)',
          width: 'calc(100% - 5px)',
          height: 'calc(100% - 2px)',
        }}
        disabled={disabled}
        onChange={evt => {
          onChange && onChange(evt.target.value)
        }}
      />
    </div>
  )
}
