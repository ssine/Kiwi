import { EventEmitter } from 'events'

/**
 * List of events and their arguments:
 * 
 * item-flow-layout:
 *   triggered when the item-flow div was rerendered, so that other childs can
 *   animate to ease their motion.
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
 * item-displaied:
 *   triggered when an item was displaied in item flow.
 *   
 * item-closed:
 *   triggered when an item was removed from item flow
 */
const eventBus = new EventEmitter()

export default eventBus
