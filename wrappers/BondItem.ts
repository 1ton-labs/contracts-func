import { Address, beginCell, Cell, Contract, ContractProvider, Sender, SendMode } from 'ton-core';

export type BondItemConfig = {};

export function bondItemConfigToCell(config: BondItemConfig): Cell {
    return beginCell().endCell();
}

enum Opcodes {
    TRANSFER = 0x5fcc3d14,
    BURN = 0x3,
    ACTIVATE = 0x4,
    DEACTIVATE = 0x5,
}

export class BondItem implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new BondItem(address);
    }

    async sendTransfer(provider: ContractProvider, via: Sender, opts: {
        newOwner: Address,
        responseDestination: Address,
        forwardAmount: bigint,
        forwardPayload: Cell ,
        value: bigint
    }) {
        console.log(`newOwner = ${opts.newOwner}`);
        console.log(`responseDestination = ${opts.responseDestination}`);
        
        await provider.internal(via, {
            value: opts.value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.TRANSFER, 32) // op
            .storeUint(0, 64) // query_id
            .storeAddress(opts.newOwner)
            .storeAddress(opts.responseDestination)
            .storeUint(0, 1)
            .storeCoins(opts.forwardAmount)
            .storeRef(opts.forwardPayload)
            .endCell(),
        }) 
    }

    async sendBurn(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.BURN, 32) // op
            .storeUint(0, 64) // query_id 
            .endCell()
        })
    }

    async sendActivate(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.ACTIVATE, 32) // op
            .storeUint(0, 64) // query_id 
            .endCell()
        })
    }

    async sendDeactivate(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value: value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.DEACTIVATE, 32) // op
            .storeUint(0, 64) // query_id 
            .endCell()
        })
    }

    async getNftData(provider: ContractProvider) {
        const result = await provider.get('get_nft_data', []);
        console.log(result.stack)
        return {
            init: result.stack.readNumber(),
            index: result.stack.readNumber(),
            activate_time: result.stack.readNumber(),
            collection_address: result.stack.readAddress(),
            owner_address: result.stack.readAddressOpt(),
            content: result.stack.readCellOpt(),
            lending_address: result.stack.readAddress(),
        }
    }
}
