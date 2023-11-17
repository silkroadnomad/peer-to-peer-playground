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
    import "carbon-components-svelte/css/all.css";
    import { expoIn } from "svelte/easing";
    import { hash } from './router.js'
    import Home from './+page.svelte'

    import LibP2PPubSubExample from './libp2p/+page.svelte'
    import HeliaCounter from './helia/counter/+page.svelte'
    import HeliaCounter2 from './helia/counter2/+page.svelte'

    let isSideNavOpen = false;
    let isOpen = false;
    let theme = "g90";
    const routes = {
        '': Home,
        '/libp2p/pubsub': LibP2PPubSubExample,
        '/helia/counter': HeliaCounter,
        '/helia/counter2': HeliaCounter2,
        '/orbitdb': LibP2PPubSubExample
    }
    $: view = routes[$hash]
</script>
<Theme bind:theme={theme}/>
<Header company="Le Space" platformName="Peer-To-Peer Playground " bind:isSideNavOpen href={ `/#` }>
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
<!--                <HeaderPanelLink  href={ `helia/remotePinning'` } >helia remote pinning</HeaderPanelLink>-->
                <HeaderPanelDivider>OrbitDB</HeaderPanelDivider>
                <HeaderPanelLink  href={ `#/orbitdb` }>orbit-db examples</HeaderPanelLink>
            </HeaderPanelLinks>
        </HeaderAction>
    </HeaderUtilities>
</Header>

<!--<SideNav bind:isOpen={isSideNavOpen}>-->
<!--    <SideNavItems>-->
<!--        <SideNavLink text="Link 1" />-->
<!--        <SideNavLink text="Link 2" />-->
<!--        <SideNavLink text="Link 3" />-->
<!--        <SideNavMenu text="Menu">-->
<!--            <SideNavMenuItem href="/" text="Link 1" />-->
<!--            <SideNavMenuItem href="/" text="Link 2" />-->
<!--            <SideNavMenuItem href="/" text="Link 3" />-->
<!--        </SideNavMenu>-->
<!--    </SideNavItems>-->
<!--</SideNav>-->
<p>&nbsp;</p>
<p>&nbsp;</p>
<p>&nbsp;</p>
<svelte:component this={ view } />