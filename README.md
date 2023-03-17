# 1TON Smart Contracts

This reposity contains the smart contracts of 1TON Treasury and 1TON Finance. The smart contracts are implemented in [FunC](https://ton.org/docs/develop/func/overview).


## User Flow

There are 4 main operations in 1TON:
1. Mint Bond
2. Borrow and Lend
3. Repay
4. Liquidate
  
### 1. Mint Bond

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
  X--Social graph data-->B1;
  Y--"Lens, Mirror, etc."-->B1;
  B1-->B;
```

### 2. Borrow and Lend

```mermaid
graph LR;
  A[Creator];
  C[Lending Protocol];
  D[Investor];
  A--List the NFT-->C;
  C--Show all listed NFTs-->D;
  D--Create an offer-->C;
  A--Accept the offer, Get the money and Transfer the NFT-->C;
```

### 3. Repay

```mermaid
graph LR;
  A[Creator];
  C[Lending Protocol];
  A--Pay the money back-->C;
  C--Transfer the NFT-->A;
```

### 4. Liquidate

```mermaid
graph LR;
  C[Lending Protocol];
  D[Investor];
  T[Treasury];
  E[Creator Platform];
  C--Investor claims the NFT-->D;
  D--Redirect creator income-->T;
  E--Deposit the creator income-->T;
  T--Transfer the bond NFT and withdraw the money-->D;
```

## Structure

-   `contracts` contains the source code of all the smart contracts and their dependencies.
-   `wrappers` contains the wrapper classes, which are implemented from `Contract` of `ton-core`, for the contracts. including any [de]serialization primitives and compilation functions.
-   `tests` tests for the contracts. Would typically use the wrappers.
-   `scripts` contains the deployment and testing scripts.

## Smart Contracts

The 1TON smart contract can be divided to three parts: 

- Bond - Represents the real world assets. 
  - `bond.fc` - The implementation of immutable NTF collection.
  - `bond-item.fc` - The implementation of immutable NTF item, which stores the bond terms and the creator information. 
- Lending Protocol - A peer-to-peer NFT lending protocol.
  - `lending.fc` - Stores the loan terms.
- Treasury - The creator's income is redirected to the Treasury if the corresponding Bond NFT is active, which usually means that a lender liquidate the Bond NFT from an expired loan.
  - `treasury_admin.fc` - Manage treasury pool 
  - `treasury_pool.fc` - Where real cash flow happens 

