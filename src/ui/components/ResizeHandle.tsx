import React, { LegacyRef } from 'react'

export const ResizeHandle = React.forwardRef(
  (
    props: {
      orientation: 'horizontal' | 'vertical'
      thickness: number
      handleAxis: string
      showDots: boolean
    },
    ref: LegacyRef<HTMLDivElement>
  ) => {
    const { orientation, thickness, handleAxis, showDots, ...rest } = props
    return (
      <div
        ref={ref}
        className={`resizer-handle handle-${handleAxis}`}
        style={
          orientation === 'vertical'
            ? {
                width: thickness,
                height: '100%',
                cursor: 'ew-resize',
                textAlign: 'center',
                writingMode: 'vertical-lr',
                ...(showDots ? {} : { backgroundColor: 'var(--blockColorLight)' }),
              }
            : {
                width: '100%',
                height: thickness,
                cursor: 'ns-resize',
                textAlign: 'center',
                ...(showDots ? {} : { backgroundColor: 'var(--blockColorLight)' }),
              }
        }
        {...rest}
      >
        {showDots && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            style={
              orientation === 'vertical'
                ? {
                    transform: `rotate(90deg) translateY(${(1035 * thickness) / 157 / 2 - thickness / 2}px)`,
                    height: thickness,
                    width: (1035 * thickness) / 157,
                    fill: 'var(--blockColor)',
                  }
                : {
                    height: thickness,
                    display: 'block',
                    margin: 'auto',
                    width: (1035 * thickness) / 157,
                    fill: 'var(--blockColor)',
                  }
            }
            viewBox="0 0 1035 157"
          >
            <circle cx="78.281" cy="78.25" r="78.281" />
            <circle cx="517.281" cy="78.25" r="78.281" />
            <circle cx="956.28" cy="78.25" r="78.28" />
          </svg>
        )}
      </div>
    )
  }
)
