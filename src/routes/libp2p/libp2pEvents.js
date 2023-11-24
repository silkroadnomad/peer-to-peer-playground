import { libp2p, listeningAddressList, peerConnectionsList} from "../../stores.js";

let _libp2p
let _listeningAddressList = []
let _peerConnectionsList = []
libp2p.subscribe((value) => {
    _libp2p = value
});
listeningAddressList.subscribe((value) => {
    _listeningAddressList = value
});
peerConnectionsList.subscribe((value) => {
    _peerConnectionsList = value
});

export const handleOpenConnection = (evt) => {
    console.info("connection:open", evt);
    updatePeerList();
};

export const handleCloseConnection = (evt) => {
    console.info("connection:close", evt);
    updatePeerList();
};

export const handlePeerDiscovery = (evt) => {
    const newPeer = evt.detail.id.toString()

    if(_peerConnectionsList.indexOf(newPeer)===-1){
        console.info("peer:discovery - found new peer adding to list", evt.detail.id.toString());
        _peerConnectionsList.push(newPeer)
        peerConnectionsList.set(_peerConnectionsList)
    }
};

export const handlePeerUpdate = (evt) => {
    console.log("self:peer:update",evt)
    console.log("libp2p.getMultiaddrs()", _libp2p.getMultiaddrs())
    listeningAddressList.set(_libp2p.getMultiaddrs().map((ma) => ma.toString()));
}
/** Update connections list */
export function updatePeerList () {
    const peerList = _libp2p.getPeers().map(peerId => peerId.toString())
    peerConnectionsList.set(peerList);
}