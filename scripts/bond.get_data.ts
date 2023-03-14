import * as dotenv from 'dotenv';
import { Address, TonClient4, WalletContractV4 } from "ton";

import { getItemForEnv, getKeyFromEnv } from "../utils/helpers";
import { BondItem } from '../wrappers/BondItem';
import { Lending } from '../wrappers/Lending';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv();
    let workchain = 0;
    const { collection: collectionAddress, item: itemAddress } = getItemForEnv();
    const lendingAddress = process.env.LENDING_ADDRESS !!;
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey});
    let walletContract = client4.open(wallet);
    let lending = client4.open(new Lending(Address.parse(lendingAddress)));
    let loanPool = await lending.getLoanPool();
    console.log(`loan pool size: ${loanPool.size}`)
    
    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`wallet deposit : ${await lending.getDepositValue(walletContract.address)}`)

    
    if(itemAddress){
        console.log(`itemAddress = ${itemAddress}`);
        const bondItem = client4.open(new BondItem(Address.parse(itemAddress)));
        const nftData = await bondItem.getNftData();
        console.log(`init = ${nftData.init}`);
        console.log(`index = ${nftData.index}`);
        console.log(`collection_address = ${nftData.collection_address.toString()}`);
        console.log(`lending_address = ${nftData.lending_address.toString()}`);
        console.log(`owner = ${nftData.owner_address?.toString()}`);
        console.log(`content = ${nftData.content?.toString()}`);

        const loan = await lending.getLoan(Address.parse(itemAddress));
        console.log(`loan_borrower : ${JSON.stringify(loan?.borrower.toString())}`)
        console.log(`loan_lender : ${JSON.stringify(loan?.lender.toString())}`)
        console.log(`loan_item : ${JSON.stringify(loan?.item.toString())}`)
        console.log(`loan_principal : ${JSON.stringify(loan?.principal)}`)
        console.log(`loan_repayment : ${JSON.stringify(loan?.repayment)}`)
        console.log(`loan_start_time : ${JSON.stringify(loan?.start_time)}`)
        console.log(`loan_duration: ${JSON.stringify(loan?.duration)}`)
    }

}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())