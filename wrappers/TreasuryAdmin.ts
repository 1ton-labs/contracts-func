import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode,
    toNano, TupleBuilder
} from 'ton-core';

export type TreasuryAdminConfig = {
    index: bigint,
    owner_address: Address,
    pool_code: Cell,
};

export function treasuryAdminConfigToCell(config: TreasuryAdminConfig): Cell {
    return beginCell()
        .storeUint(config.index,64)
        .storeAddress(config.owner_address)
        .storeRef(config.pool_code)
        .endCell();
}

export const Opcodes = {
    createPool: 0x1,
};

export class TreasuryAdmin implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TreasuryAdmin(address);
    }

    static createFromConfig(config: TreasuryAdminConfig, code: Cell, workchain = 0) {
        const data = treasuryAdminConfigToCell(config);
        const init = {code, data};
        return new TreasuryAdmin(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendCreatePool(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            nftItemAddress: Address;
            ownerAddress: Address;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.createPool, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.nftItemAddress) // nft_item_address
                .storeCoins(toNano("0.04")) // amount
                .storeRef(
                    beginCell()
                        .storeAddress(opts.ownerAddress) // owner_address
                        .endCell()
                ) // content
                .endCell(),
        });
    }

    async getTreasuryPoolAddress(provider: ContractProvider, nftItemAddress: Address) {
        let builder = new TupleBuilder();
        builder.writeAddress(nftItemAddress);
        const result = await provider.get('get_treasury_pool_address', builder.build());
        return result.stack.readAddress();
    }
}
