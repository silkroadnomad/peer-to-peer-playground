<script>
    import Snow from './Snow.svelte'
    import {onMount} from "svelte";

    import { createHelia } from 'helia';
    import { createOrbitDB} from '@orbitdb/core';
    import { LevelBlockstore } from "blockstore-level"
    import { LevelDatastore } from "datastore-level";
    import {createLibp2p} from "libp2p";
    import {config} from "../libp2p/config.js";

    let libp2p,helia,orbitdb,db,address;
    let count = 0
    let blockstore = new LevelBlockstore("./helia-blocks")
    let datastore = new LevelDatastore("./helia-data")

    onMount(async ()=>{
        libp2p = await createLibp2p(config)
        helia = await createHelia({
            libp2p,
            blockstore,
            datastore
        });
        orbitdb = await createOrbitDB({ ipfs: helia, id: 'user1', directory: './orbitdb' })
        const dbAddress = "/orbitdb/zdpuB1aMLKeka41pLNGzPrZ9eNnX34bgnqopKDs6juUqa43iU"
        db = await orbitdb.open(dbAddress?dbAddress:'helloworld')
        const amount = 10
        for (let i = 0; i < amount; i++) {
            await db.add('hello' + i)
        }
        address = db.address
        console.log("address",address)

        const db2 = await orbitdb.open(address)
        for await (const record of db2.iterator()) {
            console.log("read record",record)
            count++;
        }
        // db2.drop()
    })
</script>
<h1>Simple OrbitDB Test</h1>
our orbitdb address is {address}
and we have {count} values in the database
<div class='snow'>
    <Snow/>
</div>

<style>
    :global(body) {
        background: #111;
    }
    .snow {
        grid-row: 1 / 2;
        grid-column: 1 / 2;
        z-index: 1;
    }
</style>
