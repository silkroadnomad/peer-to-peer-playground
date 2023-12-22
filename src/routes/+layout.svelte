<script>
    import {
        Header,
        HeaderUtilities,
        HeaderAction,
        HeaderPanelLinks,
        HeaderPanelDivider,
        HeaderPanelLink,
        SkipToContent,
        Theme,
    } from "carbon-components-svelte";

    import LogoGithub from "carbon-icons-svelte/lib/LogoGithub.svelte";
    import "carbon-components-svelte/css/all.css";
    import { expoIn } from "svelte/easing";
    import { hash } from './router.js'
    import Home from './+page.svelte'

    import OrbitParticles from './orbitdb/basic/+page.svelte'
    import {goto} from "$app/navigation";
    import OrbitDBCounterWorking from "$lib/components/OrbitDBCounterWorking.svelte";

    let isSideNavOpen = false;
    let isOpen = false;
    let theme = "g90";
    const routes = {
        '': Home,
        // '/libp2p/pubsub': LibP2PPubSubExample,
        // '/helia/counter': HeliaCounter,
        // '/helia/counter2': HeliaCounter2,
        // '/helia/counter3': ConnectedCounter,
        '/orbitdb/basic': OrbitParticles,
        '/orbitdb/counter': OrbitDBCounterWorking
    }
    $: view = routes[$hash]
</script>
<Theme bind:theme={theme}/>
<Header company="Le Space" platformName="Peer-To-Peer Playground " bind:isSideNavOpen href={ `/#` }>
    <div on:click={()=>goto('https://github.com/silkroadnomad/peer-to-peer-playground')}>
        <LogoGithub  />
    </div>
    <svelte:fragment slot="skip-to-content">
        <SkipToContent />
    </svelte:fragment>
    <HeaderUtilities>
        <HeaderAction bind:isOpen transition={{ duration: 600, delay: 50, easing: expoIn }}>
            <HeaderPanelLinks>
                <HeaderPanelDivider>LibP2P</HeaderPanelDivider>
                <HeaderPanelLink href={ `#/libp2p/pubsub` }>pub sub example</HeaderPanelLink>
                <HeaderPanelDivider>Helia</HeaderPanelDivider>
                <HeaderPanelLink  href={ `#/helia/counter` }>counter with MemoryBlockstore</HeaderPanelLink>
                <HeaderPanelLink  href={ `#/helia/counter2` }>counter with LevelBlockstore</HeaderPanelLink>
                <HeaderPanelLink  href={ `#/helia/counter3` }>counter connected to IPFS network</HeaderPanelLink>
<!--                <HeaderPanelLink  href={ `helia/remotePinning'` } >helia remote pinning</HeaderPanelLink>-->
                <HeaderPanelDivider>OrbitDB</HeaderPanelDivider>
                <HeaderPanelLink  href={ `#/orbitdb/basic` }>orbit-db basic</HeaderPanelLink>
                <HeaderPanelLink  href={ `#/orbitdb/counter` }>orbit-db counter</HeaderPanelLink>
<!--                <HeaderPanelLink  href={ `#/orbitdb/replication` }>orbit-db replication</HeaderPanelLink>-->
            </HeaderPanelLinks>
        </HeaderAction>
    </HeaderUtilities>
</Header>
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<svelte:component this={ view } />