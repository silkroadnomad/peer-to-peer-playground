<script>
    import { createLibp2p } from 'libp2p'
    import { gossipsub } from '@chainsafe/libp2p-gossipsub'
    import { noise } from '@chainsafe/libp2p-noise'
    import { mplex } from '@libp2p/mplex'
    import { yamux } from '@chainsafe/libp2p-yamux'
    import {webRTC, webRTCDirect} from '@libp2p/webrtc'
    import { webSockets } from '@libp2p/websockets'
    import * as filters from '@libp2p/websockets/filters'
    import { multiaddr } from '@multiformats/multiaddr'
    import { circuitRelayTransport } from 'libp2p/circuit-relay'
    import { identifyService } from 'libp2p/identify'
    import { fromString, toString } from 'uint8arrays'
    import {onMount} from "svelte";
    import {Column, Grid, Row, Button, TextInput, Select, SelectItem, TextArea} from "carbon-components-svelte";
    import {webTransport} from "@libp2p/webtransport";
    import {bootstrap} from "@libp2p/bootstrap";
    import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
    import {autoNATService} from "libp2p/autonat";
    import { clickToCopy } from "$lib/utils/click2Copy.js"
    import {pubsub} from "@helia/ipns/routing";
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
    ///ip4/65.21.180.203/tcp/9091/wss/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t
    onMount(async ()=>{
        // const address = "/dns4/ipfs.le-space.de/tcp/9091/wss/p2p-webrtc-star'"
        const multiaddrs = [ //add your own WebRTC Stars Servers here too!
            "/ip4/127.0.0.1/udp/4001/quic-v1/webtransport/certhash/uEiB8WKzyyA6fkDtE5JjEG-ZV4t4Y2vhLh8-G1kUhroZRuA/certhash/uEiAfJRn5MZPIJea_8SzaRF-BcpIjoXBPBIQr4TdOHzNnFA/p2p/12D3KooWJMzFdrzM7peD4het8s8gcRmQq1Jx4VzyM4eMnKQjbA4L"
            // '/ip4/65.21.180.203/udp/4004/webrtc-direct/certhash/uEiB4P97Mk0CSYGSSgX5JnMRM6PKRq9NckCB3XRJUqiflsw/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t',
            // '/dnsaddr/ipfs.le-space.de/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t',
//            '/ip4/65.21.180.203/tcp/4003/p2p-circuit/p2p/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t'
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
//             '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
        ];
        const bootstrapConfig = { list: multiaddrs };
        // const bootstrapConfig = { list: multiaddrs };
        libp2p = await createLibp2p({
            addresses: {
                // swarm: [address],
                listen: [
                    "/webrtc", "/wss", "/ws",
                ]
            },
            transports: [
                // the WebSocket transport lets us dial a local relay
                webSockets({
                    filter: filters.all                     // this allows non-secure WebSocket connections for purposes of the demo
                }),
                webRTC(),
                webRTCDirect(),
                    //{
                    // rtcConfiguration: {
                    //     iceServers: [
                    //         {
                    //             urls: [
                    //                 'stun:stun.l.google.com:19302',
                    //                 'stun:global.stun.twilio.com:3478',
                    //                 // 'STUN:freestun.net:3479',
                    //             ],
                    //         },
                    //         // {
                    //         //     credential: 'free',
                    //         //     username: 'free',
                    //         //     urls: ['TURN:freestun.net:3479', 'TURNS:freestun.net:5350'],
                    //         // },
                    //     ],
                    // },
                //}),
                // webRTCDirect(),
                webTransport(),
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
            streamMuxers: [
                yamux(),
                mplex()
            ],
            connectionGater: {
                denyDialMultiaddr: () => {
                    // by default we refuse to dial local addresses from the browser since they
                    // are usually sent by remote peers broadcasting undialable multiaddrs but
                    // here we are explicitly connecting to a local node so do not deny dialing
                    // any discovered address
                    return false
                }
            },
            peerDiscovery: [
                bootstrap(bootstrapConfig),
                pubsubPeerDiscovery()
            ],
            services: {
                identify: identifyService(),
                autoNAT: autoNATService(),
                pubsub: gossipsub({ allowPublishToZeroPeers: true })
                //pubsub: gossipsub({allowPublishToZeroPeers: true, emitSelf: false, canRelayMessage: true}),
                // pubsub: gossipsub({allowPublishToZeroPeers: true, emitSelf: true, canRelayMessage: true}),
            }
            // connectionManager: {
            //     minConnections: 0
            // }
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
        libp2p.addEventListener("peer:discovery", (evt) => {
            console.log("peer:discovery",evt.detail.id.toString())

        });

        /** update topic peers */
        setInterval(() => {
            // console.log("checking subscribers for topic",subscribeTopic)
            if(libp2p){
                const peerList = libp2p.services.pubsub.getSubscribers(subscribeTopic).map(peerId => peerId.toString())
                // console.log("found topicPeerList",peerList)
                topicPeerList = peerList;
            }

        }, 1500)

        libp2p.services.pubsub.addEventListener('message', event => {
            const topic = event.detail.topic
            // console.log("event.detail",event.detail)
            const message = toString(event.detail.data)
            // if(topic==='_peer-discovery._p2p._pubsub') return
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

    let text = ''
</script>
<svelte:window on:copysuccess={(it) => {
    console.log("it",it)
    text="Success"}} on:copyerror={() => {text="Error while copying"}} />
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
            <Select on:change={
                (evt) =>  text=evt.target.options[evt.target.selectedIndex].value}
                id="listeningAddressList"
                labelText="Listening Addresses" >
                <SelectItem value={"choose"} />
                {#each listeningAddressList as a}
                    <SelectItem value={a} />
                {/each}
        </Select>

        <div>
            {#if text!=='Success' && listeningAddressList.length>0}click2copy open in new browser{/if}
            <div use:clickToCopy>{text}</div></div>
        <Select id="connectedPeers" labelText="Connected Peers">
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