import { eventBus } from '../eventBus'
import React, { useEffect, useReducer, useState } from 'react'
import { IconButton } from './basic/Button/IconButton'

export enum MessageType {
  error,
  warning,
  info,
  success,
}

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

type Message = {
  type: MessageType
  text: string
  id?: number
  liveSecond?: number
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

const reduceMessages = (
  messages: Message[],
  action: { type: 'show'; message: Message } | { type: 'dismiss'; id: number }
) => {
  switch (action.type) {
    case 'show':
      return [...messages, action.message]
    case 'dismiss':
      const idx = messages.findIndex(msg => msg.id === action.id)
      if (idx !== -1) {
        messages.splice(idx, 1)
        return [...messages]
      }
      return messages

    default:
      throw new Error()
  }
}

let messageCount = 0

export const MessageList = () => {
  const [messages, dispatch] = useReducer(reduceMessages, [])

  useEffect(() => {
    eventBus.on('show-message', (data: Message) => {
      data.id = messageCount++
      dispatch({
        type: 'show',
        message: data,
      })
      if (data.liveSecond) {
        setTimeout(() => {
          dispatch({
            type: 'dismiss',
            id: data.id,
          })
        }, data.liveSecond * 1000)
      }
    })
  }, [])

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
          onClick={() => dispatch({ type: 'dismiss', id: props.id })}
          styles={{ root: { width: 30, height: 30 }, icon: { fontSize: 20 } }}
        />
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {messages.map((msg: Message, idx: number) => (
        <MessageBar {...{ ...msg, idx }} key={msg.id} />
      ))}
    </div>
  )
}

export const showMessage = (type: MessageType, text: string, liveSecond?: number) => {
  eventBus.emit('show-message', { type, text, liveSecond })
}
