<script>
    import {Button, Column, Grid, Row, TextArea, Toggle} from "carbon-components-svelte";
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

    import OutputLog from "$lib/components/OutputLog.svelte";
    import QRCodeModal from "$lib/components/QRCodeModal.svelte";
    import {query} from "../../router.js";
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    // import Snow from "../Snow.svelte";

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
    let selectedListeningAddress;

    const relaysMultiAddrs =  [
        { id: "/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiA-NREGwkQ1xVlO6YkoH30R9aH-4dcQfTz-x0jJPhHRjg/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM", text: "/ip4/159.69.119.82/udp/4004/webrtc-direct" },
        { id: "/ip4/159.69.119.82/udp/4005/quic-v1/webtransport/certhash/uEiAP75UYHU9lxxeQ43_u3U7PrL3eeb0aOBfw2ty7CjuSUA/certhash/uEiBhciKTRyUiuDHnFkpOD_i3bMRCuGT8olXrdFvteNV-uA/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM", text: "/ip4/159.69.119.82/udp/4005/quic-v1/webtransport/"}
    ]

    let  multiAddress2Connect =  localStorage.getItem("multiAddres2Connect")?localStorage.getItem("multiAddres2Connect"):(isFirefox?relaysMultiAddrs[0].id:relaysMultiAddrs[1].id)
    console.log("multiAddress2Connect",multiAddress2Connect)

    const urlParams = new URLSearchParams($query);
    multiAddress2Connect = urlParams.get('dial')?urlParams.get('dial'):multiAddress2Connect //if there's a dial param use that address for a connection!

    const connect2DB = async (_address2Connect) => {
        db = await orbitdb.open(_address2Connect)


        db.events.on('join', async (peerId, heads) => {
            console.log("join",peerId)
        })

// Listen for any updates to db2. This is especially useful when listening for
// new heads that are available on db1.
// If we want to listen for new data on db2, add an "update" listener to db1.
        db.events.on('update', async (entry) => {
            console.log("update",entry)
            // Full replication is achieved by explicitly retrieving all records from db1.
            console.log(await db.all())
            // db2Updated = true
        })
        address = db.address
        console.log("db address now",address)
        await countDataInDB()
    }

    address2Connect = urlParams.get('db') || address2Connect
    console.log("address2Connect",address2Connect)
    $: {
        if(orbitdb && address2Connect) connect2DB(address2Connect)
    }

    let transportToggleWebtransport= (multiAddress2Connect.indexOf('webtransport')!==-1) ? true : false;
    console.log("transportToggleWebtransport",transportToggleWebtransport)
    $: {
        //if we have dial param do not switch connection!
        if(!urlParams.get('dial')){
            transportToggleWebtransport === true ? multiAddress2Connect = relaysMultiAddrs[1].id :multiAddress2Connect = relaysMultiAddrs[0].id;
            outputLogComp?.appendOutput(`Switching Transport to ${multiAddress2Connect}`)
            console.log("multiAddress2Connect",multiAddress2Connect)
        }
    }
    //selectedListeningAddress appears as soon as we got our multiaddress from kubo (relay) in this case we choose the address which we connected with
    $:{
        console.log("looking for webtransport multi addresses",listeningAddressList.find(addr=>addr.indexOf('/webtransport')))
        console.log("looking for webrtc-direct multi addresses",listeningAddressList.find(addr=>addr.indexOf('/webrtc-direct')))
        if(transportToggleWebtransport)
            selectedListeningAddress=listeningAddressList.find(addr=>addr.indexOf('/webtransport'))
        else selectedListeningAddress=listeningAddressList.find(addr=>addr.indexOf('/webrtc-direct'))

        console.log("--->selectedListeningAddress now:",selectedListeningAddress)
    }
    //qrCodeData creates an url with db (dbaddress) and dial (multiaddr) param
    $:qrCodeData = `${window.location.origin}/${window.location.hash}?db=${encodeURI(address)}&dial=${encodeURI(selectedListeningAddress)}`

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
        libp2p.services.pubsub.addEventListener('subscription-change', event => console.log("subscription-change",event))
        libp2p.services.pubsub.addEventListener('subscription-change', event => {
            // const topic = event.detail.topic
            // const message = toString(event.detail.data)
            console.log("event",event)
            outputLogComp?.appendOutput(`subscription-change`)
        
        })

        libp2p.services.pubsub.addEventListener('message', event => {
            const topic = event.detail.topic
            const message = toString(event.detail.data)

            // if(!filterOutput)
            //     appendOutput(`Message received on topic '${topic}': ${message}`)
            // else if (topic!=='_peer-discovery._p2p._pubsub')
            console.log(`Message received on topic '${topic}': ${message}`)
            outputLogComp?.appendOutput(`Message received on topic '${topic}': ${message}`)
        })

        libp2p.addEventListener('self:peer:update', (evt) => {
            console.log("self:peer:update",evt.currentTarget.peerId.toString())
            console.log(" libp2p.getMultiaddrs()", libp2p.getMultiaddrs())
            const multiaddrs = libp2p.getMultiaddrs().map((ma) => ma.toString())
            console.log("multiaddrs",multiaddrs)
            if(multiaddrs.length>0){
                outputLogComp?.appendOutput(`multiaddrs found '${multiaddrs}' now connecting to db ${address2Connect}`)
                connect2DB(address2Connect)
            }
            listeningAddressList = multiaddrs;
           // selectedListeningAddress = listeningAddressList.find((addr)=>addr.indexOf(transportToggleWebtransport?'/webtransport':'/webrtc-direct'))
        })
        window.libp2p = libp2p

        helia = await createHelia({
            libp2p,
            blockstore,
            datastore
        });
        window.helia = helia
        await connectKuboRelay()

        orbitdb = await createOrbitDB({ ipfs: helia, id: 'user1', directory: './orbitdb' })
        if(!$query){
            outputLogComp?.appendOutput("query not given - doing default connect")
            connect2DB(address2Connect)
        }

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
        outputLogComp?.appendOutput(`gathered peerConnectionsList from ${peerConnectionsList}`)
        console.log("updatePeerList",peerConnectionsList)
    }
    const connectKuboRelay = async () => {
        relayConnected = false
        listeningAddressList = []
        const ma = multiaddr(multiAddress2Connect)
        outputLogComp?.appendOutput(`Dialing '${ma}'`)
        await libp2p.dial(ma)
        relayConnected = true
        outputLogComp?.appendOutput(`Connected to '${ma}'`)
        localStorage.setItem("multiAddress2Connect",multiAddress2Connect)
    }

    const countDataInDB = async () => {
        const db2 = await orbitdb.open(address2Connect)
        for await (const record of db2.iterator()) {
            console.log("read record",record)
            count++
            outputLogComp?.appendOutput(`counted ${count} records`)
        }
    }
