<script>
    import { TextArea } from "carbon-components-svelte";

    export let output = ''
    export let rows = 10
    export let labelText = "Output"
    export const appendOutput = (line) => {
        if(!line) return
        output = `${line} \n`+output
    }
</script>

<TextArea labelText={labelText} rows={rows} value={output} />
