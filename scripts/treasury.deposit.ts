import * as dotenv from 'dotenv';
import {Address, toNano, TonClient4, WalletContractV4} from "ton";

import {
    getCollectionForEnv, getItemForEnv,
    getKeyFromEnv,
    getTreasuryAdminForEnv, getTreasuryPoolForEnv,
    getTreasuryPoolOwnerForEnv,
    upsertEnvironmentVariable
} from "../utils/helpers";
import {TreasuryPool} from "../wrappers/TreasuryPool";
import {TreasuryAdmin} from "../wrappers/TreasuryAdmin";

dotenv.config()

async function main() {
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv()
    let workchain = 0;

    let wallet = WalletContractV4.create({workchain, publicKey: keyPair.publicKey});
    let walletContract = client4.open(wallet);
    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance() < 1) {
        throw new Error(`Insufficient wallet balance`)
    }
    const {treasuryPool:treasuryPoolAddr} = getTreasuryPoolForEnv()

    const depositAmount = toNano("0.1")
    let treasuryPool = client4.open(new TreasuryPool(Address.parse(treasuryPoolAddr)));
    // TODO: check how much ton coin will be used
    await treasuryPool.sendDeposit(walletContract.sender(keyPair.secretKey), {
        value: toNano("0.1"),
    });
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`Treasury pool contract address : ${treasuryPool.address.toString()}`)
    console.log(`Receiver : ${wallet.address.toString()}`)
    console.log(`Deposit amount : ${depositAmount}`)
    console.log(`---------------------------------------------------`)
    await new Promise(f => setTimeout(f, 15 * 1000));
    const poolData = await treasuryPool.getPoolData()
    console.log(`owner = ${poolData.owner.toString()}`);
    console.log(`balance = ${poolData.balance}`);
}


main()
    .then(() => console.log(`exec successfully`))
    .catch((err) => {
        console.log(`exec fail,err: ${err}`)
        process.exitCode = 1
    }).finally(() => process.exit())