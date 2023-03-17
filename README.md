# 1TON Finance Smart Contract


## User Flow 
  
  1. Mint Bond
  ![creator mint bond](https://1ton-static.s3.ap-south-1.amazonaws.com/creator-bond.png)

  2. Borrow And Lend
  ![borrow and lend](https://1ton-static.s3.ap-south-1.amazonaws.com/borrow-lend.png)

  3. Repay
  ![repay](https://1ton-static.s3.ap-south-1.amazonaws.com/repay.png)

  4. Liquidate
  ![liquidate](https://1ton-static.s3.ap-south-1.amazonaws.com/liquidate.png)

## Layout
-   `contracts` - contains the source code of all the smart contracts of the project and their dependencies.
-   `wrappers` - contains the wrapper classes (implementing `Contract` from ton-core) for the contracts, including any [de]serialization primitives and compilation functions.
-   `tests` - tests for the contracts. Would typically use the wrappers.
-   `scripts` - contains scripts used by the project.   

## Contracts
1TON contract can be divided to three parts: 
- Bond  -  Represent real world assets. 
  - `bond.fc` - Implementation of immutable NTF Collection.
  - `bond-item.fc` - Implementation of immutable NTF item ,store creator information. 
- P2P NFT Lending Protocol - 
  - `lending.fc` - store loan information ,control life cycle of loan .
- Treasury - After liquidate, creator platform will redirect income of the creator to treasury pool 
  - `treasury_admin.fc` - Manage treasury pool 
  - `treasury_pool.fc` - Where real cash flow happens 

