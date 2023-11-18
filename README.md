# Le Space - Peer-To-Peer Playground

since there are a lot of questions and projects are developing either too fast or too slow,
this is should be a collection of Svelte components which work with peer-to-peer libs such as
- libp2p (https://libp2p.io/)
- Helia (js-ipfs)  (https://helia.io/)

wer are planning to put:
- OrbitDB (orbitdb) (https://github.com/orbitdb/orbitdb)
- Canvas (https://www.canvas.xyz/)
- Fission (https://fission.codes/)
- Nostr (https://nostr.com/)
- Waku (https://waku.org/)

All the code examples here don't use any server. Everything can be and will be hosted on IPFS only. (right now its hosted on vercel for simplicity ;)
(description on how to do this in Svelte follows )

1. Create a simple counter with Helia (IPFS)
2. libp2p example (connection tester for webrtc, webtransport and pubsub between browsers) 

# Resources 
## storage helia 
- https://codesandbox.io/s/helia-101-pv26zb?file=/201-storage.js
- https://www.npmjs.com/package/blockstore-idb
    
## webrtc / circuit-relay
- Hello Helia - achingbrain https://www.youtube.com/watch?v=T_FlhkLSgH8
- interesting read about webrtc between browsers via circuit-relay https://discuss.ipfs.tech/t/connection-closes-during-bitswap-fetches/17041/5
- js-libp2p example circuit-relay https://github.com/libp2p/js-libp2p-example-circuit-relay