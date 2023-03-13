import * as dotenv from 'dotenv';
import { KeyPair, mnemonicToPrivateKey } from "ton-crypto";
const fs = require("fs")
const replace = require('replace-in-file');
const ENV_FILE_LOCATION = ".env"
dotenv.config()

export async function getKeyFromEnv():Promise<KeyPair>{
    if (!process.env.MNEMONIC) throw new Error(`MNEMONIC not found, check .env file`)
    let mnemonics = process.env.MNEMONIC;
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(" "));
    return keyPair
}

export async function getKeyFromEnv2():Promise<KeyPair>{
    if (!process.env.MNEMONIC2) throw new Error(`MNEMONIC2 not found, check .env file`)
    let mnemonics = process.env.MNEMONIC2;
    let keyPair = await mnemonicToPrivateKey(mnemonics.split(" "));
    return keyPair
}


export function getCollectionForEnv():string{
    if (!process.env.COLLECTION_ADDRESS) throw new Error(`COLLECTION_ADDRESS not found, check .env file`)
    let collection = process.env.COLLECTION_ADDRESS;
    return collection
}

export function getItemForEnv():{collection:string,item:string}{
    if (!process.env.COLLECTION_ADDRESS) throw new Error(`COLLECTION_ADDRESS not found, check .env file`)
    if (!process.env.ITEM_ADDRESS) throw new Error(`ITEM_ADDRESS not found, check .env file`)
    const collection = process.env.COLLECTION_ADDRESS;
    const item = process.env.ITEM_ADDRESS;
    return {
        collection, item
    }
}

export async function upsertEnvironmentVariable(key: string, content: string){
    fs.readFile(ENV_FILE_LOCATION, function (err, data) {
        if (err) throw err;
        const envStr = `${key}="${content}"`
        if (data.indexOf(key) >= 0) {
            console.log(`replace envStr with key ${key}`);
            const reg = new RegExp(`${key}=".*"`, 'g')
            const options = {
                files: ENV_FILE_LOCATION,
                from: reg,
                to: envStr,
            };
            replace(options)
        } else {
            console.log(`append envStr`);
            fs.writeFileSync(ENV_FILE_LOCATION, "\n" + envStr, { flag: 'a+' });
        }
    });
    console.log(`---------------------------------------------------`)
    await new Promise(f => setTimeout(f, 5 * 1000));
}