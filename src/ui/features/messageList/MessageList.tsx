import { dismissMessage, Message, MessageType } from './messageListSlice'
import React from 'react'
import { IconButton } from '../../components/basic/Button/IconButton'
import { useAppDispatch, useAppSelector } from '../../store'

const iconMap = {
  [MessageType.error]: 'ErrorBadge',
  [MessageType.warning]: 'Warning',
  [MessageType.info]: 'Info',
  [MessageType.success]: 'Completed',
}

const bgColorMap = {
  [MessageType.error]: 'rgb(253, 231, 233)',
  [MessageType.warning]: 'rgb(254, 217, 204)',
  [MessageType.info]: 'rgb(243, 242, 241)',
  [MessageType.success]: 'rgb(223, 246, 221)',
}

const containerStyle: React.CSSProperties = {
  width: 700,
  position: 'fixed',
  top: 20,
  left: 0,
  right: 0,
  marginLeft: 'auto',
  marginRight: 'auto',
  zIndex: 10,
}

export const MessageList = () => {
  const messages = useAppSelector(s => s.messages)
  const dispatch = useAppDispatch()

  const MessageBar = (props: Message) => {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          marginTop: 5,
          backgroundColor: bgColorMap[props.type],
        }}
      >
        <i className={`ms-Icon ms-Icon--${iconMap[props.type]}`} style={{ paddingLeft: 10 }} />
        <div style={{ flexGrow: 1, paddingLeft: 10 }}>{props.text}</div>
        <IconButton
          iconName="Cancel"
          onClick={() => dispatch(dismissMessage(props.id))}
          styles={{ root: { width: 30, height: 30 }, icon: { fontSize: 20 } }}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {messages.map((msg: Message, idx: number) => (
        <MessageBar {...msg} key={msg.id} />
      ))}
    </div>
  )
}
