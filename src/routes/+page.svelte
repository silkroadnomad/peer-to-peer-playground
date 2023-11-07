<script>
/*    // import IpfsCounter from "$lib/components/IpfsCounter.svelte";
    import OrbitDBCounter from "$lib/components/OrbitDBCounter.svelte";*/
// import DatabaseTest from "$lib/components/DatabaseTest.svelte";
// import IpfsCounter from "$lib/components/IpfsCounter.svelte";
// import HeliaNetworkingTest from "$lib/components/HeliaNetworkingTest.svelte"
import {
    Content,
    Grid,
    Row,
    Column, TileGroup, Tile,
} from "carbon-components-svelte";

import {goto} from "$app/navigation";
</script>

<Content>
    <Grid>
        <Row>
            <Column>
                <h1>LibP2P, Helia & OrbitDB examples with Svelte</h1>
                <!--                <h1>HeaderSwitcher</h1>-->
                <p>
                    <!--                    Start a Helia node and watch the amount its connecting in the dropdown box.-->
                </p>
                <TileGroup legend="examples">
                    <Tile on:click={() => goto("/libp2p")}>LibP2P Examples</Tile>
                    <Tile on:click={() => goto("/helia")}>Helia Examples</Tile>
                    <Tile on:click={() => goto("/orbitdb")}>OrbitDB Examples</Tile>

                </TileGroup>
            </Column>
        </Row>
    </Grid>
</Content>
<!--1. Create a Simple Counter with Helia (IPFS)-->
<!--<IpfsCounter/>-->
<!--<br/>-->

<!--2. Create a OrbitDB Counter-->
<!--
<OrbitDBCounter/>-->


<!--3. Database Test-->
<!--<HeliaNetworkingTest/>-->
