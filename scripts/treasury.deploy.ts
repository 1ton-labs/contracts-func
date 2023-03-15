import {compile} from '@ton-community/blueprint';
import * as dotenv from 'dotenv';
import {Address, toNano, TonClient4, WalletContractV4} from "ton";
import {getKeyFromEnv, upsertEnvironmentVariable} from "../utils/helpers";
import {encodeCollectionContent} from "../utils/metadata";
import {Bond} from '../wrappers/Bond';
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
    const owner=wallet.address
    const code = await compile('TreasuryAdmin');
    const poolCode = await compile('TreasuryPool');
    let treasuryAdmin = client4.open(TreasuryAdmin.createFromConfig({
        index: 12n,
        owner_address: owner,
        pool_code: poolCode,
    }, code));
    //TODO: check how much ton coin will be used
    await treasuryAdmin.sendDeploy(walletContract.sender(keyPair.secretKey), toNano("0.01"))
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`Treasury Admin contract address : ${treasuryAdmin.address}`)
    console.log(`Treasury Owner address : ${owner}`)
    console.log(`---------------------------------------------------`)
    await upsertEnvironmentVariable('TREASURY_ADMIN_ADDRESS', treasuryAdmin.address.toString());
    await upsertEnvironmentVariable('TREASURY_OWNER_ADDRESS', owner.toString());
}


main()
    .then(() => console.log(`exec successfully`))
    .catch((err) => {
        console.log(`exec fail,err: ${err}`)
        process.exitCode = 1
    }).finally(() => process.exit())