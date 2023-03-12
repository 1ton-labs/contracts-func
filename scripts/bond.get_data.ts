import * as dotenv from 'dotenv';
import { Address, TonClient4 } from "ton";

import { getItemForEnv } from "../utils/helpers";
import { BondItem } from '../wrappers/BondItem';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })

    const { collection: collectionAddress, item: itemAddress } = getItemForEnv();

    if(itemAddress){
        console.log(`itemAddress = ${itemAddress}`);
        const bondItem = client4.open(new BondItem(Address.parse(itemAddress)));
        const nftData = await bondItem.getNftData();
        console.log(`init = ${nftData.init}`);
        console.log(`index = ${nftData.index}`);
        console.log(`collection_address = ${nftData.collection_address.toString()}`);
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