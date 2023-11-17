<script>
    import { onMount } from "svelte";
    import { loadSlim } from "tsparticles-slim";
    let ParticlesComponent;

    onMount(async () => {
        const module = await import("svelte-particles");
        ParticlesComponent = module.default;
    });

    let particlesConfig = {
        fps_limit: 90,
        interactivity: {
            detect_on: "canvas",
            events: {
                resize: true
            }
        },
        particles: {
            color: { value: "#fff" },
            move: {
                bounce: false,
                direction: "bottom",
                enable: true,
                out_mode: "out",
                random: false,
                size: true,
                speed: 2,
                straight: false
            },
            number: { density: { enable: true, value_area: 400 }, value: 128 },
            opacity: {
                anim: { enable: false, opacity_min: 0.1, speed: 1, sync: false },
                random: true,
                value: 0.75
            },
            shape: {
                type: "circle"
            },
            size: {
                random: true,
                value: 3
            }
        },
        retina_detect: true
    }

    let onParticlesLoaded = (event) => {
        const particlesContainer = event.detail.particles;
        console.log("onParticlesLoaded",particlesContainer)
    };
    let particlesInit = async engine => {
        // you can use main to customize the tsParticles instance adding presets or custom shapes
        // this loads the tsparticles package bundle, it's the easiest method for getting everything ready
        // starting from v2 you can add only the features you need reducing the bundle size
        //await loadFull(engine);
        await loadSlim(engine);
    };

</script>

<style>
    /* 	canvas {
            display: block;
            vertical-align: bottom;
        } */

    :global(#tsparticles) {
        position: absolute;
        width: 100%;
        height: 100%;
        background-image: url("");
        background-repeat: no-repeat;
        background-size: cover;
        background-position: 50% 50%;
        pointer-events: none;
    }
</style>

<svelte:component
        this="{ParticlesComponent}"
        id="tsparticles"
        class="foo bar"
        style=""
        options="{particlesConfig}"
        on:particlesLoaded="{onParticlesLoaded}"
        particlesInit="{particlesInit}"
/>