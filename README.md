# 1TON Smart Contracts

This reposity contains the smart contracts of 1TON Treasury and 1TON Finance. The smart contracts are implemented in [FunC](https://ton.org/docs/develop/func/overview).


## User Flow 
  
  1. Mint Bond
    ![creator mint bond](https://1ton-static.s3.ap-south-1.amazonaws.com/creator-bond.png)
```mermaid
graph LR;
  A[Creator];
  B[Treasury];
  B1[Treasury Data Provider];
  E[Creator Platform];
  X[CyberConnect];
  Y[On-Chain Data];
  A--Register and Mint-->B;
  B--Issue an bond NFT-->A;
  E--Provide creator's financial record-->B1;
  X--Social Graph Data-->B1;
  Y--"Lens, Mirror, etc."-->B1;
  B1-->B;
```

  2. Borrow And Lend
    ```mermaid
    graph LR
      A[Creator]
      C[Lending Protocol]
      D[Investor]
      A--List the NFT-->C
      C--Show all listed NFTs-->D
      D--Create an offer-->C
      A--Accept the offer, Get the money and Transfer the NFT-->C
    ```
    ![borrow and lend](https://1ton-static.s3.ap-south-1.amazonaws.com/borrow-lend.png)

  3. Repay
    ```mermaid
    graph LR
      A[Creator]
      C[Lending Protocol]
      A--Pay the money back-->C
      C--Transfer the NFT-->A
    ```
    ![repay](https://1ton-static.s3.ap-south-1.amazonaws.com/repay.png)

  4. Liquidate
    ```mermaid
    graph LR
      C[Lending Protocol]
      D[Investor]
      T[Treasury]
      E[Creator Platform]
      C--Investor claims the NFT-->D
      D--Redirect creator income-->T
      E--Deposit the creator income-->T
      T--Transfer the bond NFT and withdraw the money-->D
    ```
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

