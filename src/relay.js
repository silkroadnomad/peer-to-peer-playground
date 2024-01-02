/* eslint-disable no-console */

import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
import { mplex } from '@libp2p/mplex'
import { webSockets } from '@libp2p/websockets'
import * as filters from '@libp2p/websockets/filters'
import { createLibp2p } from 'libp2p'
import {circuitRelayServer, circuitRelayTransport} from 'libp2p/circuit-relay'
import { identifyService } from 'libp2p/identify'
// import {bootstrap} from "@libp2p/bootstrap";
import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
import {gossipsub} from "@chainsafe/libp2p-gossipsub";
import {webRTC, webRTCDirect} from "@libp2p/webrtc";
import {webTransport} from "@libp2p/webtransport";
import { autoNAT } from '@libp2p/autonat'
const topics = [
    `dcontact._peer-discovery._p2p._pubsub`, // It's recommended but not required to extend the global space
    // '_peer-discovery._p2p._pubsub' // Include if you want to participate in the global space
]
const server = await createLibp2p({
    addresses: {
        listen: [
            '/ip4/127.0.0.1/tcp/12313/ws',
            '/ip4/0.0.0.0/udp/56093/webrtc/certhash/uEiByaEfNSLBexWBNFZy_QB1vAKEj7JAXDizRs4_SnTflsQ',
            "/ws","/wss","/webrtc"
            // '/ip4/127.0.0.1/p2p/4001/QmRelay/p2p-circuit',
        //    '/ip4/127.0.0.1/udp/4004/webrtc-direct'
        ]
    },
    transports: [
        webSockets({
            filter: filters.all
        }),
        webRTC({
            rtcConfiguration: {
                iceServers:[{
                    urls: [
                        'stun:stun.l.google.com:19302',
                        'stun:global.stun.twilio.com:3478'
                    ]
                }]
            }
        }),
        webRTCDirect(),
        webTransport(),
        circuitRelayTransport({
            discoverRelays: 2
        })
    ],
    connectionEncryption: [noise()],
    streamMuxers: [yamux()],
    peerDiscovery: [
        // bootstrap(bootstrapConfig),
        pubsubPeerDiscovery({
            interval: 10000,
            topics: topics, // defaults to ['_peer-discovery._p2p._pubsub']
            listenOnly: false
        })
    ],
    services: {
        autoNAT: autoNAT(),
        identify: identifyService(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true }),
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
