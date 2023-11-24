<script>
import { onMount } from "svelte";
import {
    Column,
    Grid,
    Row,
    Button,
    TextInput,
    Select,
    SelectItem,
    ComboBox,
    Checkbox
} from "carbon-components-svelte";

import { createLibp2p } from 'libp2p';
import { multiaddr } from '@multiformats/multiaddr';
import { fromString, toString } from 'uint8arrays';
import { config, dialMultiaddrItems } from './config.js';
import {handleOpenConnection, handleCloseConnection, handlePeerDiscovery, handlePeerUpdate} from './libp2pEvents.js'
import { query } from '../router.js';
import { libp2p, listeningAddressList, peerConnectionsList} from "../../stores.js";
import OutputLog from "$lib/components/OutputLog.svelte";
import QRCodeModal from '../../lib/components/QRCodeModal.svelte';

let peerId
let dialMultiaddr = localStorage.getItem("dialMultiaddr") || ''
let subscribeTopic  = localStorage.getItem("subscribeTopic") || ''
let topicPeerList = []
let sendTopicMessageInputDisabled = false
let sendTopicMessageButtonDisabled = false
let sendTopicMessage
let qrCodeOpen;
let selectedListeningAddress
let filterOutput
let outputLogComp
let qrCodeData

$:qrCodeData = `${window.location.origin}/${window.location.hash}?dial=${encodeURI(selectedListeningAddress)}`
$: {
    if($query!==undefined && $query.split("=")[0]==='dial') {
        const textpart = $query.split("certhash")[0].substring(5) //cut away dial=
        const id = $query.split("=")[1]
        addToDialItems(id,textpart)
    }
}
//update localStorage in case those variable get changed
$: localStorage.setItem("dialMultiaddr",dialMultiaddr)
$: localStorage.setItem("subscribeTopic",subscribeTopic)
const clean = (line) => line.replaceAll('\n', '')

onMount(async ()=>{
    $libp2p = await createLibp2p(config)
    peerId = $libp2p.peerId.toString()
    $libp2p.addEventListener('connection:open', handleOpenConnection);
    $libp2p.addEventListener('connection:close', handleCloseConnection);
    $libp2p.addEventListener('peer:discovery', handlePeerDiscovery);
    $libp2p.addEventListener('self:peer:update', handlePeerUpdate);

    setInterval(() => {
        if($libp2p){
            const peerList = $libp2p.services.pubsub.getSubscribers(subscribeTopic).map(peerId => peerId.toString())
            topicPeerList = peerList;
        }
    }, 1500)

    $libp2p.services.pubsub.addEventListener('message', event => {
        const topic = event.detail.topic
        const message = toString(event.detail.data)

        if(!filterOutput)
            outputLogComp.appendOutput(`Message received on topic '${topic}': ${message}`)
        else if (topic!=='_peer-discovery._p2p._pubsub')
            outputLogComp.appendOutput(`Message received on topic '${topic}': ${message}`)
    })


})

const addToDialItems = (id,text) => {
    dialMultiaddrItems.push({id,text})
    console.log("dialMultiaddrItems",dialMultiaddrItems)
    dialMultiaddr=dialMultiaddrItems[dialMultiaddrItems.length-1].id //preselect the last added
}

/** dial remote peer */
const dialMultiaddrButton = async () => {
    const ma = multiaddr(dialMultiaddr)
    outputLogComp.appendOutput(`Dialing '${ma}'`)
    await $libp2p.dial(ma)
    outputLogComp.appendOutput(`Connected to '${ma}'`)
}

/** subscribe to pubsub topic */
const subscribeTopicButton = async () => {
    outputLogComp.appendOutput(`Subscribing to '${clean(subscribeTopic)}'`)
    $libp2p.services.pubsub.subscribe(subscribeTopic)
    sendTopicMessageInputDisabled = undefined
    sendTopicMessageButtonDisabled = undefined
}

