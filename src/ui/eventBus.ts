import { EventEmitter } from 'events'

/**
 * List of events:
 * 
 * - item-flow-layout
 * - item-link-clicked
 * - item-close-clicked
 * - create-item-clicked
 * - item-displaied
 * - item-closed
 * 
 */
const eventBus = new EventEmitter()

export default eventBus
