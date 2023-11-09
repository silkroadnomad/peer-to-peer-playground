<svelte:options accessors/>
<script>
    import { createHelia } from 'helia';
    import { json } from '@helia/json';
    import { onMount } from 'svelte';
    import { MemoryBlockstore } from 'blockstore-core'
    import { MemoryDatastore} from "datastore-core";
    import { LevelBlockstore } from "blockstore-level"
    import { LevelDatastore } from "datastore-level";
    import { CID } from "multiformats/cid"

    /** {boolean} show we use level store (true) or memory store (false)*/
    export let levelStore
    export let ipfsConfusion  = `I am not inside ${Math.random()*100000} any ipfs node |`

    let blockstore = levelStore==="1"?new LevelBlockstore("./counter-blocks"):new MemoryBlockstore()
    let datastore = levelStore==="1"?new LevelDatastore("./counter-data"):new MemoryDatastore()

    /** helia IPFS node instance
     (could be held in a Svelte store) */
    let helia;
    let j;

    /** last cid which holds the current count */
    let cid = localStorage.getItem("lastCid")?CID.parse(localStorage.getItem("lastCid")):undefined
    /** current count according the data in IPFS network */
    let count

    $:{
        count = ipfsConfusion+" | "+0
        localStorage.setItem("ipfsConfusion",ipfsConfusion)
    }

    onMount(async () => {
        helia = await createHelia({
            blockstore,
            datastore
        });
        j = json(helia);
        if(cid) count = await j.get(cid)
    });

    const increment = async () => {
        /** {string} a string to make sure we are not yet in any ipfs node */
        let countString = count.split("|")[0] //|| "i am not inside any ipfs node yet because i am in istanbul|"+0;
        /** {number} the counter value of the stored value*/
        let counter = count.split("|")[1]
        const nCounterNumber = Number(counter)+1
        count = countString+"|"+nCounterNumber
        cid = await j.add(count);
        localStorage.setItem("lastCid",cid)
    };
</script>
{#if j}
    <button on:click={increment}>
        IPFS-Counter: {count}
    </button>
{/if}

{#if cid}
    <div>
        <a href={`https://ipfs.io/ipfs/${cid}`}
           target="_blank">stored at cid: {cid}</a>
    </div>
{/if}

<style>
    button {
        background: yellowgreen;
        color: black;
        margin: 2rem;
    }
</style>