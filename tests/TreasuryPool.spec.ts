import {Blockchain, OpenedContract} from '@ton-community/sandbox';
import {Address, Cell, toNano} from 'ton-core';
import {TreasuryPool} from '../wrappers/TreasuryPool';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {TreasuryContract} from "@ton-community/sandbox/dist/treasury/Treasury";
import {getBalance} from "./helpers";


describe('TreasuryPool', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TreasuryPool');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();
        const deployer = await blockchain.treasury('deployer');
        const owner = await blockchain.treasury('owner');
        const nftItem = (await blockchain.treasury('nftItem')).address;
        const treasuryPool = await deployTreasuryPool(blockchain, deployer, owner.address, nftItem);
    });

    describe('TreasuryPool Method', () => {
        let blockchain: Blockchain;
        let deployer: OpenedContract<TreasuryContract>;
        let owner: OpenedContract<TreasuryContract>;
        let nftItem: Address;
        let treasuryPool: OpenedContract<TreasuryPool>;
        beforeAll(async () => {
            blockchain = await Blockchain.create();
            deployer = await blockchain.treasury('deployer');
            owner = await blockchain.treasury('owner');
            nftItem = (await blockchain.treasury('nftItem')).address;
            treasuryPool = await deployTreasuryPool(blockchain, deployer, owner.address, nftItem);
        })
        it('pool data should be correct', async () => {
            const data = await treasuryPool.getPoolData();
            expect(data.owner.equals(owner.address)).toEqual(true);
            expect(data.balance).toEqual(0n);
        });

        it('pool balance should be correct when user deposit coin', async () => {
            const depositAmount = toNano('0.1');
            const res = await treasuryPool.sendDeposit(owner.getSender(), {
                value: depositAmount,
            });
            expect(res.transactions).toHaveTransaction({
                from: owner.address,
                to: treasuryPool.address,
                success: true,
            });
            const {balance} = await treasuryPool.getPoolData();
            expect(balance).toEqual(depositAmount);
            const contractBal = await getBalance(blockchain, treasuryPool.address);
            expect(contractBal).toBeGreaterThanOrEqual(depositAmount);
        });

        it('pool balance should be correct when user withdraw coin', async () => {
            const depositAmount = toNano('0.1');
            const res = await treasuryPool.sendDeposit(owner.getSender(), {
                value: depositAmount,
            });
            expect(res.transactions).toHaveTransaction({
                from: owner.address,
                to: treasuryPool.address,
                success: true,
            });
            let {balance:preBal} = await treasuryPool.getPoolData();
            const withdrawAmount = toNano('0.05');
            const res2 = await treasuryPool.sendWithdraw(owner.getSender(), {
                value: toNano('0.05'),
                amount: withdrawAmount
            });
            expect(res2.transactions).toHaveTransaction({
                from: owner.address,
                to: treasuryPool.address,
                success: true,
            });
            const reminder = preBal - withdrawAmount;
            const {balance} = await treasuryPool.getPoolData();
            expect(balance).toEqual(reminder);
        });

        it('pool owner should be changed', async () => {
            const newOwner = await blockchain.treasury('newOwner');
            const res = await treasuryPool.sendTransferOwnership(owner.getSender(), {
                value: toNano("0.01"),
                newOwner: newOwner.address,
            });
            expect(res.transactions).toHaveTransaction({
                from: owner.address,
                to: treasuryPool.address,
                success: true,
            });
            const {owner:ownerEx} = await treasuryPool.getPoolData();
            expect(ownerEx.equals(newOwner.address)).toEqual(true);

        });
    })
});

export async function deployTreasuryPool(
    blockchain: Blockchain,
    deployer: OpenedContract<TreasuryContract>,
    owner: Address,
    nftItem: Address,
): Promise<OpenedContract<TreasuryPool>> {
    const code = await compile('TreasuryPool');
    const treasuryPool = blockchain.openContract(
        TreasuryPool.createFromConfig(
            {
                treasury_admin_address: deployer.address,
                nft_item_address: nftItem,
            },
            code
        )
    );
    const deployResult = await treasuryPool.sendDeploy(deployer.getSender(), {
        value: toNano('0.1'),
        ownerAddress: owner,
    });
    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: treasuryPool.address,
        success: true,
        deploy: true,
    });
    return treasuryPool;
}
