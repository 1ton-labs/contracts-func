import {Blockchain} from "@ton-community/sandbox";
import {Address} from "ton-core";

export async function getBalance(blockchain:Blockchain,addr:Address): Promise<bigint> {
    const {balance}=await blockchain.provider(addr).getState()
    return balance
}