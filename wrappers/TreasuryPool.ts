import {
    Address,
    beginCell,
    Cell,
    Contract,
    contractAddress,
    ContractProvider,
    Sender,
    SendMode, toNano,
    TupleBuilder
} from 'ton-core';
import {Blockchain} from "@ton-community/sandbox";

export const Opcodes = {
    transferOwnership: 0x1,
    deposit: 0x2,
    withdraw: 0x3,
};

export type TreasuryPoolConfig = {
    treasury_admin_address: Address;
    nft_item_address: Address;
};

export function treasuryPoolConfigToCell(config: TreasuryPoolConfig): Cell {
    return beginCell()
        .storeAddress(config.treasury_admin_address)
        .storeAddress(config.nft_item_address)
        .endCell();
}

export class TreasuryPool implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {
    }

    static createFromAddress(address: Address) {
        return new TreasuryPool(address);
    }

    static createFromConfig(config: TreasuryPoolConfig, code: Cell, workchain = 0) {
        const data = treasuryPoolConfigToCell(config);
        const init = {code, data};
        return new TreasuryPool(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, opts: {
        value: bigint;
        queryID?: number;
        ownerAddress: Address;
    }) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeAddress(opts.ownerAddress) // owner_address
                .endCell(),
        });
    }

    async sendDeposit(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
        }
    ) {
        await provider.internal(via, {
            value: opts.value+toNano("0.03"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.deposit, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.value) // amount
                .endCell(),
        });
    }

    async sendWithdraw(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            amount: bigint;
        }
    ) {
        await provider.internal(via, {
            value: opts.value+toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.withdraw, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeCoins(opts.amount) // amount
                .endCell(),
        });
    }

    async sendTransferOwnership(
        provider: ContractProvider,
        via: Sender,
        opts: {
            value: bigint;
            queryID?: number;
            newOwner: Address;
        }
    ) {
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.transferOwnership, 32)
                .storeUint(opts.queryID ?? 0, 64)
                .storeAddress(opts.newOwner) // new owner
                .endCell(),
        });
    }

    async getPoolData(provider: ContractProvider): Promise<PoolData> {
        const result = await provider.get('get_pool_data', []);
        const owner = result.stack.readAddress();
        const balance = result.stack.readBigNumber();
        return {
            owner,
            balance,
        };
    }
}

export interface PoolData {
    owner: Address;
    balance: bigint;
}