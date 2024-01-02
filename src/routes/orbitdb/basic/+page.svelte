<script>
    import {Button, Column, Grid, Row} from "carbon-components-svelte";
    import {onMount} from "svelte";
    import WatsonHealthAiStatus from "carbon-icons-svelte/lib/WatsonHealthAiStatus.svelte";
    import WatsonHealthAiStatusComplete from "carbon-icons-svelte/lib/WatsonHealthAiStatusComplete.svelte";
    import { multiaddr } from '@multiformats/multiaddr'
    import { createHelia } from 'helia';
    import {createOrbitDB, KeyStore, Identities, IPFSAccessController} from '@orbitdb/core';
    import { createLibp2p } from "libp2p";
    import { LevelBlockstore } from 'blockstore-level'
    import { LevelDatastore } from 'datastore-level'

    import { toString } from "uint8arrays";

    import OutputLog from "$lib/components/OutputLog.svelte";
    import QRCodeModal from "$lib/components/QRCodeModal.svelte";
    import { query } from "../../router.js";
    import {DefaultLibp2pBrowserOptions} from "./config.js";

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
    let identities
    let keystore
    let testIdentity1
    let accessController
    let relayConnected,peerConnected

    let count = 0
    let peerConnectionsList = []
    let listeningAddressList = []

    let blockstore = new LevelBlockstore("./helia-blocks")
    let datastore = new LevelDatastore("./helia-data")
    let outputLogComp
    let qrCodeOpen;
    let qrCodeData;

    const keysPath = './testkeys'
    let address2Connect = '/orbitdb/zdpuAw22wVq3SoUNGoCyjnv2EQuHDDK8V5Fjn6ZNb2xNUB79m' //'test20231222-1907' //test20231222-1652' //test20231222-1632' ///orbitdb/zdpuAthHKFXdUFcvvS25DcNRzhLRYSmSqhexC9x6yUFFV4S7q'
    // let address2Connect = 'test20231222-1926'
    const urlParams = new URLSearchParams($query);

    const connect2DB = async (_address2Connect) => {
        // if(address!==undefined && _address2Connect===address) return
        outputLogComp?.appendOutput(`now connecting! ${_address2Connect}`)

        db = await orbitdb.open(_address2Connect,{ sync:true, AccessController: accessController})
        address = db.address
        console.log("db address now",address)

        const allrecords = await db.all()
        outputLogComp?.appendOutput(`connect2DB:allrecords ${allrecords.length}`)
        console.log("connected now ",address)

        const onJoin = async (peerId, heads) => {
            outputLogComp?.appendOutput(`connect2DB:onJoin ${peerId}`)
        }

        const onUpdate = async (peerId, heads) => {
            outputLogComp?.appendOutput(`connect2DB:onUpdate ${peerId}`)
        }

        const onError = (err) => {
            outputLogComp?.appendOutput(`onError ${err}`)
        }
        db.events.on('join', onJoin)
        db.events.on('error', onError)
        db.events.on('update', onUpdate)
        for await (const record of db.iterator()) {
            console.log("record",record)
            outputLogComp?.appendOutput(`record: ${record.value}`)
        }

    }

    address2Connect = urlParams.get('db') || address2Connect
    if(orbitdb && address2Connect) connect2DB(address2Connect)

    $: {
        if(!peerConnected && urlParams.get('dial') && listeningAddressList.length>=0){
            console.log("dialing to peer",urlParams.get('dial'))
            const urls2Dial = JSON.parse(urlParams.get('dial'))
            for (const ma in urls2Dial) {
                console.log("dialing "+ma,urls2Dial[ma])
                try{
                    // console.log("urls2Dial[ma]",urls2Dial[ma])
                    // if(urls2Dial[ma].indexOf("/p2p-circuit/webrtc/p2p")!==-1  ){
                        libp2p.dial(multiaddr(urls2Dial[ma])).then((info) => {
                            peerConnected = true
                            outputLogComp?.appendOutput(`connected peer ${info}`)
                            console.log("connected peer",info)}).catch( (e) => { console.log("problem dialing "+urls2Dial[ma],e) })
                   // }
                    }catch(ex){console.log("error while connecting",ex)}

            }
        }
    }

    $:qrCodeData = JSON.stringify(listeningAddressList)

    onMount(async () => {

        keystore = await KeyStore({ path: keysPath })
        identities = await Identities({ keystore })
        testIdentity1 = await identities.createIdentity({ id: 'userA' })

        libp2p = await createLibp2p(DefaultLibp2pBrowserOptions)
        console.log("libp2p",libp2p)
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
            if(multiaddrs.length>0){
                console.log("multiaddrs",multiaddrs)
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
        orbitdb = await createOrbitDB({ ipfs: helia,identity:testIdentity1,identities})
        // accessController = await IPFSAccessController({ write: ['*'] })({
        //     orbitdb: orbitdb,
        //     identities: identities
        // })
        accessController = await IPFSAccessController({ write: ['*'] })({
            orbitdb: orbitdb,
            identities: identities
        })
        // accessController = { AccessController: IPFSAccessController({ write: ['*'] }) }
        console.log("orbitdb",orbitdb)
        if(!$query){
            outputLogComp?.appendOutput("query not given - doing default connect")
            connect2DB(address2Connect)
        }
    })


    function updatePeerList () {
        const peerList = libp2p.getPeers().map(peerId => peerId.toString())
        peerConnectionsList = peerList
      //  outputLogComp?.appendOutput(`updated peerConnectionsList from ${peerConnectionsList} now: ${peerConnectionsList.length}`)
        if(peerConnectionsList.length>0)relayConnected=true
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
            <QRCodeModal bind:qrCodeOpen={qrCodeOpen} on:close={qrCodeOpen=false} qrCodeData={qrCodeData} address={address}/>
            <Button disabled={!address || listeningAddressList.length===0} on:click={() => { qrCodeOpen=(!qrCodeOpen) }} size="small">Open / Scan</Button>
        </Column>
        <Column class="distance">{address}</Column>
    </Row>
    <Row>
        <Column class="distance">OrbitDB name:</Column>
        <Column class="distance">{db?.name}</Column>
    </Row>
    <Row>
        <Column class="distance">Relays connected:</Column>
        <Column class="distance">
            {#if relayConnected}
                { peerConnectionsList.length } <WatsonHealthAiStatusComplete  class="statusGreen"/>
            {:else}
               0 <WatsonHealthAiStatus class="statusRead" />
            {/if}
        </Column>
        <Column>&nbsp;</Column>
    </Row>
    <Row>
        <Column class="distance">Multi Addresses Received:</Column>
        <Column class="distance">
            {#if listeningAddressList.length>0}
                {listeningAddressList.length} <WatsonHealthAiStatusComplete  class="statusGreen"/>
            {:else}
                {listeningAddressList.length} <WatsonHealthAiStatus class="statusRead" />
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

                //const db2 = await orbitdb.open(db.address,{sync:true, AccessController: IPFSAccessController({ write: ['*'] })})
                //const db2 = await orbitdb.open(address2Connect,{sync:true, accessController})
                /*const db2 = await orbitdb.open(address2Connect,{sync:true, accessController})-->

                <!--const amount = count + 10-->
                <!--outputLogComp?.appendOutput(`adding count:${count} amount:${amount}`)--> */
               // for (let i = count; i < amount; i++) {
                    const records = await db.all()
                    outputLogComp?.appendOutput(`adding count:${records.length} address:${db.address}`)

                    await db.add('hello' + count++)
                    outputLogComp?.appendOutput(`added`)
              //  outputLogComp?.appendOutput(`bla ${records}`)
                  //  outputLogComp?.appendOutput(`added ${i} record`)
                //}
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
