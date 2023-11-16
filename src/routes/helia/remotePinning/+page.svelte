<script>
/*    import { Configuration, RemotePinningServiceClient, Status } from '@ipfs-shipyard/pinning-service-client'
    import { createHelia } from 'helia'
    import { json } from '@helia/json';
    import { createRemotePinner } from '@helia/remote-pinning'
    import {onMount} from "svelte";
    import {Column, Grid, Row, Button, TextInput, Select, SelectItem, TextArea} from "carbon-components-svelte";
    import {webSockets} from "@libp2p/websockets";
    import * as filters from "@libp2p/websockets/filters";
    import {webRTC, webRTCDirect} from "@libp2p/webrtc";
    import {webTransport} from "@libp2p/webtransport";
    import {circuitRelayTransport} from "libp2p/circuit-relay";
    import {noise} from "@chainsafe/libp2p-noise";
    import {yamux} from "@chainsafe/libp2p-yamux";
    import {mplex} from "@libp2p/mplex";
    import {bootstrap} from "@libp2p/bootstrap";
    import {pubsubPeerDiscovery} from "@libp2p/pubsub-peer-discovery";
    import {identifyService} from "libp2p/identify";
    import {autoNATService} from "libp2p/autonat";
    import { dcutrService } from 'libp2p/dcutr'
    import { kadDHT } from '@libp2p/kad-dht'
    import { ipnsSelector } from 'ipns/selector'
    import { ipnsValidator } from 'ipns/validator'

    import {gossipsub} from "@chainsafe/libp2p-gossipsub";

    const encoder = new TextEncoder()
    let remotePinningClient, remotePinner, helia,j
    let addPinResult = { status: 'nothing pinned yet'}

    let endpointUrl = "https://api.pinata.cloud/psa"
    let accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI4OThhZmZjOC1iNmMwLTQxNjItYjk2Zi1mOWIyMzcyMmY3N2MiLCJlbWFpbCI6Im5pY29AbGUtc3BhY2UuZGUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGluX3BvbGljeSI6eyJyZWdpb25zIjpbeyJpZCI6Ik5ZQzEiLCJkZXNpcmVkUmVwbGljYXRpb25Db3VudCI6MX1dLCJ2ZXJzaW9uIjoxfSwibWZhX2VuYWJsZWQiOmZhbHNlfSwiYXV0aGVudGljYXRpb25UeXBlIjoic2NvcGVkS2V5Iiwic2NvcGVkS2V5S2V5IjoiMWNlNjkyOWE4ODM4OWQ5NTdiNGIiLCJzY29wZWRLZXlTZWNyZXQiOiI5MzM1ODYwY2YzYjNhYTA3NmQyMWIyMGZhYjYwNDdjYjU4M2IwZmExOTY4MTAwMTAwM2JhYTc3ZTk5MjNmNDI0IiwiaWF0IjoxNjU0NTkwODMwfQ.dEWmr-AztXzVumARNe20kZ4cpn9uz0ycZESzvlcMrRk"
    let origins = []
    let remotes = []
    */

    /**
     * See issue: https://github.com/ipfs-examples/helia-examples/pull/147
     */
    /** onMount(async() => {
       const multiaddrs = [ //add your own WebRTC Stars Servers here too!
             '/ip4/65.21.180.203/udp/4001/webrtc-direct/12D3KooWALjeG5hYT9qtBtqpv1X3Z4HVgjDrBamHfo37Jd61uW1t'
            // '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
            // '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
            // '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
            // '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt',
            // '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ'
        ];
        const bootstrapConfig = { list: multiaddrs };
        helia = await createHelia({
            addresses: {
                // swarm: [address],
                listen: [
                    // create listeners for incoming WebRTC connection attempts on all
                    // available Circuit Relay connections
                    "/webrtc", "/wss", "/ws",
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
                // @ts-expect-error - types are borked...
                dcutr: dcutrService(),
                identify: identifyService(),
                autoNAT: autoNATService(),
                // pubsub: gossipsub(),
                pubsub: gossipsub({ allowPublishToZeroPeers: true }),
                // dht: kadDHT(),
                dht: kadDHT({
                    // pingTimeout: 2000,
                    // pingConcurrency: 3,
                    // kBucketSize: 20,
                    clientMode: true,
                    validators: {
                        ipns: ipnsValidator
                    },
                    selectors: {
                        ipns: ipnsSelector
                    }
                })
            }
            // connectionManager: {
            //     minConnections: 0
            // }
        })
        j = json(helia)
        helia.libp2p.addEventListener("peer:discovery", (evt) => {
            console.log("peer:discovery",evt.detail.id.toString())
            origins = helia.libp2p.getMultiaddrs()
        });
        /!** update listening addresses *!/
        helia.libp2p.addEventListener('self:peer:update', (evt) => {
            console.log("self:peer:update",evt)
            console.log(" libp2p.getMultiaddrs()", helia.libp2p.getMultiaddrs())
            const multiaddrs = helia.libp2p.getMultiaddrs().map((ma) => ma.toString())
            remotes = multiaddrs
        })
        helia.libp2p.addEventListener('connection:open', (evt) => {
            const conn = evt.detail

            if (conn.direction === 'inbound') {
                console.log("inbound connection", conn)
            }
            if (conn.direction === 'outbound') {
                console.log("outbound connection", conn)
                // remotes.push(conn.remoteAddr)
            }
            else console.log("other connection", conn)
        })

        const pinServiceConfig = new Configuration({
            endpointUrl: endpointUrl, // the URI for your pinning provider, e.g. `http://localhost:3000`
            accessToken: accessToken // the secret accessToken/key given to you by your pinning provider
        })

        remotePinningClient = new RemotePinningServiceClient(pinServiceConfig)
        remotePinner = createRemotePinner(helia, remotePinningClient)
    }) */

    /**
     * addPin
     */
    // const addPin = async () => {
    //     // const cid = await helia.addBytes(encoder.encode('hello world'))
    //     const cid = await j.add({greet:'hello world'})
    //     addPinResult = await remotePinner.addPin({
    //         cid,
    //         origins: origins,
    //         name: 'pinned-great-01'
    //     })
    // }

    // $:console.log("origins",origins)
    // $:console.log("remotes",remotes)
