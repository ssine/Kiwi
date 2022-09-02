import Painterro from 'painterro'
import React, { useRef, useEffect, useState } from 'react'
import { sleep } from '../../../core/Common'
import { MIME } from '../../../core/MimeType'
import { stringHash } from '../../Common'

export type BitmapEditorProps = {
  uri: string
  mimeType: MIME
  setContent: (v: File) => void
}

// TODO: support Ctrl+S saving
export const BitmapEditor = (props: BitmapEditorProps) => {
  const painterRef = useRef<any>(null)
  const [divId, setDivId] = useState('')

  useEffect(() => {
    ;(async () => {
      // use hashed uri as div id to prevent selector errors
      const hashUri = `painterro-${await stringHash(props.uri)}`
      setDivId(hashUri)
      // HACK: wait for dom change
      await sleep(50)
      const p = Painterro({
        id: hashUri,
        hiddenTools: ['save', 'open', 'close'],
        onChange: (expImg: any) => {
          const blob = expImg.image.asBlob()
          props.setContent(new File([blob], 'dummyname'))
        },
      })
      p.show(`/raw/${props.uri}`)
      painterRef.current = p
    })()

    return () => {
      painterRef.current?.hide()
    }
  }, [])

  return <div id={divId} style={{ height: '100%', width: '100%', position: 'relative' }}></div>
}
