import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, toNano, TupleBuilder } from 'ton-core';

export type BondConfig = {
    owner_address: Address, 
    next_item_index: number,
    content: Cell,
    nft_item_code: Cell,
    lending_protocol_address: Address
};

export type CollectionData = {
    next_item_index: number, 
    collection_content: Cell, 
    owner_address: Address,
    lending_protocol_address: Address
}

enum Opcodes {
    MINT = 0x1,
    BATCH_MINT = 0x2
};

export function bondConfigToCell(config: BondConfig): Cell {    
    return beginCell().storeAddress(config.owner_address)
    .storeUint(config.next_item_index, 64)
    .storeRef(config.content)
    .storeRef(config.nft_item_code)
    .storeAddress(config.lending_protocol_address).endCell();
}

export function encodeCollectionContent(url:string):Cell {
    const OFFCHAIN_CONTENT_PREFIX = 0x01;
    return beginCell().storeInt(OFFCHAIN_CONTENT_PREFIX, 8).storeStringRefTail(url).endCell();
}

export function decodeCollectionContent(cell:Cell):String{
    let slice=cell.beginParse()
    const url=slice.loadStringTail()
    return url
}

export class Bond implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Bond(address);
    }

    static createFromConfig(config: BondConfig, code: Cell, workchain = 0) {
        const data = bondConfigToCell(config);
        const init = { code, data };
        return new Bond(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendMint(provider: ContractProvider, via: Sender, opts: {
        nextItemId: number;
        value: bigint;
        owner: Address;
        queryID?: number;
    }){            
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.MINT, 32) // op
            .storeUint(opts.queryID ?? 0, 64) // query_id
            .storeUint(opts.nextItemId, 64) // item_index
            .storeCoins(toNano("0.04")) // amount
            .storeRef(beginCell()
              .storeAddress(opts.owner)
              .storeRef(beginCell().endCell())
              .endCell()) // nft_content
            .endCell(),
        });
    }

    async getCollectionData(provider: ContractProvider): Promise<CollectionData>{
        const result = await provider.get('get_collection_data', []);
        return {
            next_item_index: result.stack.readNumber(),
            collection_content: result.stack.readCell(),
            owner_address: result.stack.readAddress(),
            lending_protocol_address: result.stack.readAddress()
        }
    }

    async getNftAddressByIndex(provider: ContractProvider, itemIndex: number): Promise<Address | null>{
        let builder = new TupleBuilder();
        builder.writeNumber(itemIndex);
        const result = await provider.get('get_nft_address_by_index', builder.build());
        return result.stack.readAddressOpt();
    }
}
