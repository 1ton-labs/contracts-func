import { Contract, ContractProvider } from "ton-core";

export type TonContract<T extends Contract> = { [P in keyof T]: P extends `send${string}` | `get${string}` ? T[P] extends (x: ContractProvider, ...args: infer P_1) => infer R ? (...args: P_1) => R : never : T[P]; }