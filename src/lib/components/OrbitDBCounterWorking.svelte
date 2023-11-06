<script>
    import { createHelia } from 'helia';
    import {
        createOrbitDB,
        IPFSAccessController,
        KeyValue,
        KeyStore,
        Identities,
        OrbitDBAccessController
    } from '@orbitdb/core'
    import { onMount } from 'svelte';
    import { identifyService } from 'libp2p/identify';
    import { autoNATService } from 'libp2p/autonat';
    import { gossipsub } from '@chainsafe/libp2p-gossipsub';
    // import { KeyStore, Identities } from '../../src/index.js'
    import testKeysPath from '../../fixtures/test-keys-path.js'
    // import createHelia from '../utils/create-helia.js'
    /** helia IPFS node instance (could be held in a Svelte store) */
    let helia;
    let orbitdb;
    let db,dbReopened;
    let address2Reopen;
    let keystore
    let accessController
    let identities
    let testIdentity1

    /** last hash which holds the current count */
    let hash = '';
    /** current count according the data in IPFS network */
    let count = 0;
    const config = {
        libp2p: {
            services: {
                identify: identifyService(),
                autoNAT: autoNATService(),
                pubsub: gossipsub({
                    allowPublishToZeroPeers: true,
                    emitSelf: true,
                    canRelayMessage: true
                }),
            }
        }
    };

    /**
     * As the button component mounts we spin up an IFPS-node
     * inside the browser which is by default connecting
     * the the public helia network via WebRTC.
     * then we load the last count our Helia (IPFS) node.
     */
    onMount(async () => {
        helia = await createHelia(config);
        console.log("helia",helia)
        orbitdb = await createOrbitDB({ ipfs:helia })
        console.log("orbitDB",orbitdb)
        const dbPath1 = './orbitdb/tests/orbitdb-access-controller/1'
        // keystore = await KeyStore({ path: keysPath })
        const keystore1 = await KeyStore({ path: dbPath1 + '/keys' })

        identities = await Identities({ ipfs: helia, keystore: keystore1 })

        testIdentity1 = await identities.createIdentity({ id: 'userA' })
        accessController = await OrbitDBAccessController()({ orbitdb, identities: testIdentity1 })
        const dbAddress = "counter"
        db = await KeyValue()({ ipfs:helia, identity: testIdentity1, address: dbAddress, accessController })
        // const dbAddress = "counter" //"/orbitdb/zdpuB3G8YAcRyZ1XJ9PvinWHY5Q7bot9VZipRjnLegbBBEecp" //"counter"
        // db = await orbitdb.open(dbAddress, {
        //     type: 'keyvalue',
        //     sync: true,
        //     indexBy: 'id',
        //     create: true,
        //     //overwrite: false,
        //     public: true,
        //     AccessController: IPFSAccessController({write: ['*']})
        // })

        console.log("db",db)
        console.log("db.address",db.address) ///orbitdb/zdpuAkhD7DDk4yZHLU5FtZXbDiAGNbfbP7eGexB76du2euLFv
        const address2Reopen = db.address
        console.log("address2Reopen","/orbitdb/zdpuAkhD7DDk4yZHLU5FtZXbDiAGNbfbP7eGexB76du2euLFv"/**/)
       // await db.close()
        dbReopened = await orbitdb.open(address2Reopen,{type:'keyvalue'})
        console.log("dbReopened",dbReopened)
        console.log("dbReopened.address",dbReopened.address)
        const all = await dbReopened.all()
        console.log("all",all)


        // if(!count){
        await dbReopened.put('count', 1)
        count = await dbReopened.get('count')
        // }
        let all2 = await dbReopened.all()
        count = await dbReopened.get('count')
        console.log("count",count)


        console.log("count from db", count)
    });

    /**
     * Increments count and stores it back to IPFS.
     */
    const increment = async () => {
        // const dbReopened = await orbitdb.open(address2Reopen,{type:'keyvalue'})

        console.log("dbReopened",dbReopened)
        // Add an entry
        const all = await dbReopened.all()
        console.log("all",all)

        hash = await dbReopened .put('count', ++count)
        // hash = await db.add(1)
        console.log(hash)
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