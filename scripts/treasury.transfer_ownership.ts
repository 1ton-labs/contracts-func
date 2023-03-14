import * as dotenv from 'dotenv';
import {Address, toNano, TonClient4, WalletContractV4} from "ton";

import {
    getCollectionForEnv, getItemForEnv,
    getKeyFromEnv, getKeyFromEnv2,
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
    let workchain = 0;
    let oldOOwnerKP = await getKeyFromEnv()
    let oldOwnerWallet = WalletContractV4.create({workchain, publicKey: oldOOwnerKP.publicKey});
    let oldWalletContract = client4.open(oldOwnerWallet);

    let newOOwnerKP = await getKeyFromEnv2()
    let newOwnerWallet = WalletContractV4.create({workchain, publicKey: newOOwnerKP.publicKey});
    let newWalletContract = client4.open(newOwnerWallet);

    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${oldWalletContract.address}`)
    console.log(`wallet contract balances : ${await oldWalletContract.getBalance()}`)
    console.log(`------------------------------------------------`)
    if (await oldWalletContract.getBalance() < 1) {
        throw new Error(`Insufficient wallet balance`)
    }
    const {treasuryPool:treasuryPoolAddr} = getTreasuryPoolForEnv()

    const withdrawAmount = toNano("0.1")
    let treasuryPool = client4.open(new TreasuryPool(Address.parse(treasuryPoolAddr)));
    const {owner} = await treasuryPool.getPoolData()
    if (!oldWalletContract.address.equals(owner)) throw new Error(`Only owner can transfer ownership`)
    //TODO: check how much ton coin will be used
    await treasuryPool.sendTransferOwnership(oldWalletContract.sender(oldOOwnerKP.secretKey), {
        value: toNano("0.1"),
        newOwner: newWalletContract.address
    });
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${oldWalletContract.address}`)
    console.log(`wallet contract balances : ${await oldWalletContract.getBalance()}`)
    console.log(`Treasury pool contract address : ${treasuryPool.address.toString()}`)
    console.log(`Old Owner : ${oldWalletContract.address}`)
    console.log(`New Owner : ${newWalletContract.address}`)
    console.log(`---------------------------------------------------`)
    await new Promise(f => setTimeout(f, 15 * 1000));
    const poolData = await treasuryPool.getPoolData()
    console.log(`owner = ${poolData.owner}`);
    console.log(`balance = ${poolData.balance}`);
}


main()
    .then(() => console.log(`exec successfully`))
    .catch((err) => {
        console.log(`exec fail,err: ${err}`)
        process.exitCode = 1
    }).finally(() => process.exit())