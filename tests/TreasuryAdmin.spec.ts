import {Blockchain, OpenedContract, SendMessageResult} from '@ton-community/sandbox';
import {Address, Cell, contractAddress, toNano} from 'ton-core';
import {TreasuryAdmin} from '../wrappers/TreasuryAdmin';
import '@ton-community/test-utils';
import {compile} from '@ton-community/blueprint';
import {TreasuryContract} from "@ton-community/sandbox/dist/treasury/Treasury";
import {TreasuryPool, treasuryPoolConfigToCell} from "../wrappers/TreasuryPool";
import {beginCell} from "ton";

describe('TreasuryAdmin', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('TreasuryAdmin');
    });

    it('should deploy', async () => {
        const blockchain = await Blockchain.create();
        const deployer = await blockchain.treasury('deployer');
        const treasuryAdmin = await deployTreasuryAdmin(blockchain, deployer);
    });
    describe('TreasuryAdmin Method', () => {
        let blockchain: Blockchain;
        let deployer: OpenedContract<TreasuryContract>;
        let treasuryAdmin: OpenedContract<TreasuryAdmin>;
        let nftItemAddr;
        beforeAll(async () => {
            blockchain = await Blockchain.create();
            deployer = await blockchain.treasury('deployer');
            nftItemAddr = (await blockchain.treasury('nftItem')).address;
            treasuryAdmin = await deployTreasuryAdmin(blockchain, deployer);
        })
        it('pool address should be correct', async () => {
            const poolAddr = await treasuryAdmin.getTreasuryPoolAddress(nftItemAddr);

            const poolCode = await compile('TreasuryPool');
            const pool = TreasuryPool.createFromConfig({
                treasury_admin_address: treasuryAdmin.address,
                nft_item_address: nftItemAddr
            }, poolCode, 0)
            expect(poolAddr.equals(pool.address)).toBe(true);
        });

        it('pool should be created successfully', async () => {
            const owner= await blockchain.treasury('owner');
            const res = await treasuryAdmin.sendCreatePool(deployer.getSender(), {
                value:toNano('0.80'),
                nftItemAddress: nftItemAddr,
                ownerAddress:owner.address,
            });
            expect(res.transactions).toHaveTransaction({
                from: deployer.address,
                to: treasuryAdmin.address,
                success: true,
            });
            const poolAddr = await treasuryAdmin.getTreasuryPoolAddress(nftItemAddr);
            console.log(poolAddr.toString())
        });
    })
});


export async function deployTreasuryAdmin(
    blockchain: Blockchain,
    deployer: OpenedContract<TreasuryContract>
): Promise<OpenedContract<TreasuryAdmin>> {
    const code = await compile('TreasuryAdmin');
    const poolCode = await compile('TreasuryPool');
    const treasuryAdmin = blockchain.openContract(
        TreasuryAdmin.createFromConfig(
            {
                index: 0n,
                owner_address: deployer.address,
                pool_code: poolCode,
            },
            code
        )
    );
    const deployResult = await treasuryAdmin.sendDeploy(deployer.getSender(), toNano('0.05'));
    expect(deployResult.transactions).toHaveTransaction({
        from: deployer.address,
        to: treasuryAdmin.address,
        success:true,
        deploy: true,
    });
    console.log(deployResult)
    return treasuryAdmin;
}