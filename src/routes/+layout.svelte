<script>
    import {
        Header,
        HeaderUtilities,
        HeaderAction,
        HeaderPanelLinks,
        HeaderPanelDivider,
        HeaderPanelLink,
        // SideNav,
        // SideNavItems,
        // SideNavMenu,
        // SideNavMenuItem,
        // SideNavLink,
        SkipToContent,
        Content,
        Grid,
        Row,
        Column,
        Theme, TileGroup, RadioTile, Tile,
    } from "carbon-components-svelte";
    import "carbon-components-svelte/css/all.css";
    import { expoIn } from "svelte/easing";
    import { goto } from "$app/navigation";

    let isSideNavOpen = false;
    let isOpen = false;

    let theme = "g90";
</script>
<Theme bind:theme={theme}/>
<Header company="Le Space" platformName="Examples of Peer-To-Peer between browsers" bind:isSideNavOpen on:click={() => goto("/")}>
    <svelte:fragment slot="skip-to-content">
        <SkipToContent />
    </svelte:fragment>
    <HeaderUtilities>
        <HeaderAction bind:isOpen transition={{ duration: 600, delay: 50, easing: expoIn }}>
            <HeaderPanelLinks>
                <HeaderPanelDivider>LibP2P</HeaderPanelDivider>
                <HeaderPanelLink on:click={()=>goto('/libp2p')}>pub sub example</HeaderPanelLink>
                <HeaderPanelDivider>Helia</HeaderPanelDivider>
                <HeaderPanelLink on:click={()=>goto('/ipfs')}>IPFS</HeaderPanelLink>
                <HeaderPanelDivider>OrbitDB</HeaderPanelDivider>
                <HeaderPanelLink on:click={()=>goto('/orbitdb')}>orbit-db examples</HeaderPanelLink>
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

<slot/>