/** send message to topic */
const sendTopicMessageButton = async () => {
    outputLogComp.appendOutput(`Sending message '${clean(sendTopicMessage)}'`)
    await $libp2p.services.pubsub.publish(subscribeTopic, fromString(sendTopicMessage))
}
</script>
<Grid fullWidth>
    <Row>
        <Column>
            <h1>libp2p PubSub browser example</h1>
            <p>This example demonstrates the pubsub API running in a browser (webtransport doesn't work in Firefox yet, use WebRTC-direct here)</p>
        </Column>
        <Column>
            <ol>
                <li>Choose the relay's multiaddr (webrtc-direct / or webtransport) and hit "Dial Multiaddr" button (left side)</li>
                <li>Wait for a WebRTC address to appear in the "Listening Addresses" area (right side)</li>
                <li>Click "Open / Scan" in scan the QR-Code in your mobile phone or click on the multi address to copy it to clipboard for opening it in another borwser)</li>
                <li>Use the "Dial Multiaddr" section in the second window to dial the choosen multi address from the first browser</li>
                <li>Subscribe both windows to the same topic</li>
                <li>Send messages between the windows using the "PubSub" section</li>
            </ol>
            <p>&nbsp;</p>
            Remark / Question: With the 'old' WebRTC-Star nodes it was possible to just connect to one of those WebRTC-stars without knowing a peers MultiAddress.
            PubSub was automatically possible to both connected peers. Now it seems, we need to somewhat inform another browser about one relayed MultiAddress so he can connect?!
            I'd like to find a possibility to publish all connected browser peers MultiAddresses somewhere. (What about IPNS?)
            Or can I still publish MultiAddresses through the ipfs network on a certain protocol prefix so everybody else could receive it automatically and connect to each other?
        </Column>
    </Row>
    <Row>
        <Column>
            <QRCodeModal bind:qrCodeOpen={qrCodeOpen} on:close={()=>qrCodeOpen=false} qrCodeData={qrCodeData} />
        </Column>
    </Row>
    <Row>
        <Column>
            <h2>Node</h2>
            <ComboBox
                    on:keydown={ (evt) => {
                             if (evt.keyCode !== 13) return
                             console.log("evt",evt.target.value)
                            addToDialItems(evt.target.value,evt.target.value)
                    }}
                    bind:selectedId={dialMultiaddr}
                    id="dial-multiaddr-input"
                    placeholder="/ip4/127.0.0.1/tcp/1234/ws/p2p/123Foo"
                    titleText="Dial MultiAddr"
                    items={dialMultiaddrItems}
                    size="sm"
            />
            <Button on:click={dialMultiaddrButton} id="dial-multiaddr-button" size="small">Dial / Connect</Button>
        </Column>
        <Column>

        <TextInput labelText="PeerId" value={peerId} readonly id="dial-multiaddr-input"  placeholder="/ip4/127.0.0.1/tcp/1234/ws/p2p/123Foo"  size="sm" />
        <Select
                disabled={$listeningAddressList.length===0}
                on:change={ (evt) =>  {
                        selectedListeningAddress = evt.target.options[evt.target.selectedIndex].value
                        console.log("selectedListeningAddress",selectedListeningAddress)
                 }}
                id="listeningAddressList"
                labelText="Listening Addresses"
                size="sm">
                <SelectItem value={"choose"} />
                {#each $listeningAddressList as a}
                    <SelectItem value={a} />
                {/each}
        </Select>

            <Button disabled={$listeningAddressList.length==0 || !selectedListeningAddress}
                    on:click={() => { qrCodeOpen=(!qrCodeOpen) }} size="small">Open / Scan</Button>
                <Select id="connectedPeers" labelText="Connected Peers" size="sm">
                    {#each $peerConnectionsList as c}
                        <SelectItem value={c} />
                    {/each}
                </Select>
        </Column>
    </Row>
<Row>
    <Column>
        <h2>PubSub</h2>
        <TextInput labelText="Subscribe to topic"  bind:value={subscribeTopic} type="text" id="subscribe-topic-input" placeholder="my-topic"     size="sm"/>
        <Button on:click={subscribeTopicButton} id="subscribe-topic-button" size="small">Subscribe</Button>
    </Column>
    <Column>
        <Select labelText="Topic PeersTopic Peers"     size="sm">
            {#each topicPeerList as p}
                <SelectItem value={p} />
            {/each}
        </Select>
    </Column>
</Row>
<Row>
    <Column>
        <TextInput labelText="Send Message to Topic" bind:value={sendTopicMessage}
                   type="text" id="send-topic-message-input" placeholder="hello world"
                   on:keydown={(evt) => {
                       console.log("test")
                       if (evt.keyCode === 13) sendTopicMessageButton()
                   }}
                   disabled={sendTopicMessageInputDisabled} size="sm" />
        <Button on:click={sendTopicMessageButton} id="send-topic-message-button" disabled={sendTopicMessageButtonDisabled} size="small">Send</Button>
    </Column>
        <Column>
            <Checkbox checked={filterOutput} on:change={(evt) => { filterOutput = evt.target.checked}}    />
            <OutputLog bind:this={outputLogComp} labelText="Output" rows={10} />
        </Column>
    </Row>
</Grid>
