import React, { Children, CSSProperties, PropsWithChildren, ReactElement, useState } from 'react'
import { AttachDirection, Callout } from '../Callout/Callout'

const buttonStyle: CSSProperties = { width: '100%', height: '100%' }

const HEIGHT = 25

export const Select = (props: {
  value: string
  onSelect?: (value: string) => void
  disabled?: boolean
  style?: CSSProperties
  children?: ReactElement | ReactElement[]
}) => {
  const { value, children, onSelect, disabled, style } = props
  const [calloutVisible, setCalloutVisible] = useState(false)
  const options = Array.isArray(children) ? children : [children]

  const renderOption = (opt: ReactElement, indent?: boolean) => {
    const pad = indent ? 20 : 10
    return (
      <button
        style={{ height: HEIGHT, width: `calc(100% - ${pad}px)`, textAlign: 'left', paddingLeft: pad }}
        key={opt.props.value}
        onClick={() => onSelect && onSelect(opt.props.value)}
      >
        {opt.props.children}
      </button>
    )
  }
  const renderOptGroup = (optg: ReactElement) => {
    return (
      <>
        <div
          key={optg.props.label}
          style={{ height: HEIGHT, width: 'calc(100% - 10px)', paddingLeft: 10, display: 'flex', alignItems: 'center' }}
        >
          {optg.props.label}
        </div>
        <div>{optg.props.children.map(opt => renderOption(opt, true))}</div>
      </>
    )
  }

  return (
    <Callout
      visible={calloutVisible}
      direction={AttachDirection.bottomLeftEdge}
      onDismiss={() => setCalloutVisible(false)}
      wrapperStyle={style}
      alignWidth={true}
      content={options.map(opt => {
        if (opt.type === 'option') {
          return renderOption(opt)
        } else if (opt.type === 'optgroup') {
          return renderOptGroup(opt)
        }
      })}
    >
      <button style={buttonStyle} disabled={disabled} onClick={() => setCalloutVisible(true)}>
        {value}
      </button>
    </Callout>
  )
}
