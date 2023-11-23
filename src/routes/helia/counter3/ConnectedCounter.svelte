<script>
    import { onMount } from 'svelte';
    import {Column, Grid, Row, Toggle} from "carbon-components-svelte";

    import { createLibp2p } from "libp2p";
    import { createHelia } from 'helia';

    import { MemoryBlockstore } from 'blockstore-core'
    import { MemoryDatastore} from "datastore-core";
    import { LevelBlockstore } from "blockstore-level"
    import { LevelDatastore } from "datastore-level";
    import { CID } from "multiformats/cid"
    import {multiaddr} from "@multiformats/multiaddr";
    import { toString } from "uint8arrays";
    import { unixfs } from '@helia/unixfs'

    import {config} from "../../libp2p/config.js";
    import OutputLog from "$lib/components/OutputLog.svelte";

    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

    const relaysMultiAddrs =  [
        { id: "/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiBcDqgg_PQNURYgEM7UG2xuWSy-cXyvFiWp1EMDuS0gug/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM", text: "/ip4/159.69.119.82/udp/4004/webrtc-direct"},
        { id: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiAfc5WqLyw25HzgFs8OaMJ_gCqzX7S1a9BlnES5Qq5QHg/certhash/uEiAiA85j55j1DxtLpibTJsk8A_hXKCCFrd1n4ceEjxC6Sw/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
            text: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport" }
    ]
    let  address2Call =  localStorage.getItem("address2Call")?localStorage.getItem("address2Call"):(isFirefox?relaysMultiAddrs[0].id:relaysMultiAddrs[1].id)
    let transportToggleWebtransport = (address2Call===relaysMultiAddrs[1].id)?true:false
    $:{
        transportToggleWebtransport===true?address2Call=relaysMultiAddrs[1].id:address2Call=relaysMultiAddrs[0].id;
        outputLogComp?.appendOutput(`Switching Transport to '${address2Call}'`)
        localStorage.setItem("address2Call",address2Call)
    }
    /** {boolean} show we use level store (true) or memory store (false)*/
    export let levelStore
    export let ipfsConfusion  = `I am not inside ${Math.random()*100000} any ipfs node |`

    let blockstore = levelStore==="1"?new LevelBlockstore("./counter-blocks"):new MemoryBlockstore()
    let datastore = levelStore==="1"?new LevelDatastore("./counter-data"):new MemoryDatastore()

    let helia, fs;

    let libp2p;
    let outputLogComp;
    let relayConnected;
    let listeningAddressList = []
    let peerConnectionsList = []

    /** last cid which holds the current count */
    console.log("localStorage.getItem(\"lastCid\")",localStorage.getItem("lastCid"))
    let cid = localStorage.getItem("lastCid")?CID.parse(localStorage.getItem("lastCid")):undefined
    console.log("cid",cid)
    /** current count according the data in IPFS network */
    let count

    $:{
        count = ipfsConfusion+" | "+0
        localStorage.setItem("ipfsConfusion",ipfsConfusion)
    }

    /** Update connections list */
    function updatePeerList () {
        const peerList = libp2p.getPeers().map(peerId => peerId.toString())
        peerConnectionsList = peerList
        console.log("updatePeerList",peerConnectionsList)
    }
    const connectKuboRelay = async () => {
        const ma = multiaddr(address2Call)
        outputLogComp.appendOutput(`Dialing '${ma}'`)
        await libp2p.dial(ma)
        relayConnected = true
        outputLogComp.appendOutput(`Connected to '${ma}'`)

    }

    onMount(async () => {
        libp2p = await createLibp2p(config)
        libp2p.addEventListener('connection:open', (evt) => {
            console.log("connection:open",evt)
            updatePeerList()
        })
        libp2p.addEventListener('connection:close', (evt) => {
            console.log("connection:close",evt)
            updatePeerList()
        })
        libp2p.addEventListener("peer:discovery", (evt) => {
            console.log("peer:discovery",evt.detail.id.toString())
        });

        libp2p.services.pubsub.addEventListener('subscription-change', event => {
            // const topic = event.detail.topic
            // const message = toString(event.detail.data)
            console.log("event",event)
            outputLogComp.appendOutput(`subscription-change`)

        })
        libp2p.services.pubsub.addEventListener('message', event => {
            const topic = event.detail.topic
            const message = toString(event.detail.data)

            // if(!filterOutput)
            //     appendOutput(`Message received on topic '${topic}': ${message}`)
            // else if (topic!=='_peer-discovery._p2p._pubsub')
            outputLogComp.appendOutput(`Message received on topic '${topic}': ${message}`)
        })

        libp2p.addEventListener('self:peer:update', (evt) => {
            console.log("self:peer:update",evt.currentTarget.peerId.toString())
            console.log(" libp2p.getMultiaddrs()", libp2p.getMultiaddrs())
            const multiaddrs = libp2p.getMultiaddrs().map((ma) => ma.toString())
            console.log("multiaddrs",multiaddrs)
            listeningAddressList = multiaddrs;
        })

        await connectKuboRelay()
        helia = await createHelia({
            libp2p,
            blockstore,
            datastore
        });

        fs = unixfs(helia)
        if(cid) {
            const textDecoder = new TextDecoder()
            let _count = ''
            for await (const chunk of fs.cat(cid)) {
                _count += textDecoder.decode(chunk)
            }
            count =_count
        }
    });

    const increment = async () => {
        /** {string} a string to make sure we are not yet in any ipfs node */
        let countString = count.split("|")[0] //|| "i am not inside any ipfs node yet because i am in istanbul|"+0;
        /** {number} the counter value of the stored value*/
        let counter = count.split("|")[1]
        const nCounterNumber = Number(counter)+1
        count = countString+"|"+nCounterNumber

        const encoder = new TextEncoder()
        cid = await fs.addBytes(encoder.encode(count), {
            onProgress: (evt) => {
                console.info('add event', evt.type, evt.detail)
            }
        })

        console.log('Added file:', cid.toString())
        localStorage.setItem("lastCid",cid.toString())
    }
</script>
<Grid>
    {#if !isFirefox}
    <Row>
        <Column><Toggle labelText={transportToggleWebtransport?'Connect to Relay via WebTransport':'Connect to Relay via WebRTC-Direct'}
                        toggled={transportToggleWebtransport} on:change={()=>{
                            transportToggleWebtransport=(!transportToggleWebtransport)
                            connectKuboRelay()
                        }} /></Column>
    </Row>
    {/if}
    <Row>
        <Column>
            {#if fs}
                <button on:click={increment}>
                    IPFS-Counter: {count}
                </button>
            {/if}
        </Column>
    </Row>
    <Row>
        <Column>
            {#if cid}
                <div>
                    <a href={`https://ipfs.le-space.de/ipfs/${cid}`}
                       target="_blank">stored at cid: {cid}</a>
                </div>
            {/if}

        </Column>
    </Row>
    <Row>
        <Column><OutputLog bind:this={outputLogComp}  labelText="Output" rows={10} /></Column>
    </Row>
</Grid>
<style>
    button {
        background: yellowgreen;
        color: black;
        margin: 2rem;
    }
</style>