import * as dotenv from 'dotenv';
import { Address, toNano, TonClient4, WalletContractV4 } from "ton";

import { getCollectionForEnv, getKeyFromEnv2, upsertEnvironmentVariable } from "../utils/helpers";
import { decodeCollectionContent } from "../utils/metadata";
import { Bond } from '../wrappers/Bond';
import { BondItem } from '../wrappers/BondItem';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv2()
    let workchain = 0;
    
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey});
    let walletContract = client4.open(wallet);
    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance()<1){
        throw new Error(`Insufficient wallet balance`)
    }
    const collectionAddress=getCollectionForEnv()
    let collection = client4.open(new Bond(Address.parse(collectionAddress)));
    const collectionMeta=await collection.getCollectionData()
    const nextTokenId=collectionMeta.next_item_index
    const itemAddress=await collection.getNftAddressByIndex(nextTokenId)
    //TODO: check how much ton coin will be used
    await collection.sendMint(walletContract.sender(keyPair.secretKey), { value: toNano("0.06"), nextItemId: nextTokenId, owner: walletContract.address }); 
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`collection contract address : ${collection.address}`)
    console.log(`collection metadata(owner) : ${collectionMeta.owner_address}`)
    console.log(`collection metadata(next_item_index) : ${collectionMeta.next_item_index}`)
    console.log(`collection metadata(content) : ${decodeCollectionContent(collectionMeta.collection_content)}`)
    console.log(`collection lending address : ${collectionMeta.lending_protocol_address}`)
    console.log(`item contract address : ${itemAddress || "not found"}`)
    console.log(`---------------------------------------------------`)
    await new Promise(f => setTimeout(f, 15 * 1000));
    if(itemAddress){
        await upsertEnvironmentVariable('ITEM_ADDRESS', itemAddress.toString());
        const bondItem = client4.open(new BondItem(itemAddress));
        const nftData = await bondItem.getNftData();
        console.log(`init = ${nftData.init}`);
        console.log(`index = ${nftData.index}`);
        console.log(`collection_address = ${nftData.collection_address.toString()}`);
        console.log(`lending_address = ${nftData.lending_address.toString()}`);
        console.log(`owner = ${nftData.owner_address?.toString()}`);
        console.log(`content = ${nftData.content?.toString()}`);
    }
}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())