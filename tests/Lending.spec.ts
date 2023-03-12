import { compile } from '@ton-community/blueprint';
import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { Address, Cell, toNano } from 'ton-core';
import { Bond, encodeCollectionContent } from '../wrappers/Bond';
import { Lending } from '../wrappers/Lending';

const metadata = {
    url: 'https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/meta.json'
}

describe('Lending', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let deployer: OpenedContract<TreasuryContract>;
    let investor: OpenedContract<TreasuryContract>;
    let borrower: OpenedContract<TreasuryContract>;
    let lending: OpenedContract<Lending> ;
    let bondItemAddress: Address ;

    beforeAll(async ()=> {
        code = await compile('Lending');
    } )

    beforeEach(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        investor = await blockchain.treasury('investor');
        borrower = await blockchain.treasury('borrower');
        lending = blockchain.openContract(Lending.createFromConfig({owner: deployer.address}, code));
        const bondItemCode = await compile('BondItem');
        let bond = blockchain.openContract(Bond.createFromConfig({
            owner_address: deployer.address,
            next_item_index: 1,
            content: encodeCollectionContent(metadata.url),
            nft_item_code: bondItemCode,
            lending_protocol_address: lending.address
        }, code));

        await bond.sendDeploy(deployer.getSender(), toNano('1'));   
        bondItemAddress = (await bond.getNftAddressByIndex(1))!!;
    });

    it('should deploy', async () => {
        const deployResult = await lending.sendDeploy(deployer.getSender(), toNano('0.05'));
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: lending.address,
            deploy: true,
        });
    });

    it('should deposit', async ()=> {
        await lending.sendDeploy(deployer.getSender(), toNano('0.05'));
        
        const investor = await blockchain.treasury('investor');
        let before_deposit = await lending.getDepositValue(investor.address);
        expect(before_deposit).toEqual(-1);
        
        await lending.sendDeposit(investor.getSender(), toNano("0.5"));
        let after_deposit = await lending.getDepositValue(investor.address);
        expect(after_deposit).toEqual(toNano("0.49"));
    })

    it('should start loan', async ()=> {
        await lending.sendDeploy(deployer.getSender(), toNano('0.05'));
        await lending.sendDeposit(investor.getSender(), toNano("10"));
        await lending.sendStartLoan(borrower.getSender(), toNano("0.01"), {
            investor: investor.address,
            item: bondItemAddress,
            amount: toNano("5"),
            repay_amount: toNano("6"),
            duration: 300n
        })

        const loan = await lending.getLoan(bondItemAddress);
        console.log(`loan = ${JSON.stringify(loan)}`);
        
        expect(loan).toBeTruthy();
        
    })
});
