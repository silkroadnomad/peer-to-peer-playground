/* eslint-disable no-console */

import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { createLibp2p } from 'libp2p'
import { circuitRelayServer } from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'

const server = await createLibp2p({
    addresses: {
        listen: ['/ip4/127.0.0.1/tcp/12312/ws']
    },
    transports: [
        webSockets({
            filter: filters.all
        })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux(), mplex()],
    services: {
        identify: identifyService(),
        relay: circuitRelayServer({
            reservations: {
                // this allows us to reload the browser repeatedly without exhausting
                // the relay's reservation slots - in production you should specify a
                // limit here or accept the default of 15
                maxReservations: Infinity
            }
        })
    }
})

console.log('Relay listening on multiaddr(s): ', server.getMultiaddrs().map((ma) => ma.toString()))
