import { sleep } from '@ton-community/blueprint/dist/utils';
import * as dotenv from 'dotenv';
import { Address, beginCell, toNano, TonClient4, WalletContractV4 } from "ton";

import { getItemForEnv, getKeyFromEnv, getKeyFromEnv2 } from "../utils/helpers";
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
    let keyPair2 = await getKeyFromEnv2();
    let wallet2 = WalletContractV4.create({ workchain, publicKey: keyPair2.publicKey});
    let walletContract2 = client4.open(wallet2);
    // 
    const { collection: collectionAddress, item: itemAddress } = getItemForEnv();
    let item = client4.open(BondItem.createFromAddress(Address.parse(itemAddress)));

    let nftData = await item.getNftData();
    console.log(` --------------- nft data before transfer ---------------`);
    console.log(` collection_address = ${nftData.collection_address} `);
    console.log(` index = ${nftData.index} `);
    console.log(` owner = ${nftData.owner_address} `);
    console.log(` --------------------------------------------------------`);

    await item.sendTransfer(
      walletContract.sender(keyPair.secretKey),
      { value: toNano("0.05") ,        
        newOwner: walletContract2.address,
        responseDestination: walletContract.address,
        forwardAmount: BigInt(0),
        forwardPayload: beginCell()
        .endCell(),
      },
    );

    sleep(15 * 1000);

    nftData = await item.getNftData();
    console.log(` --------------- nft data after transfer ---------------`);
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