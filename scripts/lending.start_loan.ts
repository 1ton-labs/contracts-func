
import * as dotenv from 'dotenv';
import { Address, toNano, TonClient4, WalletContractV4 } from "ton";


import { getItemForEnv, getKeyFromEnv, getKeyFromEnv2 } from "../utils/helpers";
import { Lending } from '../wrappers/Lending';
dotenv.config()

async function main(){
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv();
    let keyPair2 = await getKeyFromEnv2();
    let workchain = 0;
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey});
    let wallet2 = WalletContractV4.create({ workchain, publicKey: keyPair2.publicKey});
    let walletContract = client4.open(wallet);
    let walletContract2 = client4.open(wallet2);
    const lendingAddress = process.env.LENDING_ADDRESS !!;
    let lending = client4.open(new Lending(Address.parse(lendingAddress)));

    const version = await lending.getVersion();
    console.log(`lending version: ${version}`)

    let loanPool = await lending.getLoanPool();
    console.log(`loan pool size: ${loanPool.size}`)

    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`wallet deposit : ${await lending.getDepositValue(walletContract.address)}`)
    console.log(`wallet2 contract address : ${walletContract2.address}`)
    console.log(`wallet2 contract balances : ${await walletContract2.getBalance()}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance()<1){
        throw new Error(`Insufficient wallet balance`)
    }

    const { collection: collectionAddress, item: itemAddress } = getItemForEnv();
    await lending.sendStartLoan(walletContract.sender(keyPair.secretKey), toNano("0.02"), {
        investor: walletContract.address,
        item: Address.parse(itemAddress),
        amount: toNano("0.03"),
        repay_amount: toNano("0.06"),
        duration: 86400n
    });
    // await lending.sendRepay(walletContract2.sender(keyPair2.secretKey), toNano("0.02"), Address.parse(itemAddress));
    await new Promise(f => setTimeout(f, 25 * 1000));
    loanPool = await lending.getLoanPool();
    console.log(`loan pool size: ${loanPool.size}`)
    const loan = await lending.getLoan(Address.parse(itemAddress));
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`wallet deposit : ${await lending.getDepositValue(walletContract.address)}`)
    console.log(`wallet2 contract address : ${walletContract2.address}`)
    console.log(`wallet2 contract balances : ${await walletContract2.getBalance()}`)
    console.log(`loan_borrower : ${JSON.stringify(loan?.borrower.toString())}`)
    console.log(`loan_lender : ${JSON.stringify(loan?.lender.toString())}`)
    console.log(`loan_item : ${JSON.stringify(loan?.item.toString())}`)
    console.log(`loan_principal : ${JSON.stringify(loan?.principal)}`)
    console.log(`loan_repayment : ${JSON.stringify(loan?.repayment)}`)
    console.log(`loan_start_time : ${JSON.stringify(loan?.start_time)}`)
    console.log(`loan_duration: ${JSON.stringify(loan?.duration)}`)
    console.log(`---------------------------------------------------`)
}   


main()
    .then(()=>console.log(`exec successfully`))
    .catch((err)=>{
        console.log(`exec fail,err: ${err}`)
        process.exitCode=1
    }).finally(()=>process.exit())