</script>

<!--<Grid>-->
<!--    <Row>-->
<!--        <Column>-->
<!--            <h2>Remote Pinning</h2>-->
<!--            <p>-->
<!--                This example should demonstrate remote pinning (e.g. via https://www.pinata.cloud/) in the browser.-->
<!--            </p>-->
<!--            <ol>-->
<!--                <li>1. It should use https://github.com/ipfs/helia-remote-pinning (https://www.npmjs.com/package/@helia/remote-pinning)</li>-->
<!--                <li>2. Copy code from tests https://github.com/ipfs/helia-remote-pinning/blob/main/test/index.spec.ts into this file</li>-->
<!--                <li>3. Since this is a browser example this might not work as of https://github.com/ipfs-examples/helia-examples/pull/147</li>-->
<!--                <li>4. When finished: working here: https://github.com/ipfs/helia-remote-pinning/blob/main/test/index.spec.ts</li>-->
<!--            </ol>-->
<!--        </Column>-->
<!--    </Row>-->
<!--    <Row class="distance-please">-->
<!--        <Column>-->
<!--            <TextInput bind:value={endpointUrl} labelText="pinningServer api endpointUrl" placeholder="e.g. https://api.pinata.cloud/psa"/>-->
<!--        </Column>-->
<!--    </Row>-->
<!--    <Row class="distance-please">-->
<!--        <Column>-->
<!--            <TextInput bind:value={accessToken} labelText="IPFS Confusion" placeholder="add your pinata GWT here"/>-->
<!--        </Column>-->
<!--    </Row>-->
<!--    <Row class="distance-please">-->
<!--        <Column>-->
<!--            {#if origins.length>0}-->
<!--                <Button on:click={addPin}>Add Pin</Button>-->
<!--                <h3>PinResult: {addPinResult?.status}</h3>-->
<!--            {:else}-->
<!--                looking for my multi address - otherwise I can't pin.-->
<!--            {/if}-->
<!--        </Column>-->
<!--    </Row>-->

<!--</Grid>-->

<style>
    /*:global(.distance-please) { margin: 2rem}*/
    /*h2,p,ol {*/
    /*    margin: 2rem;*/
    /*}*/
</style>

