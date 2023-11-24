import { writable } from 'svelte/store'

export const showNotification =  writable()
export const notificationMessage = writable()
export const listeningAddressList = writable([])
export const peerConnectionsList = writable([])

export const libp2p = writable()
