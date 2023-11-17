import { readable } from 'svelte/store'

function getHash () {
    return location.hash.replace(/^#/, '')
}

export const hash = new readable(getHash(), set => {
    function setHash () {
        set(getHash())
    }

    window.addEventListener('hashchange', setHash)
    return () => window.removeEventListener('hashchange', setHash)
})
