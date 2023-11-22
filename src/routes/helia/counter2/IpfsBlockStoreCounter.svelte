<svelte:options accessors/>
<script>
    import { createHelia } from 'helia';
    import { unixfs } from '@helia/unixfs';
    import { onMount } from 'svelte';
    import { MemoryBlockstore } from 'blockstore-core'
    import { MemoryDatastore} from "datastore-core";
    import { LevelBlockstore } from "blockstore-level"
    import { LevelDatastore } from "datastore-level";
    import { CID } from "multiformats/cid"

    export let levelStore
    export let ipfsConfusion  = `I am not inside ${Math.random()*100000} any ipfs node |`

    let blockstore = levelStore==="1"?new LevelBlockstore("./counter-blocks"):new MemoryBlockstore()
    let datastore = levelStore==="1"?new LevelDatastore("./counter-data"):new MemoryDatastore()

    let helia;
    let fs;

    let cid = localStorage.getItem("lastCid")?CID.parse(localStorage.getItem("lastCid")):undefined
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
        fs = unixfs(helia);
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
        let countString = count.split("|")[0]
        let counter = count.split("|")[1]
        const nCounterNumber = Number(counter)+1
        count = countString+"|"+nCounterNumber
        const encoder = new TextEncoder()
        cid = await fs.addBytes(encoder.encode(count));
        localStorage.setItem("lastCid",cid)
    };
</script>
{#if fs}
    <button class="counter-button" on:click={increment}>
        IPFS-Counter: {count}
    </button>
{/if}

{#if cid}
    <div>
        <a href={`https://ipfs.le-space.de/ipfs/${cid}`}
           target="_blank">stored at cid: {cid}</a>
    </div>
{/if}

<style>
    .counter-button {
        background: yellowgreen;
        color: black;
        margin: 2rem;
    }
</style>