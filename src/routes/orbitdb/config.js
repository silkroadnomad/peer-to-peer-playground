import {webSockets} from "@libp2p/websockets";
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
        // bootstrap(bootstrapConfig),
        pubsubPeerDiscovery()
    ],
    services: {
        identify: identifyService(),
        autoNAT: autoNATService(),
        pubsub: gossipsub({allowPublishToZeroPeers: true, canRelayMessage: true})
    }
}