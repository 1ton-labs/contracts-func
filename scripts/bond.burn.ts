import { sleep } from '@ton-community/blueprint/dist/utils';
import * as dotenv from 'dotenv';
import { Address, toNano, TonClient4, WalletContractV4 } from "ton";

import { getItemForEnv, getKeyFromEnv } from "../utils/helpers";
import { BondItem } from '../wrappers/BondItem';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv();
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

    const { collection: collectionAddress, item: itemAddress } = getItemForEnv();
    let item = client4.open(BondItem.createFromAddress(Address.parse(itemAddress)));

    let nftData = await item.getNftData();
    console.log(` --------------- nft data before burn ---------------`);
    console.log(` collection_address = ${nftData.collection_address} `);
    console.log(` index = ${nftData.index} `);
    console.log(` owner = ${nftData.owner_address} `);
    console.log(` --------------------------------------------------------`);

    await item.sendBurn(walletContract.sender(keyPair.secretKey),toNano("0.03"));

    sleep(15 * 1000);

    nftData = await item.getNftData();
    console.log(` --------------- nft data after burn ---------------`);
    console.log(` collection_address = ${nftData.collection_address} `);
    console.log(` index = ${nftData.index} `);
    console.log(` owner = ${nftData.owner_address} `);
    console.log(` --------------------------------------------------------`);

}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())