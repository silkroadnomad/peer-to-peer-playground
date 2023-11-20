<script>
    import {
        Column,
        Grid,
        Row,
        Button,
        TextInput,
        Select,
        SelectItem,
        TextArea,
        ComboBox, Checkbox
    } from "carbon-components-svelte";
    import { onMount } from "svelte";
    import { createLibp2p } from 'libp2p'
    import { config } from '../config.js'
    import { query } from '../router.js'
    import { multiaddr } from '@multiformats/multiaddr'
    import { fromString, toString } from 'uint8arrays'

    import QRCodeModal from '../../lib/components/QRCodeModal.svelte'

    let libp2p
    let peerId
    let dialMultiaddr = localStorage.getItem("dialMultiaddr") || ''
    let subscribeTopic  = localStorage.getItem("subscribeTopic") || ''
    let topicPeerList = []
    let sendTopicMessageInputDisabled = false
    let sendTopicMessageButtonDisabled = false
    let sendTopicMessage
    let output = ''
    let listeningAddressList = []
    let peerConnectionsList = []

    let qrCodeOpen;
    let selectedListeningAddress

    let filterOutput

    let qrCodeData
    $:qrCodeData = `${window.location.origin}/${window.location.hash}?dial=${encodeURI(selectedListeningAddress)}`

    const dialMultiaddrItems =  [
        { id: "/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiBcDqgg_PQNURYgEM7UG2xuWSy-cXyvFiWp1EMDuS0gug/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM", text: "/ip4/159.69.119.82/udp/4004/webrtc-direct"},
        { id: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiAfc5WqLyw25HzgFs8OaMJ_gCqzX7S1a9BlnES5Qq5QHg/certhash/uEiAiA85j55j1DxtLpibTJsk8A_hXKCCFrd1n4ceEjxC6Sw/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM",
                text: "/ip4/159.69.119.82/udp/4001/quic-v1/webtransport" }
        ]

    $: { // if a query param was given in the url take the multiaddress
        if($query!==undefined && $query.split("=")[0]==='dial') {
            const textpart = $query.split("certhash")[0].substring(5) //cut away dial=
            dialMultiaddrItems.push({id:$query.split("=")[1],text:textpart})
            dialMultiaddr=dialMultiaddrItems[dialMultiaddrItems.length-1].id //preselect the last added
        }
    }

    /** store last dialedMultiAddress in localStorage */
    $: localStorage.setItem("dialMultiaddr",dialMultiaddr)
    $: localStorage.setItem("subscribeTopic",subscribeTopic)

    const appendOutput = (line) => {
        if(!line) return
        output = output+= `${line} \n`
    }

    const clean = (line) => line.replaceAll('\n', '')
    onMount(async ()=>{
        libp2p = await createLibp2p(config)
        peerId = libp2p.peerId.toString()
        libp2p.addEventListener('connection:open', (evt) => {
            console.log("connection:open",evt)
            updatePeerList()
        })
        libp2p.addEventListener('connection:close', (evt) => {
            console.log("connection:close",evt)
            updatePeerList()
        })
        libp2p.addEventListener("peer:discovery", (evt) => {
            console.log("peer:discovery",evt.detail.id.toString())
        });

        setInterval(() => {
            if(libp2p){
                const peerList = libp2p.services.pubsub.getSubscribers(subscribeTopic).map(peerId => peerId.toString())
                topicPeerList = peerList;
            }
        }, 1500)

        libp2p.services.pubsub.addEventListener('message', event => {
            const topic = event.detail.topic
            const message = toString(event.detail.data)

            if(!filterOutput)
                appendOutput(`Message received on topic '${topic}': ${message}`)
            else if (topic!=='_peer-discovery._p2p._pubsub')
                appendOutput(`Message received on topic '${topic}': ${message}`)
        })

        libp2p.addEventListener('self:peer:update', (evt) => {
            console.log("self:peer:update",evt)
            console.log(" libp2p.getMultiaddrs()", libp2p.getMultiaddrs())
            const multiaddrs = libp2p.getMultiaddrs().map((ma) => ma.toString())
            listeningAddressList = multiaddrs;
        })
    })

    /** Update connections list */
    function updatePeerList () {
        const peerList = libp2p.getPeers().map(peerId => peerId.toString())
        peerConnectionsList = peerList
        console.log("updatePeerList",peerConnectionsList)
    }

    /** dial remote peer */
    const dialMultiaddrButton = async () => {
        const ma = multiaddr(dialMultiaddr)
        appendOutput(`Dialing '${ma}'`)
        await libp2p.dial(ma)
        appendOutput(`Connected to '${ma}'`)
    }

    /** subscribe to pubsub topic */
    const subscribeTopicButton = async () => {
        appendOutput(`Subscribing to '${clean(subscribeTopic)}'`)
        const retVal = libp2p.services.pubsub.subscribe(subscribeTopic)
        console.log("retVal",retVal)
        sendTopicMessageInputDisabled = undefined
        sendTopicMessageButtonDisabled = undefined
    }

    /** send message to topic */
    const sendTopicMessageButton = async () => {
        appendOutput(`Sending message '${clean(sendTopicMessage)}'`)
        await libp2p.services.pubsub.publish(subscribeTopic, fromString(sendTopicMessage))
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
                <li>
<!--                    <div use:clickToCopy>/ip4/159.69.119.82/udp/4004/webrtc-direct/certhash/uEiD9nbBhAXN4rQqw8lNZF2ltpicsXzBSYrBaQ4SJu5JkOg/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM</div>-->
<!--                    <br/>-->
<!--                    <div use:clickToCopy>/ip4/159.69.119.82/udp/4001/quic-v1/webtransport/certhash/uEiAfc5WqLyw25HzgFs8OaMJ_gCqzX7S1a9BlnES5Qq5QHg/certhash/uEiAiA85j55j1DxtLpibTJsk8A_hXKCCFrd1n4ceEjxC6Sw/p2p/12D3KooWAu6KS53pN69d6WG7QWttL14LnodUkBjZ1LG7F73k58LM</div>-->
                <br/>
                </li>
                <li>Choose the relay's multiaddr (webrtc-direct / or webtransport) and hit "Dial Multiaddr" button (left side)</li>
                <li>Wait for a WebRTC address to appear in the "Listening Addresses" area (right side)</li>
                <li>Click "Open / Scan" in scan the QR-Code in your mobile phone or click on the multi address to copy it to clipboard for opening it in another borwser)</li>
                <li>Use the "Dial Multiaddr" section in the second window to dial the choosen multi address from the first browser</li>
                <li>Subscribe both windows to the same topic</li>
                <li>Send messages between the windows using the "PubSub" section</li>
            </ol>

            Remark:
            <ol>
                <li>for some reason this doesn't work with a Kubo - only with a local relay. With Kubo you must first both connect to the Kubo address and then one can dial the others address and start pubsub! </li>
                <li>
                    If you now open your mobile browser and do the same you will notice - it doesn't work. I need "normal" WebRTC to connect here!? Or could a webrtc-direct between to browsers without relay work too?
                </li>
            </ol>

        </Column>
    </Row>
    <Row>
        <Column>
            <QRCodeModal bind:qrCodeOpen={qrCodeOpen} on:close={qrCodeOpen=false} qrCodeData={qrCodeData} />
        </Column>
    </Row>
    <Row>
        <Column>
            <h2>Node</h2>
            <ComboBox
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
                disabled={listeningAddressList.length===0}
                on:change={ (evt) =>  {
                        selectedListeningAddress = evt.target.options[evt.target.selectedIndex].value
                        console.log("selectedListeningAddress",selectedListeningAddress)
                 }}
                id="listeningAddressList"
                labelText="Listening Addresses"
                size="sm">
                <SelectItem value={"choose"} />
                {#each listeningAddressList as a}
                    <SelectItem value={a} />
                {/each}
        </Select>

            <Button disabled={listeningAddressList.length==0 || !selectedListeningAddress}
                    on:click={() => { qrCodeOpen=(!qrCodeOpen) }} size="small">Open / Scan</Button>
                <Select id="connectedPeers" labelText="Connected Peers" size="sm">
                    {#each peerConnectionsList as c}
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
        <TextInput labelText="Send Message to Topic" bind:value={sendTopicMessage} type="text" id="send-topic-message-input" placeholder="hello world" disabled={sendTopicMessageInputDisabled}     size="sm" />
        <Button on:click={sendTopicMessageButton} id="send-topic-message-button" disabled={sendTopicMessageButtonDisabled} size="small">Send</Button>
    </Column>
        <Column>
<!--            <TextInput labelText="Filter Output" bind:value={filterOutput} type="text" placeholder="topic 'xyz'"   />-->
            <Checkbox checked={filterOutput} on:change={(evt) => {
                filterOutput = evt.target.checked}}    />
            <TextArea labelText="Output" value={output}  />
        </Column>
    </Row>
</Grid>