<script>
    import ConnectedCounter from "./ConnectedCounter.svelte";
    import {Column, Grid, Row,Select, SelectItem, TextInput} from "carbon-components-svelte";

    let ipfsConfusion = localStorage.getItem("ipfsConfusion") || "if you change this value, you can make sure this counter was never being saved inside IPFS"
    let levelStore = localStorage.getItem("levelStore") || "0"

    $:console.log("levelStore",levelStore)
</script>

<Grid>
    <Row>
        <Column>
            <h2>Connected Helia Counter</h2>
            <p> This counter stores it's value inside the browsers Helia node as before.
                The value should be readable by the rest of the IPFS network (but isn't per se as it seems)
                The relay (Kubo) which can find the CID when doing ``ipfs cat`` on the command line.
                Unfortunately, so far another ipfs node can not find the cid and download it via our Kubo.
            </p>
        </Column>
        <Column>
            <TextInput bind:value={ipfsConfusion} labelText="IPFS Confusion" placeholder={ipfsConfusion}/>
            <Select bind:selected={levelStore} on:change={ (evt) => localStorage.setItem("levelStore",evt.target.value)}>
                <SelectItem value={"0"} text="MemoryStore"/><SelectItem value={"1"} text="LevelStore"/></Select>
        </Column>
        <Column>
            <ConnectedCounter levelStore={levelStore} ipfsConfusion={ipfsConfusion} />
        </Column>
    </Row>
</Grid>

<style>
    h2,p {
        margin: 2rem;
    }
</style>