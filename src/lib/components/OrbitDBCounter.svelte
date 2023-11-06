<script>
    import { createHelia } from 'helia';
    import {
        createOrbitDB,
        KeyValue,
        KeyStore,
        Identities,
        OrbitDBAccessController,
        parseAddress,
        isValidAddress
    } from '@orbitdb/core'
    import { MemoryBlockstore } from 'blockstore-core'
    import { MemoryDatastore } from 'datastore-core'
    import { LevelBlockstore } from 'blockstore-level'
    import { LevelDatastore } from 'datastore-level'
    import { onMount } from 'svelte';
    import { yamux } from '@chainsafe/libp2p-yamux'
    import { bootstrap } from '@libp2p/bootstrap';
    import { noise } from '@chainsafe/libp2p-noise'
    import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery';
    import { circuitRelayTransport, circuitRelayServer } from 'libp2p/circuit-relay';
    import { webRTC, webRTCDirect } from '@libp2p/webrtc';
    import { webTransport } from '@libp2p/webtransport';
    import { webSockets } from '@libp2p/websockets';
    import { all } from '@libp2p/websockets/filters';
    import { identifyService } from 'libp2p/identify';
    import { autoNATService } from 'libp2p/autonat';
    import { gossipsub } from '@chainsafe/libp2p-gossipsub';
    import { kadDHT } from '@libp2p/kad-dht';
    import { ipnsSelector } from 'ipns/selector';
    import { ipnsValidator } from 'ipns/validator';
    let helia;
    let orbitdb;
    let db,dbReopened;
    let accessController
    let identities
    let testIdentity1
    let hash = '';
    let count = 0;
    // const blockstore = new MemoryBlockstore()
    const levelblockstore = new LevelBlockstore('./counter')
    const leveldatastore = new LevelDatastore('./counter-data')
    const multiaddrs = [ //add your own WebRTC Stars Servers here too!
        // '/dns6/helia.le-space.de/tcp/9091/wss/p2p-webrtc-star',
        // '/dns4/helia.le-space.de/tcp/9091/wss/p2p-webrtc-star'
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
        '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
    ];
    const bootstrapConfig = { list: multiaddrs };
    export const config = {
        libp2p: {
            datastore: leveldatastore,
            // https://github.com/ipfs/helia/blob/main/packages/helia/src/utils/libp2p-defaults.browser.ts#L27
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
            streamMuxers: [yamux()],
            peerDiscovery: [bootstrap(bootstrapConfig), pubsubPeerDiscovery()],
            services: {
                 identify: identifyService(),
                 autoNAT: autoNATService(),
                pubsub: gossipsub({
                    allowPublishToZeroPeers: true,
                    emitSelf: true,
                    canRelayMessage: true
                }),
                dht: kadDHT({
                    clientMode: true,
                    validators: { ipns: ipnsValidator },
                    selectors: { ipns: ipnsSelector }
                })
            }
            // https://github.com/libp2p/js-libp2p/blob/master/doc/CONFIGURATION.md#configuring-connection-gater
            //connectionGater: {denyDialMultiaddr: async (...args) => false},
        }
    };
    const LOCAL_STORAGE_DB_NAME = "dbAddress.OrbitDBCounter"
    onMount(async () => {

        helia = await createHelia({
            libp2p: config.libp2p,
            blockstore: levelblockstore,
            datastore: leveldatastore
        })
        window.helia = helia;
        console.log("helia",helia)
            // EXPERIMENTAL: { pubsub: true },
            // relay: { enabled: true, hop: { enabled: true } },
            // preload: { "enabled": false },
            // repo: './decad03' }
        //);

        const dbPath1 = './orbitdb-keys'
        const keystore1 = await KeyStore({ path: dbPath1 + '/keys' })
        identities = await Identities({ ipfs: helia, keystore: keystore1 })

        testIdentity1 = await identities.createIdentity({ id: 'userb' })
        orbitdb = await createOrbitDB({ ipfs:helia,identity:testIdentity1 })
        accessController = await OrbitDBAccessController()({ orbitdb, identities: testIdentity1 })
       localStorage.removeItem(LOCAL_STORAGE_DB_NAME) //if you delte this we loose the address of the database

        let  dbAddress = localStorage.getItem(LOCAL_STORAGE_DB_NAME) || "counter"
        console.log("if this dbAddress.OrbitDBCounter is  counter we don't have anything in localstorage",dbAddress)
        const dbObjOrAddress = isValidAddress(dbAddress)?parseAddress(dbAddress):dbAddress
        console.log("dbObjOrAddress",dbObjOrAddress)
        db = await orbitdb.open(dbObjOrAddress, {
            type: 'keyvalue',
            sync:true, accessController })
        localStorage.setItem(LOCAL_STORAGE_DB_NAME, db.address)
        console.log("localStorage.get(\"dbAddress.OrbitDBCounter)", localStorage.getItem("dbAddress.OrbitDBCounter"))
        const address2Reopen = localStorage.getItem(LOCAL_STORAGE_DB_NAME)
        console.log("address2Reopen",address2Reopen)
        // console.log("dbReopened.address",dbReopened.address)
        const db2 = await orbitdb.open(dbObjOrAddress, {type: 'keyvalue',sync:true, accessController })
        if(!db2) return
        const all = await db2.all()
        console.log("all",all)

        await db.put('count', 1)
        count = await db.get('count')

        let all2 = await db.all()
        console.log("all2",all2)
        count = await db.get('count')
        console.log("count",count)
        console.log("count from db", count)
    });

    /**
     * Increments count and stores it back to IPFS.
     */
    const increment = async () => {
        // const dbReopened = await orbitdb.open(address2Reopen,{type:'keyvalue'})

        // console.log("dbReopened",db)
        // Add an entry
        const all = await db.all()
        console.log("all",all)
        await db.del('count')
        hash = await db.put('count', ++count)
        // hash = await db.add(1)
        console.log("db.address",db.address)
    }
</script>

<button on:click={increment}>
    OrbitDB-Counter: {count}
</button>
dbAdress: {db?db.address:''}
{#if hash}
    <div>
        <a href={`https://ipfs.io/ipfs/${hash}`}
           target="_blank">stored at cid: {hash}</a>
    </div>
{/if}

<style>
    button {
        background: cornflowerblue;
        color: black;
    }
</style>