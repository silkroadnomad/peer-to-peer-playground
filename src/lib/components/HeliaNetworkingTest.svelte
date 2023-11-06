<script>
    import { noise } from '@chainsafe/libp2p-noise'
    import { yamux } from '@chainsafe/libp2p-yamux'
    // import { unixfs } from '@helia/unixfs'
    import { bootstrap } from '@libp2p/bootstrap'
    // import { tcp } from '@libp2p/tcp'
    import { MemoryBlockstore } from 'blockstore-core'
    import { MemoryDatastore } from 'datastore-core'
    import { createHelia } from 'helia'
    import { createLibp2p } from 'libp2p'
    import { identifyService } from 'libp2p/identify'
    import {webSockets} from "@libp2p/websockets";
    import {all} from "@libp2p/websockets/filters";
    import {webRTC, webRTCDirect} from "@libp2p/webrtc";
    import {webTransport} from "@libp2p/webtransport";
    import {circuitRelayTransport} from "libp2p/circuit-relay";
    import { Dropdown,TextInput } from "carbon-components-svelte";
    import { pingService } from 'libp2p/ping'
    async function createNode () {
        // the blockstore is where we store the blocks that make up files
        const blockstore = new MemoryBlockstore()

        // application-specific data lives in the datastore
        const datastore = new MemoryDatastore()

        // libp2p is the networking layer that underpins Helia
        const libp2p = await createLibp2p({
            datastore,
            addresses: {
                listen: ['/webrtc', '/wss', '/ws']
            },
            transports: [
                webSockets({ filter: all }),
                webRTC(),
                webRTCDirect(),
                webTransport(),
                // https://github.com/libp2p/js-libp2p-websockets#libp2p-usage-example
                circuitRelayTransport({ discoverRelays: 3 })
            ],
            connectionEncryption: [
                noise()
            ],
            streamMuxers: [
                yamux()
            ],
            peerDiscovery: [
                bootstrap({
                    list: [
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
                        '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
                    ]
                })
            ],
            services: {
                identify: identifyService(),
                ping: pingService()
            }
        })

        return await createHelia({
            datastore,
            blockstore,
            libp2p
        })
    }

    // create two helia nodes
    let node1,node2
    let connectedPeers = []
    let myMultiAddrs;
    let id, pingPeerId;
    // $:node1?console.log("node1.libp2p.getMultiaddrs()",node1.libp2p.peerDiscovery.join().getMultiaddrs()):''

    $: {
        if(node1){
            // console.log("node1 connected",node1)
            // Listen for new peers
            node1.libp2p.addEventListener("peer:discovery", (evt) => {
                console.log("peer:discovery",evt.detail.id.toString())
                myMultiAddrs = node1.libp2p.getMultiaddrs()
                // await node1.libp2p.dial(multiaddrs[0])
                id = node1.libp2p.peerId
                console.log(id)
                const peer = evt.detail;
                // dial them when we discover them
                //connectedPeers.push(peer)
                //connectedPeers = connectedPeers; //reactivity of svelte
                node1.libp2p.dial(peer.id).catch((err) => {
                    console.log(`Could not dial ${peer.id}`);
                });
            });
            // Listen for new connections to peers
            node1.libp2p.addEventListener("peer:connect", (evt) => {
                console.log("peer:connect",evt.detail)
                const connection = evt.detail;

                const _connectedPeers = connectedPeers.filter((p)=>p!==evt.detail)
                _connectedPeers.push(connection)
                connectedPeers = _connectedPeers
                console.log(`Connected to ${connection.toString()}`);
            });
            // Listen for peers disconnecting
            node1.libp2p.addEventListener("peer:disconnect", (evt) => {
                console.log("peer:disconnect",evt.detail)
                // const connection = evt.detail;
                connectedPeers = connectedPeers.filter((p)=>p!==evt.detail)

                const connection = evt.detail;
                console.log(`Disconnected from ${connection.toCID().toString()}`);
            });
        }
    }

        // /= await createNode()
    // const node2 = await createNode()

    // connect them together
    // const multiaddrs = node2.libp2p.getMultiaddrs()
    // await node1.libp2p.dial(multiaddrs[0])

    // create a filesystem on top of Helia, in this case it's UnixFS
    // const createFS = async  () => {
    //     const fs = unixfs(node1)
    //
    //     // we will use this TextEncoder to turn strings into Uint8Arrays
    //     const encoder = new TextEncoder()
    //
    //     // add the bytes to your node and receive a unique content identifier
    //     const cid = await fs.addBytes(encoder.encode('Hello World 301'))
    //
    //     console.log('Added file:', cid.toString())
    //
    //     // create a filesystem on top of the second Helia node
    //     const fs2 = unixfs(node2)
    //
    //     // this decoder will turn Uint8Arrays into strings
    //     const decoder = new TextDecoder()
    //     let text = ''
    //
    //     // use the second Helia node to fetch the file from the first Helia node
    //     for await (const chunk of fs2.cat(cid)) {
    //         text += decoder.decode(chunk, {
    //             stream: true
    //         })
    //     }
    //     console.log('Fetched file contents:', text)
    // }
    const ping = async () => {
        console.log("pinging ",pingPeerId)
        const result = await node1.libp2p.services.ping.ping(pingPeerId)
        console.log("ping result:",result)
    }


</script>
<h1>Helia Networking Test</h1>
{#if !node1}
    <button on:click={async ()=>{node1 = await createNode()}}>Start Node1</button>
{:else }
    peerId: {id}
    <TextInput bind:value={pingPeerId} labelText="PeerId" placeholder="Enter another peerId..." />
    <button on:click={async ()=>{node1 = await ping()}}>Ping</button>
{/if}
{#if !node2}
    <button on:click={async ()=>{node2 = await createNode()}}>Start Node2</button>
{:else }
    {node2.libp2p.getMultiaddrs().toString()}
{/if}

<Dropdown
        titleText="Connected Peers"
        items={connectedPeers.map(p => {return {id:p.toString(),text: p.toString()} })}
/>