// import pathJoin from './path-join.js'

const type = 'custom'

const AddressBookAccessController = ({ governorAddress, proposalId } = {}) => async ({ orbitdb, identities, address, name }) => {

    address = '/custom/address-book-access-controller'
    // if (governorAddress && proposalId) {
    //     address = pathJoin('/', type, governorAddress, proposalId)
    // } else {
    //     const parts = address.split('/')
    //     proposalId = parts.pop()
    //     governorAddress = parts.pop()
    // }
    //
    // if (!governorAddress) {
    //     throw new Exception('No governor contract specified')
    // }
    //
    // if (!proposalId) {
    //     throw new Exception("no proposalId specified")
    // }

    const canAppend = async (entry) => {
        // const writerIdentity = await identities.getIdentity(entry.identity)
        // if (!writerIdentity) {
        //     return false
        // }
        //
        // const { id } = writerIdentity
        //
        // const governor = await ethers.getContractAt('Governor', governorAddress)
        //
        // const hasWriteAccess = id === entry.payload.value.voter && await governor.canVote(proposalId, id, entry.payload.value.tokens)
        //
        // if (hasWriteAccess) {
        //     return identities.verifyIdentity(writerIdentity)
        // }
        //
        // return false
        return true
    }

    return {
        type,
        address,
        canAppend
    }
}

AddressBookAccessController.type = type

export default AddressBookAccessController