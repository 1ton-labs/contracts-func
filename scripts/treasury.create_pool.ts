import * as dotenv from 'dotenv';
import {Address, toNano, TonClient4, WalletContractV4} from "ton";

import {
    getCollectionForEnv, getItemForEnv,
    getKeyFromEnv,
    getTreasuryAdminForEnv,
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
    const treasuryAddr = getTreasuryAdminForEnv()
    const poolOwner = getTreasuryPoolOwnerForEnv()
    const {item} = getItemForEnv()
    const itemAddr = Address.parse(item)
    const owner = Address.parse(poolOwner)
    let treasuryAdmin = client4.open(new TreasuryAdmin(Address.parse(treasuryAddr)));
    const poolAddr = await treasuryAdmin.getTreasuryPoolAddress(Address.parse(item))
    //TODO: check how much ton coin will be used
    await treasuryAdmin.sendCreatePool(walletContract.sender(keyPair.secretKey), {
        value: toNano("0.08"),
        nftItemAddress: itemAddr,
        ownerAddress: owner
    });
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`Treasury admin contract address : ${treasuryAdmin.address}`)
    console.log(`Treasury pool contract address : ${poolAddr}`)
    console.log(`---------------------------------------------------`)
    await new Promise(f => setTimeout(f, 15 * 1000));
    await upsertEnvironmentVariable('TREASURY_POOL_ADDRESS', poolAddr.toString());
    const pool = client4.open(new TreasuryPool(poolAddr));
    const poolData = await pool.getPoolData();
    console.log(`owner = ${poolData.owner.toString()}`);
    console.log(`balance = ${poolData.balance}`);
}


main()
    .then(() => console.log(`exec successfully`))
    .catch((err) => {
        console.log(`exec fail,err: ${err}`)
        process.exitCode = 1
    }).finally(() => process.exit())