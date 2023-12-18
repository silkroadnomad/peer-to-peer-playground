import {webSockets} from "@libp2p/websockets";
import { bootstrap } from '@libp2p/bootstrap'
import * as filters from "@libp2p/websockets/filters";
import {webRTC, webRTCDirect} from "@libp2p/webrtc";
import {webTransport} from "@libp2p/webtransport";
import {circuitRelayTransport} from "libp2p/circuit-relay";
import {noise} from "@chainsafe/libp2p-noise";
import {yamux} from "@chainsafe/libp2p-yamux";
import {mplex} from "@libp2p/mplex";
import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
import {identifyService} from "libp2p/identify";
import {autoNATService} from "libp2p/autonat";
import {gossipsub} from "@chainsafe/libp2p-gossipsub";

const multiaddrs = [ //add your own WebRTC Stars Servers here too!
    "/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiBcDqgg_PQNURYgEM7UG2xuWSy-cXyvFiWp1EMDuS0gug/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
    "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiDeKwbKVMTtb6W4ehAZNnMoU6ar5tcrM7kJENlWx9jh_w/certhash/uEiAP75UYHU9lxxeQ43_u3U7PrL3eeb0aOBfw2ty7CjuSUA/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
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
        // the WebSocket transport lets us dial a local relay
        webSockets({
            filter: filters.all                     // this allows non-secure WebSocket connections for purposes of the demo
        }),
        webRTC(),
        webRTCDirect(),
        webTransport(),
        circuitRelayTransport({discoverRelays: 1})
    ],
    connectionEncryption: [noise()],

    streamMuxers: [
        yamux(),
        mplex()
    ],
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
        identify: identifyService(),
        autoNAT: autoNATService(),
        pubsub: gossipsub({allowPublishToZeroPeers: true, canRelayMessage: true})
    }
}