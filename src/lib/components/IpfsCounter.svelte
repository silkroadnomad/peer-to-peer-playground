<script>
    import { createHelia } from 'helia';
    import { json } from '@helia/json';
    import { onMount } from 'svelte';

    /** helia IPFS node instance
     (could be held in a Svelte store) */
    let helia;
    let j;

    /** last cid which holds the current count */
    let cid = '';
    /** current count according the data in IPFS network */
    let count = 0;

    /**
     * As the button component mounts we spin up an IFPS-node
     * inside the browser which is by default connecting
     * the the public ipfs network via WebRTC.
     * then we load the last count our Helia (IPFS) node.
     */
    onMount(async () => {
        helia = await createHelia();
        j = json(helia);
        if(cid) count = await j.get(cid)
    });

    /**
     * Increments count and stores it back to IPFS.
     */
    const increment = async () => {
        cid = await j.add(++count);
    };
</script>

<button on:click={increment}>
    IPFS-Counter: {count}
</button>

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
    }
</style>