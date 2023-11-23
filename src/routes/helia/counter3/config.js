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

// const address = "/dns4/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star'"
const multiaddrs = [ //add your own WebRTC Stars Servers here too!
'/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiAiA85j55j1DxtLpibTJsk8A_hXKCCFrd1n4ceEjxC6Sw/certhash/uEiDeKwbKVMTtb6W4ehAZNnMoU6ar5tcrM7kJENlWx9jh_w/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM/p2p-circuit/webrtc/p2p/12D3KooWQ765wD1mnrYMW5Ahe2YfxzV3s2pyUwkEAAkXXJndtvn8'
    // '/ip4/65.21.180.203/udp/4004/webrtc-direct/certhash/uEiB4P97Mk0CSYGSSgX5JnMRM6PKRq9NckCB3XRJUqiflsw/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t',
    // '/dnsaddr/ipfs.le-space.de/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t',
//            '/ip4/65.21.180.203/tcp/4003/p2p-circuit/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t'
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
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