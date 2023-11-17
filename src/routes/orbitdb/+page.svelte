<script>
    import Snow from './Snow.svelte'
</script>

<div class='snow'>
    <Snow/>
</div>

<style>
    :global(body) {
        background: #111;
    }
    .snow {
        grid-row: 1 / 2;
        grid-column: 1 / 2;
        z-index: 1;
    }
</style>
