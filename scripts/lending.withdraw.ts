
import * as dotenv from 'dotenv';
import { Address, toNano, TonClient4, WalletContractV4 } from "ton";


import { getKeyFromEnv } from "../utils/helpers";
import { Lending } from '../wrappers/Lending';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv()
    let workchain = 0;
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey});
    let walletContract = client4.open(wallet);
    const lendingAddress = process.env.LENDING_ADDRESS !!;
    let lending = client4.open(new Lending(Address.parse(lendingAddress)));

    const version = await lending.getVersion();
    console.log(`lending version: ${version}`)

    const depositPool = await lending.getDepositPool();
    console.log(`deposit pool size: ${depositPool.size}`)

    const deposit = await lending.getDepositValue(walletContract.address);
    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`deposit value : ${deposit}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance()<1){
        throw new Error(`Insufficient wallet balance`)
    }

    if(deposit.toString() == "-1"){
        throw new Error(`Please deposit first `)
    }

    //TODO: check how much ton coin will be used
    await lending.sendWithdraw(walletContract.sender(keyPair.secretKey), toNano("0.03"));
    await new Promise(f => setTimeout(f, 15 * 1000));
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`deposit value : ${await lending.getDepositValue(walletContract.address)}`)
    console.log(`---------------------------------------------------`)
}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())