<script>
    import { createHelia } from "helia"
    import {
        Database, Entry,
        createOrbitDB,
        KeyValue,
        KeyStore,
        Identities,
        OrbitDBAccessController,
        parseAddress,
        isValidAddress
    } from '@orbitdb/core'
    // import { MemoryBlockstore } from 'blockstore-core'
    // import { MemoryDatastore } from 'datastore-core'
    import {onDestroy, onMount} from "svelte";
    import {gossipsub} from "@chainsafe/libp2p-gossipsub";

    const keysPath = './testkeys'
    let ipfs
    let keystore
    let identities
    let testIdentity
    let db

    const config = {
        libp2p: {
            services: {
                pubsub: gossipsub({
                    allowPublishToZeroPeers: true,
                    emitSelf: true,
                    canRelayMessage: true
                }),
            }
        }
    };

    const databaseId = 'database-AAA'

    const accessController = {
        canAppend: async (entry) => {
            const identity1 = await identities.getIdentity(entry.identity)
            return identity1.id === testIdentity.id
        }
    }

    onMount(async ()=>{
        ipfs = await createHelia(config)
        console.log("ipfs",ipfs)
        // await copy(testKeysPath, keysPath)
        keystore = await KeyStore({ path: keysPath })
        identities = await Identities({ keystore })
        testIdentity = await identities.createIdentity({ id: 'userA' })

        db = await Database({ ipfs, identity: testIdentity, address: databaseId, accessController, directory: './odb03' })
        console.log("db",db)
        const expected = 'zdpuAviunFSSu1TM2h25PexEHxs1cFK9tYy8Eakubvp8JYda4'
        const op = { op: 'PUT', key: 1, value: 'record 1 on db 1' }
        const actual = await db.addOperation(op)
        console.log("a",actual)
        console.log("e",expected)
        if(actual===expected)console.log("both is equal")
        else console.log("something is wrong here")
      /*  deepStrictEqual(actual, expected)/!**!/*/
        const op2 = { op: 'PUT', key: 2, value: 'record 2 on db 1' }
        const actual2 = await db.addOperation(op2)
        console.log("another PUT",actual2)
        await db.close()
    })

    onDestroy(async () => {
        if (ipfs) {
            await ipfs.stop()
        }

        if (keystore) {
            await keystore.close()
        }
    });
</script>