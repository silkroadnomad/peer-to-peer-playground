<script>
    import {Button, Column, Grid, Row, TextArea} from "carbon-components-svelte";
    import {onMount} from "svelte";

    import WatsonHealthAiStatus from "carbon-icons-svelte/lib/WatsonHealthAiStatus.svelte";
    import WatsonHealthAiStatusComplete from "carbon-icons-svelte/lib/WatsonHealthAiStatusComplete.svelte";

    import { createHelia } from 'helia';
    import { createOrbitDB} from '@orbitdb/core';
    import { LevelBlockstore } from "blockstore-level"
    import { LevelDatastore } from "datastore-level";
    import {createLibp2p} from "libp2p";
    import {config} from "../../libp2p/config.js";
    import {multiaddr} from "@multiformats/multiaddr";
    import {toString} from "uint8arrays";
    import Snow from "../Snow.svelte";
    import OutputLog from "$lib/components/OutputLog.svelte";
    import QRCodeModal from "$lib/components/QRCodeModal.svelte";
    import {query} from "../../router.js";

    /** @type {import("libp2p").Libp2p} */
    let libp2p;
    /** @type {import('helia').Helia} */
    let helia;
    /** @type {import("@orbitdb/core").OrbitDB} */
    let orbitdb;
    /** @type {import("@orbitdb/core").Store} */
    let db;
    /** @type {string} */
    let address;
    let relayConnected = false

    let count = 0
    let peerConnectionsList = []
    let listeningAddressList = []

    let blockstore = new LevelBlockstore("./helia-blocks")
    let datastore = new LevelDatastore("./helia-data")
    let outputLogComp
    let qrCodeOpen;
    let qrCodeData;
    let address2Connect = 'helloWorld'
    $:qrCodeData = `${window.location.origin}/${window.location.hash}?db=${encodeURI(address)}`

    $: { // if a query param was given in the url take the multiaddress
        if($query!==undefined && $query.split("=")[0]==='db') {
            address2Connect = $query.split("=")[1]
            console.log("connecting to db",address2Connect)
            // const textpart = $query.split("certhash")[0].substring(5) //cut away dial=
            // dialMultiaddrItems.push({id:$query.split("=")[1],text:textpart})
            // dialMultiaddr=dialMultiaddrItems[dialMultiaddrItems.length-1].id //preselect the last added
        }
    }

    const relaysMultiAddrs =  [
        { id: "/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiBcDqgg_PQNURYgEM7UG2xuWSy-cXyvFiWp1EMDuS0gug/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM", text: "/ip4/159.69.119.82/udp/4004/webrtc-direct"},
        { id: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiAfc5WqLyw25HzgFs8OaMJ_gCqzX7S1a9BlnES5Qq5QHg/certhash/uEiAiA85j55j1DxtLpibTJsk8A_hXKCCFrd1n4ceEjxC6Sw/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
            text: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport" }
    ]
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

        helia = await createHelia({
            libp2p,
            blockstore,
            datastore
        });
        await connectKuboRelay()

        orbitdb = await createOrbitDB({ ipfs: helia, id: 'user1', directory: './orbitdb' })
        // const dbAddress = "/orbitdb/zdpuB1aMLKeka41pLNGzPrZ9eNnX34bgnqopKDs6juUqa43iU"
        console.log("connecting now to",address2Connect)
        db = await orbitdb.open(address2Connect)
        address = db.address
        console.log("address now",address)
        await countDataInDB()

        // const subscribeTopic = "orbitdb/nico"
        // const sendTopicMessage = "hallo message"
        // appendOutput(`Subscribing to '${subscribeTopic}`)
        // libp2p.services.pubsub.subscribe(subscribeTopic)
        //
        // appendOutput(`Sending message '${sendTopicMessage}'`)
        // await libp2p.services.pubsub.publish(subscribeTopic, fromString(sendTopicMessage))
    })


    function updatePeerList () {
        const peerList = libp2p.getPeers().map(peerId => peerId.toString())
        peerConnectionsList = peerList
        outputLogComp.appendOutput(`gathered our multi addresses from ${peerConnectionsList}`)
        console.log("updatePeerList",peerConnectionsList)
    }
    const connectKuboRelay = async () => {
        const ma = multiaddr(relaysMultiAddrs[0].id)
        outputLogComp.appendOutput(`Dialing '${ma}'`)
        await libp2p.dial(ma)
        relayConnected = true
        outputLogComp.appendOutput(`Connected to '${ma}'`)
    }

    const countDataInDB = async () => {
        const db2 = await orbitdb.open(address2Connect)
        for await (const record of db2.iterator()) {
            console.log("read record",record)
            count++
            outputLogComp.appendOutput(`counted ${count} records`)
        }
    }
</script>

<h1>Simple OrbitDB Test</h1>

<Grid>
    <Row>
        <Column class="distance">OrbitDB address:</Column>
        <Column class="distance">{address} </Column>
        <Column class="distance"> <QRCodeModal bind:qrCodeOpen={qrCodeOpen}
                                                on:close={qrCodeOpen=false}
                                                qrCodeData={qrCodeData} />        <Button disabled={!address}
                                                                                          on:click={() => { qrCodeOpen=(!qrCodeOpen) }} size="small">Open / Scan</Button></Column>
    </Row>
    <Row>
        <Column class="distance">OrbitDB name:</Column>
        <Column class="distance">{db?.name}</Column>
    </Row>
    <Row>
        <Column  class="distance">Relay connected:</Column>
        <Column  class="distance">
            {#if relayConnected}
                {relaysMultiAddrs[0].text} <WatsonHealthAiStatusComplete  class="statusGreen"/>
            {:else}
                <WatsonHealthAiStatus class="statusRead" />
            {/if}
        </Column>
    </Row>
    <Row>
        <Column  class="distance">Multi Addresses Received:</Column>
        <Column  class="distance">
            {#if listeningAddressList.length>0}
                {listeningAddressList.length} <WatsonHealthAiStatusComplete  class="statusGreen"/>
            {:else}
                 {listeningAddressList.length}  <WatsonHealthAiStatus class="statusRead" />
            {/if}
        </Column>
    </Row>
    <Row>
        <Column class="distance">
            <Button size="small" on:click={
                async () => {
                    const amount = count + 10
                    for (let i = count; i < amount; i++) {
                        await db.add('hello' + i)
                        count++
                        outputLogComp.appendOutput(`added ${i} record`)
                    }
                }
            }>Write 10 records to OrbitDB</Button>
        </Column>
        <Column class="distance">
            <Button size="small" on:click={
                    async () => {
                        db.drop()
                        outputLogComp.appendOutput(`db ${address} dropped`)
                    }}>Drop db</Button>
        </Column>
    </Row>
    <Row>
        <Column><OutputLog bind:this={outputLogComp}  labelText="Output" rows={10} /></Column>
    </Row>
</Grid>

<p>&nbsp;</p>



<div class='snow'>
<!--<Snow/>-->
</div>

<style>
    :global(.distance){
        padding-top: 1rem;
        margin-top: 2rem;
    }
    :global(.statusRead) {
        color: red;
        width: 16px;
        height: 16px;
    }
    :global(.statusGreen) {
        color: green;
        width: 16px;
        height: 16px;
    }
    :global(body) {
        background: #111;
    }
    .snow {
        grid-row: 1 / 2;
        grid-column: 1 / 2;
        z-index: -1;
    }
</style>
