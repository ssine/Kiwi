import React, { useEffect, useState } from 'react'
import { getSkinnyItems, getSystemItems } from './api'
import { ClientItem } from './ClientItem'
import { ItemFlow } from './components/ItemFlow'

export const App = () => {
  return <div><ItemFlow /></div>
}
