<script>
    import {Modal} from "carbon-components-svelte";
    import QRCode from "qrcode-generator";
    import {createEventDispatcher} from "svelte";
    const dispatch = createEventDispatcher();
    import { clickToCopy } from "../../utils.js"

    /**
     * @type {boolean}
     * when true qr-code modal is open
     */
    export let qrCodeOpen

    /**
     * the data to be transformed into an qr-code
     * @type {string}
     */
    export let qrCodeData

    /**
     * Generates a QR-Code with the given data
     * @param {string}data
     * @return {string} the
     */
    function generateQRCode(data) {
        const qr = QRCode(0, 'Q');
        qr.addData(data);
        qr.make();
        return qr.createImgTag(6);
    }

    let text = '';

    function copySuccess(){
        text = "Copied!"
    }
    function copyError(event){
        text = `Error! ${event.detail}`
    }
    $: console.log("qrCode open",qrCodeOpen)
    $: console.log("qrCodeData", qrCodeData)
</script>
<svelte:window on:copysuccess={copySuccess} on:copyerror={copyError}/>
<Modal bind:open={qrCodeOpen}
       modalHeading="Scan or Copy p2p connection link"
       primaryButtonText="OK"
       secondaryButtonText=""
       on:click:button--primary={ () => dispatch('close') }
       on:click:button--secondary={ () => dispatch('close') }
       on:close={()=>dispatch('close')}>

    <label for="qrCodeModal"
            use:clickToCopy>{qrCodeData}</label>&nbsp;<span id="qrCodeModal">{text}</span>
    <p></p>
    {#if qrCodeData && qrCodeOpen}{@html generateQRCode(qrCodeData)}{/if}
</Modal>