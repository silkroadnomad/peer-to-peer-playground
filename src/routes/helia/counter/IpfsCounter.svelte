<script>
    // Import necessary modules
    import { createHelia } from 'helia';
    import { unixfs } from '@helia/unixfs'
    import { onMount } from 'svelte';

    // Initialize variables
    let helia;
    let fs;
    let cid = '';
    let count = 0;

    // On mount, create a Helia instance and load the last count
    onMount(async () => {
        helia = await createHelia();
        fs = unixfs(helia)
        if(cid) count = await fs.cat(cid)
    });

    // Function to increment count and store it back to IPFS
    const increment = async () => {
        const encoder = new TextEncoder()
        cid = await fs.addBytes(encoder.encode(++count), {
            onProgress: (evt) => {
                console.info('add event', evt.type, evt.detail)
            }
        })
    };
</script>

{#if fs}
    <button class="counter-button" on:click={increment}>
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
    .counter-button {
        background: yellowgreen;
        color: black;
        margin: 2rem;
    }
</style>