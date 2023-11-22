<script>
    // Importing the IpfsCounter component
    import IpfsCounter from "./IpfsCounter.svelte";

    // Importing layout components from carbon-components-svelte
    import {Column, Grid, Row} from "carbon-components-svelte";
</script>

<Grid>
    <Row>
        <Column>
            <h2 class="header">Simple IPFSCounter</h2>
            <p class="description">
                It just stores and loads a counter value into a Helia node running inside the browser using MemoryStore.
                Everytime you reload the browser, the counter will be 0 again.
                Since browser node is not connected to the ipfs network it will not be possible to load the cid from another ipfs node.
            </p>
        </Column>
        <Column>
            <IpfsCounter/>
        </Column>
    </Row>
</Grid>

<style>
    .header, .description {
        margin: 2rem;
    }
</style>