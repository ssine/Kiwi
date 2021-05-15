import React, { CSSProperties } from 'react'

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
    <input
      placeholder={placeholder}
      defaultValue={defaultValue}
      value={value}
      disabled={disabled}
      style={style}
      onChange={evt => {
        onChange && onChange(evt.target.value)
      }}
    ></input>
  )
}
