import { compile } from '@ton-community/blueprint';
import { toNano, TonClient4, WalletContractV4 } from 'ton';
import { getKeyFromEnv, upsertEnvironmentVariable } from '../utils/helpers';
import { Lending } from '../wrappers/Lending';

export async function main() {

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

    let code = await compile('Lending');
    let lending = client4.open(Lending.createFromConfig({owner: walletContract.address}, code));
    // const collectionMetadata=await collection.getGetCollectionData()
    //TODO: check how much ton coin will be used
    await lending.sendDeploy(walletContract.sender(keyPair.secretKey), toNano("0.01"));
    console.log(`-----------Below is contract information-----------`)
    console.log(`wallet contract address : ${walletContract.address}`)
    console.log(`wallet contract balances : ${await walletContract.getBalance()}`)
    console.log(`lending contract address : ${lending.address}`)

    if(lending.address){
        await upsertEnvironmentVariable('LENDING_ADDRESS', lending.address.toString());
    }

}

main()
    .then(() => console.log(`exec successfully`))
    .catch((err) => {
        console.log(`exec fail,err: ${err}`)
        process.exitCode = 1
    }).finally(() => process.exit())