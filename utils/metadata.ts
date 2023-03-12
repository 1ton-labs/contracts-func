import { beginCell, Cell } from "ton";

export function encodeCollectionContent(url:string):Cell {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    return beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(url).endCell();
}

export function decodeCollectionContent(cell:Cell):String{
    let slice=cell.beginParse()
    const url=slice.loadStringTail()
    return url
}