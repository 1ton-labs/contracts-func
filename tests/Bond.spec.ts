import { compile } from '@ton-community/blueprint';
import { Blockchain, OpenedContract, TreasuryContract } from '@ton-community/sandbox';
import '@ton-community/test-utils';
import { Address, Cell, toNano } from 'ton-core';
import { Bond, decodeCollectionContent, encodeCollectionContent } from '../wrappers/Bond';
import { BondItem } from '../wrappers/BondItem';

jest.setTimeout(50000);
const metadata = {
    url: 'https://s.getgems.io/nft-staging/c/628f6ab8077060a7a8d52d63/meta.json'
}
const LENDING_ADDRESS="EQBCD8JoObd_YG4W1CJyUiN1RIwway2CxVfVUVVzBUJdaVcP"
// (BigInt.prototype as any).toJSON = function() { return this.toString() }
describe('Bond', () => {
    let code: Cell;
    let bond: OpenedContract<Bond> ;
    let deployer: OpenedContract<TreasuryContract>
    let blockchain: Blockchain

    beforeEach(async () => {
        code = await compile('Bond');
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
    
        const bondItemCode = await compile('BondItem');
        bond = blockchain.openContract(Bond.createFromConfig({
            owner_address: deployer.address,
            next_item_index: 1,
            content: encodeCollectionContent(metadata.url),
            nft_item_code: bondItemCode,
            lending_protocol_address: Address.parse(LENDING_ADDRESS)
        }, code));
    });

    it('should deploy', async () => {
        const deployResult = await bond.sendDeploy(deployer.getSender(), toNano('1'));    
        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: bond.address,
            deploy: true,
        });

        const collectionUrl = `${metadata.url}`
        const collectionData = await bond.getCollectionData();
        expect(collectionData.next_item_index).toEqual(1);
        expect(collectionData.owner_address.equals(deployer.address)).toEqual(true);
        expect(
          decodeCollectionContent(collectionData.collection_content)
        ).toEqual(collectionUrl);
    
    });

    it('should mint', async ()=> {
        await bond.sendDeploy(deployer.getSender(), toNano('1'));   
         
        const minter = await blockchain.treasury('minter');
        const mintResult = await bond.sendMint(minter.getSender(), {
            nextItemId: 1,
            value: toNano('1'),
            owner: minter.address
        })
        
        expect(mintResult.transactions).toHaveTransaction({
            from: bond.address,
            to: minter.address,
            success: true
        });

        const bondItemAddress = await bond.getNftAddressByIndex(1);
        console.log(`bondItem = ${bondItemAddress?.toString()}`);

        if(bondItemAddress){
            const bondItem = blockchain.openContract(new BondItem(bondItemAddress));
            const nftData = await bondItem.getNftData();
            console.log(`index = ${nftData.index}`);
            console.log(`collection_address = ${nftData.collection_address.toString()}`);
            console.log(`owner = ${nftData.owner_address?.toString()}`);
        }

        const collectionData = await bond.getCollectionData();
        expect(collectionData.next_item_index).toEqual(2);
    })
});
