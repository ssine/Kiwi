import React, { CSSProperties } from 'react'
import './Slider.css'

export const Slider = (props: {
  defaultValue?: number
  value?: number
  range: [number, number]
  disabled?: boolean
  onChange?: (val: string) => void
  style?: CSSProperties
}) => {
  const { defaultValue, value, range, onChange, style, disabled } = props
  return (
    <div style={style}>
      <input
        type="range"
        min={range[0]}
        max={range[1]}
        defaultValue={defaultValue}
        value={value}
        className="kiwi-slider"
        disabled={disabled}
        onChange={evt => {
          onChange && onChange(evt.target.value)
        }}
      />
    </div>
  )
}
