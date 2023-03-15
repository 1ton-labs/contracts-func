import { compile } from '@ton-community/blueprint';
import * as dotenv from 'dotenv';
import { Address, toNano, TonClient4, WalletContractV4 } from "ton";
import { getKeyFromEnv, upsertEnvironmentVariable } from "../utils/helpers";
import { encodeCollectionContent } from "../utils/metadata";
import { Bond } from '../wrappers/Bond';
dotenv.config()

async function main() {
    const client4 = new TonClient4({
        endpoint: "https://sandbox-v4.tonhubapi.com"
    })
    let keyPair = await getKeyFromEnv()
    let workchain = 0;
    let wallet = WalletContractV4.create({ workchain, publicKey: keyPair.publicKey });
    let walletContract = client4.open(wallet);
    console.log(`------------info of wallet contract-------------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`------------------------------------------------`)
    if (await walletContract.getBalance() < 1) {
        throw new Error(`Insufficient wallet balance`)
    }
    const lendingAddress = process.env.LENDING_ADDRESS !!;
    const metadata = {
        url: "https://1ton-labs-frontend.vercel.app/api/metadata/",
    }
    let content = encodeCollectionContent(metadata.url)
    const code = await compile('Bond');
    const bondItemCode = await compile('BondItem');
    let collection = client4.open(Bond.createFromConfig({
        owner_address: wallet.address,
        next_item_index: 0,
        content: content,
        nft_item_code: bondItemCode,
        lending_protocol_address: Address.parse(lendingAddress),
    }, code));
    
    //TODO: check how much ton coin will be used
    await collection.sendDeploy(walletContract.sender(keyPair.secretKey), toNano("0.01"))
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`collection contract address : ${collection.address}`)
    console.log(`---------------------------------------------------`)
    await upsertEnvironmentVariable('COLLECTION_ADDRESS', collection.address.toString());
    
}


main()
    .then(() => console.log(`exec successfully`))
    .catch((err) => {
        console.log(`exec fail,err: ${err}`)
        process.exitCode = 1
    }).finally(() => process.exit())