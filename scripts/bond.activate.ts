import * as dotenv from 'dotenv';
import { Address, beginCell, toNano, TonClient4, WalletContractV4 } from "ton";

import { getCollectionForEnv, getKeyFromEnv, getKeyFromEnv2, upsertEnvironmentVariable } from "../utils/helpers";
import { decodeCollectionContent } from "../utils/metadata";
import { Bond } from '../wrappers/Bond';
import { BondItem } from '../wrappers/BondItem';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    const keyPair = await getKeyFromEnv()
    const workchain = 0;
    
    const wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey});
    const walletContract = client4.open(wallet);

    const keyPair2 = await getKeyFromEnv2();
    const wallet2 = WalletContractV4.create({ workchain, publicKey: keyPair2.publicKey});
    const walletContract2 = client4.open(wallet2);

    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance()<1){
        throw new Error(`Insufficient wallet balance`)
    }

    const collectionAddress = getCollectionForEnv()
    const collection = client4.open(new Bond(Address.parse(collectionAddress)));
    const collectionMeta = await collection.getCollectionData()
    const nextTokenId = collectionMeta.next_item_index
    const itemAddress = await collection.getNftAddressByIndex(nextTokenId)

    // TODO: check how much ton coin will be used
    await collection.sendMint(
        walletContract.sender(keyPair.secretKey),
        {
            value: toNano("0.08"),
            nextItemId: nextTokenId,
            owner: walletContract.address
        }
    ); 
    console.log(`-----------Below is contract information-----------`)
    console.log(`collection contract address : ${collection.address}`)
    console.log(`collection metadata(owner) : ${collectionMeta.owner_address}`)
    console.log(`collection metadata(next_item_index) : ${collectionMeta.next_item_index}`)
    console.log(`collection metadata(content) : ${decodeCollectionContent(collectionMeta.collection_content)}`)
    console.log(`collection lending address : ${collectionMeta.lending_protocol_address}`)
    console.log(`item contract address : ${itemAddress || "not found"}`)
    console.log('---------------------------------------------------')

    await new Promise(f => setTimeout(f, 15 * 1000));

    if (itemAddress) {
        await upsertEnvironmentVariable('ITEM_ADDRESS', itemAddress.toString());
        const bondItem = client4.open(new BondItem(itemAddress));
        let nftData = await bondItem.getNftData();
        console.log(`init = ${nftData.init}`);
        console.log(`index = ${nftData.index}`);
        console.log(`activate_time = ${nftData.activate_time}`);
        console.log(`collection_address = ${nftData.collection_address.toString()}`);
        console.log(`lending_address = ${nftData.lending_address.toString()}`);
        console.log(`owner = ${nftData.owner_address?.toString()}`);
        console.log(`content = ${nftData.content?.toString()}`);
        console.log('---------------------------------------------------');

        // Check activation
        console.log('-----------------Check activation!-----------------');
        console.log('Activating...')
        await bondItem.sendActivate(walletContract.sender(keyPair.secretKey), toNano("0.03"));
        await new Promise(f => setTimeout(f, 15 * 1000));

        nftData = await bondItem.getNftData();
        console.log(`activate_time = ${nftData.activate_time}`);
        console.log(`timestamp = ${new Date().getTime() / 1000}`);
        console.log('---------------------------------------------------');

        console.log('Deactivating...')
        await bondItem.sendDeactivate(walletContract.sender(keyPair.secretKey), toNano("0.03"));
        await new Promise(f => setTimeout(f, 15 * 1000));

        nftData = await bondItem.getNftData();
        console.log(`activate_time = ${nftData.activate_time}`);
        console.log('---------------------------------------------------');

        console.log('Re-activating...')
        await bondItem.sendActivate(walletContract.sender(keyPair.secretKey), toNano("0.03"));
        console.log('Transferring...')
        await bondItem.sendTransfer(
            walletContract.sender(keyPair.secretKey),
            {
                value: toNano("0.05") ,        
                newOwner: walletContract2.address,
                responseDestination: walletContract.address,
                forwardAmount: BigInt(0),
                forwardPayload: beginCell().endCell(),
            },
        );
        await new Promise(f => setTimeout(f, 15 * 1000));

        nftData = await bondItem.getNftData();
        console.log(`activate_time = ${nftData.activate_time}`);
    }
}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())