<script>
    import IpfsCounter from "$lib/components/IpfsCounter.svelte";
    import {Column, Grid, Row} from "carbon-components-svelte";
</script>

<Grid>
    <Row>
        <Column>
            <h2>Simple IPFSCounter</h2>
            <p>It just stores and loads a counter value into a Helia node running inside the browser using MemoryStore.
                Everytime you reload the browser, the counter will be 0 again.</p>
        </Column>
        <Column><IpfsCounter/></Column>
    </Row>
</Grid>
<style>
    h2,p {
        margin: 2rem;
    }
</style>