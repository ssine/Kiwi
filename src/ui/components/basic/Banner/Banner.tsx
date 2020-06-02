import React from 'react'

const barStyle = {flexGrow: 2, height: 2, backgroundColor: 'var(--blockColorLight)'}

const Banner: React.FC<{ text: string }> = (props) => {
  return <div 
  style={{
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center'
  }}
  className="kiwi-banner">
    <div style={barStyle}></div>
    <div style={{padding: '5px 10px 5px 10px', color: 'var(--lineColor)'}}>{props.text}</div>
    <div style={barStyle}></div>
  </div>
}

export { Banner }
