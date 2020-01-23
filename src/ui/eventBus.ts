import { EventEmitter } from 'events'

/**
 * List of events and their arguments:
 * 
 * ---   UI Category   ---
 * 
 * item-flow-layout:
 *   triggered when the item-flow div was rerendered, so that other childs can
 *   animate to ease their motion.
 * 
 * item-displaied:
 *   triggered when an item was displaied in item flow.
 *   
 * item-closed:
 *   triggered when an item was removed from item flow
 * 
 * ---   Control Category   ---
 * 
 * item-link-clicked:
 *   triggered when a link pointing to an item is clicked.
 * 
 *   emitterURI: URI of the item where this link was clicked. empty if clicked elsewhere.
 *   targetURI: URI of clicked link
 *
 * item-close-clicked:
 *   triggered when close button of an item is clicked.
 * 
 *   uri: URI of the item whose close button was clicked
 * 
 * item-delete-clicked:
 *   triggered when delete button of an item is clicked.
 * 
 *   uri: URI of the item whose delete button was clicked
 * 
 * create-item-clicked:
 *   triggered when create button is clicked.
 * 
 *   uri: custom uri for new items to override default one.
 * 
 * ---   Data Transfer Category   ---
 * 
 * search-triggered:
 *   triggered when a search is submitted.
 * 
 *   input: the search string
 *   token: string to append in return event
 * 
 *  Return event:  search-result-[token]
 *    
 *    items: ClientItems[]
 * 
 * Relayed messages --- triggered by bus when events in a category is triggered.
 * 
 * item-tree-changed:
 *   triggered when the structure of item tree is changed, including the creation
 *   and deletion of items.
 * 
 */
const eventBus = new EventEmitter()

eventBus.on('item-delete-clicked', () => eventBus.emit('item-tree-changed'))
eventBus.on('create-item-clicked', () => eventBus.emit('item-tree-changed'))

export default eventBus
