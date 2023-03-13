import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, Sender, SendMode, toNano, TupleBuilder } from 'ton-core';
import { FUNC_COIN_LENGTH, FUNC_INT_LENGTH } from '../utils/helpers';

export type LendingConfig = {owner: Address};

export function lendingConfigToCell(config: LendingConfig): Cell {
    const depositPool = Dictionary.empty();
    
    return beginCell()           
    .storeAddress(config.owner)
    .storeDict(Dictionary.empty())
    .storeDict(Dictionary.empty())
    .endCell();
}

export type Loan = {
    principal: bigint;
    repayment: bigint;
    start_time: bigint; 
    duration: bigint; 
    borrower: Address;
    lender: Address;
    item: Address
}

export type StartLoan = {
    investor: Address;
    item: Address;
    amount: bigint;
    repay_amount: bigint; 
    duration: bigint;
}

enum Opcodes {
    START_LOAN = 1 ,
    REPAY = 2 ,
    CLAIM = 3 ,
    DEPOSIT = 4 ,
    WITHDRAW = 5
}

(BigInt.prototype as any).toJSON = function() { return this.toString() }

export class Lending implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Lending(address);
    }

    static createFromConfig(config: LendingConfig, code: Cell, workchain = 0) {
        const data = lendingConfigToCell(config);
        const init = { code, data };
        return new Lending(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendStartLoan(provider: ContractProvider, via: Sender, value: bigint, startLoan: StartLoan){    
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.START_LOAN, 32) // op
            .storeUint(0, 64) // query_id
            .storeAddress(startLoan.investor)
            .storeAddress(startLoan.item)
            .storeUint(startLoan.amount, FUNC_COIN_LENGTH)
            .storeUint(startLoan.repay_amount, FUNC_COIN_LENGTH)
            .storeUint(startLoan.duration, 64)
            .endCell(),
        })
    }

    async sendRepay(provider: ContractProvider, via: Sender, value: bigint, item: Address){
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.REPAY, 32) // op
            .storeUint(0, 64) // query_id
            .storeAddress(item)
            .endCell(),
        })
    }

    async sendDeposit(provider: ContractProvider, via: Sender,  depositValue: bigint){
        await provider.internal(via, {
            value: depositValue,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.DEPOSIT, 32) // op
            .storeUint(0, 64) // query_id
            .storeUint(depositValue - toNano("0.01"), FUNC_COIN_LENGTH)
            .storeUint(depositValue, FUNC_COIN_LENGTH)
            .endCell(),
        })
    }

    async sendWithdraw(provider: ContractProvider, via: Sender,  withdrawValue: bigint){
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.WITHDRAW, 32) // op
            .storeUint(0, 64) // query_id
            .storeUint(withdrawValue, FUNC_COIN_LENGTH)
            .endCell(),
        })
    }

    async sendClaim(provider: ContractProvider, via: Sender, item:Address){
        await provider.internal(via, {
            value: toNano("0.01"),
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
            .storeUint(Opcodes.CLAIM, 32) // op
            .storeUint(0, 64) // query_id
            .storeAddress(item)
            .endCell(),
        })
    }

    async getDepositPool(provider: ContractProvider) {
        const source = (await provider.get('get_deposit_pool', [])).stack;
        let result = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.BigInt(FUNC_INT_LENGTH), source.readCellOpt());
        return result;
    }

    async getLoanPool(provider: ContractProvider) {
        const source = (await provider.get('get_loan_pool', [])).stack;
        const result: Map<Address, Loan> = new Map();
        let loanPool = Dictionary.loadDirect(Dictionary.Keys.Address(), Dictionary.Values.Cell(), source.readCellOpt());
        for (const item of loanPool.keys()) {
            const loan_cell = loanPool.get(item);
            if(loan_cell){
                result.set(item, this.parseLoan(loan_cell, item));
            }
        }
        return result;
    }

    async getLoan(provider: ContractProvider, item:Address){
        let builder = new TupleBuilder();
        builder.writeAddress(item);
        const loanCell = (await provider.get('get_loan', builder.build())).stack.readCellOpt();
        if(loanCell){
            return this.parseLoan(loanCell, item);
        }else{
            return null;
        }
    }

    async getDepositValue(provider: ContractProvider, user: Address){
        let builder = new TupleBuilder();
        builder.writeAddress(user);
        const result = await provider.get('get_deposit_value', builder.build());
        return result.stack.readBigNumber();
    }

    async getVersion(provider: ContractProvider){
        const source = await provider.get('get_version', []);
        return source.stack.readString();
    }

    async getLoanIndex(provider: ContractProvider){
        const source = await provider.get('get_loan_index', []);
        return source.stack.readNumber();
    }

    private parseLoan(loanCell: Cell, item:Address): Loan{
        const loan = loanCell.asSlice();
        const lender = loan.loadAddress();
        const borrower = loan.loadAddress();
        const principal = loan.loadUintBig(FUNC_COIN_LENGTH);
        const repayment = loan.loadUintBig(FUNC_COIN_LENGTH);
        const start_time = loan.loadUintBig(64);
        const duration =  loan.loadUintBig(64);
        const result = {
            principal,
            repayment,
            start_time,
            duration,
            borrower,
            lender,
            item
        };
        return result;
    }
}

const Lending_errors: { [key: number]: { message: string } } = {
    2: { message: `Stack undeflow` },
    3: { message: `Stack overflow` },
    4: { message: `Integer overflow` },
    5: { message: `Integer out of expected range` },
    6: { message: `Invalid opcode` },
    7: { message: `Type check error` },
    8: { message: `Cell overflow` },
    9: { message: `Cell underflow` },
    10: { message: `Dictionary error` },
    11: { message: `Function not found error` },
    13: { message: `Out of gas error` },
    32: { message: `Method ID not found` },
    34: { message: `Action is invalid or not supported` },
    37: { message: `Not enough TON` },
    38: { message: `Not enough extra-currencies` },
    128: { message: `Null reference exception` },
    129: { message: `Invalid serialization prefix` },
    130: { message: `Invalid incoming message` },
    131: { message: `Constraints error` },
    132: { message: `Access denied` },
    133: { message: `Contract stopped` },
    134: { message: `Invalid argument` },
    135: { message: `Code of a contract was not found` },
    136: { message: `Invalid address` },
    256: { message: `Address not init`}
}