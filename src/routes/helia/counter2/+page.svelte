<script>
    import IpfsBlockStoreCounter from "./IpfsBlockStoreCounter.svelte";
    import {Column, Grid, Row,Select, SelectItem, TextInput} from "carbon-components-svelte";

    let ipfsConfusion = localStorage.getItem("ipfsConfusion") || "if you change this value, you can make sure this counter was never being saved inside IPFS"
    let levelStore = localStorage.getItem("levelStore") || "0"

    $:console.log("levelStore",levelStore)
</script>

<Grid>
    <Row>
        <Column>
            <h2>Levelstore Helia Counter</h2>
            <p>It stores and loads a counter value into a Helia node running inside the browser using a level store.
                Meaning the value of the counter is stored in leveldb inside the browser.
                The last CID of the counter is also stored in localStorage</p>
        </Column>
        <Column>
            <TextInput bind:value={ipfsConfusion} labelText="IPFS Confusion" placeholder={ipfsConfusion}/>
            <Select bind:selected={levelStore} on:change={ (evt) => {
                let selectElement = evt.target;
                localStorage.setItem("levelStore", selectElement.value);
            }}>
                <SelectItem value={"0"} text="MemoryStore"/>
                <SelectItem value={"1"} text="LevelStore"/>
            </Select>
        </Column>
        <Column>
            <IpfsBlockStoreCounter levelStore={levelStore} ipfsConfusion={ipfsConfusion} />
        </Column>
    </Row>
</Grid>

<style>
    h2,p {
        margin: 2rem;
    }
</style>