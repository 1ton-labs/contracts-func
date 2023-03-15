
import * as dotenv from 'dotenv';
import { Address, toNano, TonClient4, WalletContractV4 } from "ton";


import { getKeyFromEnv, getKeyFromEnv2 } from "../utils/helpers";
import { Lending } from '../wrappers/Lending';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv()
    let keyPair2 = await getKeyFromEnv2()
    let workchain = 0;
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey});
    let wallet2 = WalletContractV4.create({ workchain, publicKey: keyPair2.publicKey});
    let walletContract = client4.open(wallet);
    let walletContract2 = client4.open(wallet2);
    const lendingAddress = process.env.LENDING_ADDRESS !!;
    let lending = client4.open(new Lending(Address.parse(lendingAddress)));

    const version = await lending.getVersion();
    console.log(`lending version: ${version}`)

    const depositPool = await lending.getDepositPool();
    console.log(`deposit pool size: ${depositPool.size}`)


    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract raw address : ${walletContract.address.toRawString()}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`deposit value : ${await lending.getDepositValue(walletContract.address)}`)
    console.log(`wallet2 contract address : ${walletContract2.address}`)
    console.log(`wallet2 contract raw address : ${walletContract2.address.toRawString()}`)
    console.log(`wallet2 contract balances : ${await walletContract2.getBalance()}`)
    console.log(`deposit value2 : ${await lending.getDepositValue(walletContract2.address)}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance()<1){
        throw new Error(`Insufficient wallet balance`)
    }

    //TODO: check how much ton coin will be used
    await lending.sendDeposit(walletContract.sender(keyPair.secretKey), toNano("0.07"));
    await lending.sendDeposit(walletContract2.sender(keyPair2.secretKey), toNano("0.07"));
    await new Promise(f => setTimeout(f, 15 * 1000));
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`deposit value : ${await lending.getDepositValue(walletContract.address)}`)
    console.log(`wallet2 contract address : ${walletContract2.address}`)
    console.log(`wallet2 contract balances : ${await walletContract2.getBalance()}`)
    console.log(`deposit value2 : ${await lending.getDepositValue(walletContract2.address)}`)
    console.log(`---------------------------------------------------`)
}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())