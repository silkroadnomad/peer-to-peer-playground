<script>
    import { createLibp2p } from 'libp2p'
    import { gossipsub } from '@chainsafe/libp2p-gossipsub'
    import { noise } from '@chainsafe/libp2p-noise'
    import { yamux } from '@chainsafe/libp2p-yamux'
    import { webRTC } from '@libp2p/webrtc'
    import { webSockets } from '@libp2p/websockets'
    import * as filters from '@libp2p/websockets/filters'
    import { multiaddr } from '@multiformats/multiaddr'
    import { circuitRelayTransport } from 'libp2p/circuit-relay'
    import { identifyService } from 'libp2p/identify'
    import { fromString, toString } from 'uint8arrays'
    import {onMount} from "svelte";
    import {Column, Grid, Row, Button, TextInput, Select, SelectItem, TextArea} from "carbon-components-svelte";

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

    $: localStorage.setItem("dialMultiaddr",dialMultiaddr)
    $: localStorage.setItem("subscribeTopic",subscribeTopic)

    const appendOutput = (line) => {
        if(!line)return
        output = output+= `${line} \n`
    }
    const clean = (line) => line.replaceAll('\n', '')

    onMount(async ()=>{
        libp2p = await createLibp2p({
            addresses: {
                listen: [
                    // create listeners for incoming WebRTC connection attempts on all
                    // available Circuit Relay connections
                    '/webrtc'
                ]
            },
            transports: [
                // the WebSocket transport lets us dial a local relay
                webSockets({
                    // this allows non-secure WebSocket connections for purposes of the demo
                    filter: filters.all
                }),
                // support dialing/listening on WebRTC addresses
                webRTC(),
                // support dialing/listening on Circuit Relay addresses
                circuitRelayTransport({
                    // make a reservation on any discovered relays - this will let other
                    // peers use the relay to contact us
                    discoverRelays: 1
                })
            ],
            // a connection encrypter is necessary to dial the relay
            connectionEncryption: [noise()],
            // a stream muxer is necessary to dial the relay
            streamMuxers: [yamux()],
            connectionGater: {
                denyDialMultiaddr: () => {
                    // by default we refuse to dial local addresses from the browser since they
                    // are usually sent by remote peers broadcasting undialable multiaddrs but
                    // here we are explicitly connecting to a local node so do not deny dialing
                    // any discovered address
                    return false
                }
            },
            services: {
                identify: identifyService(),
                pubsub: gossipsub()
            },
            connectionManager: {
                minConnections: 0
            }
        })
        peerId = libp2p.peerId.toString()
        // update peer connections
        libp2p.addEventListener('connection:open', (evt) => {
            console.log("connection:open",evt)
            updatePeerList()
        })
        libp2p.addEventListener('connection:close', (evt) => {
            console.log("connection:close",evt)
            updatePeerList()
        })

        /** update topic peers */
        setInterval(() => {
            // console.log("checking subscribers for topic",subscribeTopic)
            const peerList = libp2p.services.pubsub.getSubscribers(subscribeTopic).map(peerId => peerId.toString())
            console.log("found topicPeerList",peerList)
            topicPeerList = peerList;
        }, 1500)

        libp2p.services.pubsub.addEventListener('message', event => {
            const topic = event.detail.topic
            const message = toString(event.detail.data)

            appendOutput(`Message received on topic '${topic}'`)
            appendOutput(message)
        })

        /** update listening addresses */
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
      //  output = output + `Dialing '${ma}'`
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
            <p>This example demonstrates the pubsub API running in a browser (please use a Chrome related browser)</p>
        </Column>
        <Column>
            <ol>
                <li>Start a relay using the command line:
                    <pre>$ node ./relay.js
                        Relay listening on multiaddr(s):  [
                            '{dialMultiaddr}'
                        ]
                    </pre>
                </li>
                <li>Copy the relay's multiaddr and use the "Dial Multaddr" section to dial the relay</li>
                <li>Wait for a WebRTC address to appear in the "Listening Addresses" area</li>
                <li>Open the same page in another browser window</li>
                <li>Use the "Dial Multiaddr" section in the second window to dial the WebRTC address from the first</li>
                <li>Subscribe both windows to the same topic using the "PubSub" section</li>
                <li>Send messages between the windows using the "PubSub" section</li>
            </ol>
        </Column>
    </Row>
    <Row>
        <Column>
            <h2>Node</h2>
            <TextInput labelText="Dial MultiAddr" bind:value={dialMultiaddr} id="dial-multiaddr-input"  placeholder="/ip4/127.0.0.1/tcp/1234/ws/p2p/123Foo" />
            <Button on:click={dialMultiaddrButton} id="dial-multiaddr-button">Connect</Button>
        </Column>
        <Column>

        <TextInput labelText="PeerId" value={peerId} readonly id="dial-multiaddr-input"  placeholder="/ip4/127.0.0.1/tcp/1234/ws/p2p/123Foo" />
            <Select labelText="Listening Addresses">
            {#each listeningAddressList as a}
                <SelectItem value={a} />
            {/each}
            </Select>
            <Select labelText="Connected Peers">
                {#each peerConnectionsList as c}
                    <SelectItem value={c} />
                {/each}
            </Select>
        </Column>
    </Row>
<Row>
    <Column>
        <h2>PubSub</h2>
        <TextInput labelText="Subscribe to topic"  bind:value={subscribeTopic} type="text" id="subscribe-topic-input" placeholder="my-topic" />
        <Button on:click={subscribeTopicButton} id="subscribe-topic-button">Subscribe</Button>
    </Column>
    <Column>
        <Select labelText="Topic PeersTopic Peers">
            {#each topicPeerList as p}
                <SelectItem value={p} />
            {/each}
        </Select>
    </Column>
</Row>
<Row>
    <Column>
        <TextInput labelText="Send Message to Topic" bind:value={sendTopicMessage} type="text" id="send-topic-message-input" placeholder="hello world" disabled={sendTopicMessageInputDisabled}  />
        <Button on:click={sendTopicMessageButton} id="send-topic-message-button" disabled={sendTopicMessageButtonDisabled}>Send</Button>
    </Column>
        <Column>
            <TextArea labelText="Output" value={output}/>
        </Column>
    </Row>
</Grid>