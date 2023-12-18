import {webSockets} from "@libp2p/websockets";
import * as filters from "@libp2p/websockets/filters";
import {webRTC, webRTCDirect} from "@libp2p/webrtc";
import {webTransport} from "@libp2p/webtransport";
import { bootstrap } from '@libp2p/bootstrap'
import {circuitRelayTransport,circuitRelayServer} from "libp2p/circuit-relay";
import {noise} from "@chainsafe/libp2p-noise";
import {yamux} from "@chainsafe/libp2p-yamux";
import {mplex} from "@libp2p/mplex";
import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
import {identifyService} from "libp2p/identify";
import {autoNATService} from "libp2p/autonat";
import {gossipsub} from "@chainsafe/libp2p-gossipsub";
import { pingService } from 'libp2p/ping'
import { dcutrService } from 'libp2p/dcutr'
import { kadDHT } from '@libp2p/kad-dht'
import { FaultTolerance } from '@libp2p/interface-transport'

export const dialMultiaddrItems =  [
    { id: "/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiBcDqgg_PQNURYgEM7UG2xuWSy-cXyvFiWp1EMDuS0gug/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM", text: "/ip4/159.69.119.82/udp/4004/webrtc-direct"},
    { id: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiDeKwbKVMTtb6W4ehAZNnMoU6ar5tcrM7kJENlWx9jh_w/certhash/uEiAP75UYHU9lxxeQ43_u3U7PrL3eeb0aOBfw2ty7CjuSUA/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",text:"/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/"}
]

const multiaddrs = [
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
    '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
];
const bootstrapConfig = {list: multiaddrs};
export const config = {
    addresses: {
        // swarm: [address],
        listen: [
            "/webrtc", "/wss", "/ws",
        ]
    },
    transports: [
        webSockets({filter: filters.all}),
        webRTC(),
        webRTCDirect(),
        webTransport(),
        circuitRelayTransport({discoverRelays: 1}),
        // circuitRelayServer({
        //         advertise: true
        // }),
        //kadDHT({filter: filters.all}),
        ],
    connectionEncryption: [noise()],
    transportManager: {
        faultTolerance: FaultTolerance.NO_FATAL
    },
    streamMuxers: [yamux(),mplex()],
    connectionGater: {
        denyDialMultiaddr: () => {
            return false
        }
    },
    peerDiscovery: [
        bootstrap(bootstrapConfig),
        pubsubPeerDiscovery()
    ],
    services: {
        ping: pingService({
            protocolPrefix: 'ipfs', // default
        }),
        identify: identifyService(),
        autoNAT: autoNATService(),
        dcutr: dcutrService(),
        pubsub: gossipsub({allowPublishToZeroPeers: true, canRelayMessage: true}),
        dht: kadDHT({
            protocolPrefix: "/svelte-pubsub",
            maxInboundStreams: 5000,
            maxOutboundStreams: 5000,
            clientMode: true,
        }),
    }
}