</script>

<h1>Simple OrbitDB Test</h1>

<Grid>
    <Row>
        <Column class="distance">PeerId:</Column>
        <Column class="distance">{libp2p?libp2p.peerId.toString():'initializing...'}</Column>
    </Row>
    <Row>
        <Column class="distance">OrbitDB address:</Column>
        <Column class="distance">
            <QRCodeModal bind:qrCodeOpen={qrCodeOpen} on:close={qrCodeOpen=false} qrCodeData={qrCodeData} />
            <Button disabled={!address || !multiAddress2Connect} on:click={() => { qrCodeOpen=(!qrCodeOpen) }} size="small">Open / Scan</Button>
        </Column>
        <Column class="distance">{address}</Column>
    </Row>
    <Row>
        <Column class="distance">OrbitDB name:</Column>
        <Column class="distance">{db?.name}</Column>
    </Row>
    <Row>
        <Column class="distance">Relay connected:</Column>
        <Column>
            <Toggle labelText={transportToggleWebtransport?'Connect to Relay via WebTransport':'Connect to Relay via WebRTC-Direct'}
                    toggled={transportToggleWebtransport} on:change={() => {
                        transportToggleWebtransport=(!transportToggleWebtransport)
                        connectKuboRelay()
                    }} />
        </Column>
        <Column class="distance">
            {#if relayConnected}
                { relaysMultiAddrs.find(it => it.id===multiAddress2Connect)?.text} <WatsonHealthAiStatusComplete  class="statusGreen"/>
            {:else}
                <WatsonHealthAiStatus class="statusRead" />
            {/if}
        </Column>
    </Row>
    <Row>
        <Column class="distance">Multi Addresses Received:</Column>
        <Column class="distance">
            {#if listeningAddressList.length>0}
                {listeningAddressList.length}<WatsonHealthAiStatusComplete  class="statusGreen"/>
            {:else}
                {listeningAddressList.length}<WatsonHealthAiStatus class="statusRead" />
            {/if}
        </Column>
        <Column>
            {#each listeningAddressList as a}
                <li>{a}</li>
            {/each}
        </Column>
    </Row>
    <Row>
        <Column class="distance">
            <Button size="small" on:click={async () => {
                const amount = count + 10
                for (let i = count; i < amount; i++) {
                    await db.add('hello' + i)
                    count++
                    outputLogComp?.appendOutput(`added ${i} record`)
                }
            }}>Write 10 records to OrbitDB</Button>
        </Column>
        <Column class="distance">
            <Button size="small" on:click={async () => {
                db.drop()
                outputLogComp?.appendOutput(`db ${address} dropped`)
            }}>Drop db</Button>
        </Column>
    </Row>
    <Row>
        <Column><OutputLog bind:this={outputLogComp}  labelText="Output" rows={10} /></Column>
    </Row>
</Grid>


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
