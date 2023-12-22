<script>
    import {onMount} from "svelte";
    import { createLibp2p } from 'libp2p'
    import { createHelia } from 'helia'
    import {createOrbitDB, DefaultLibp2pOptions, Identities, KeyStore} from '@orbitdb/core'
    import {DefaultLibp2pBrowserOptions} from "@orbitdb/core/src/config/libp2p/index.js";

    import { LevelBlockstore } from "blockstore-level"
    import { LevelDatastore } from "datastore-level";


    let blockstore = new LevelBlockstore("./helia-blocks")
    let datastore = new LevelDatastore("./helia-data")
    onMount(async ()=>{
        // Create an IPFS instance with defaults.
        console.log("mount")

        const libp2p = await createLibp2p({ ...DefaultLibp2pBrowserOptions})
        console.log("libp2p",libp2p)


        const ipfs =  await createHelia({
            libp2p,
            blockstore,
            datastore
        });
        const keysPath = './testkeys'
        let keystore = await KeyStore({ path: keysPath })
        let identities = await Identities({ keystore })
        let testIdentity1 = await identities.createIdentity({ id: 'userA' })

        const accessController = {
            canAppend: async (entry) => {
                console.log("canAppend",entry)
                const identity = await identities.getIdentity(entry.identity)
                return identity.id === testIdentity1.id
            }
        }
        const orbitdb = await createOrbitDB({ ipfs,identity:testIdentity1,identities})
 //,accessController,identity: testIdentity1
        const db = await orbitdb.open('/orbitdb/zdpuB28iZwkKbZUGdTWC8y1DJRczUAig3PEwXxeE2jSkd44XC',{sync:true, accessController})

        console.log('my-db address', db.address)

        // Add some records to the db.
        await db.add('hello world 1')
        await db.add('hello world 2')

        // Print out the above records.
        console.log(await db.all())

        // Close your db and stop OrbitDB and IPFS.
        await db.close()
        await orbitdb.stop()
        await ipfs.stop()
    })




</script>