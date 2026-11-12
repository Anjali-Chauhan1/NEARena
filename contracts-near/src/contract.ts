import {
  NearBindgen,
  near,
  call,
  view,
  initialize,
  UnorderedMap,
  assert,
  NearPromise,
} from "near-sdk-js";

const BTQ_ONE = BigInt("1000000000000000000"); // 1 BTQ, 18 decimals
const DEFAULT_RATE = BigInt("1000000000000000000000"); // 1 BTQ = 0.001 NEAR (yoctoNEAR per whole BTQ)
const STORAGE_COST = BigInt("1250000000000000000000"); // 0.00125 NEAR, standard NEP-145 registration cost
const GAS_FOR_FT_TRANSFER_CALL = BigInt("30000000000000");
const GAS_FOR_RESOLVE_TRANSFER = BigInt("10000000000000");

function assertOneYocto() {
  assert(
    near.attachedDeposit().toString() === "1",
    "Requires attached deposit of exactly 1 yoctoNEAR"
  );
}

@NearBindgen({})
class BtqToken {
  owner: string = "";
  rate: string = DEFAULT_RATE.toString();
  totalSupply: string = "0";
  accounts: UnorderedMap<string> = new UnorderedMap<string>("a");
  registered: UnorderedMap<boolean> = new UnorderedMap<boolean>("r");

  @initialize({})
  init({ owner_id }: { owner_id?: string }) {
    this.owner = owner_id || near.predecessorAccountId();
    this.rate = DEFAULT_RATE.toString();
    this.totalSupply = "0";
  }

  private getBalance(accountId: string): bigint {
    const raw = this.accounts.get(accountId);
    return raw ? BigInt(raw) : BigInt("0");
  }

  private setBalance(accountId: string, amount: bigint) {
    this.accounts.set(accountId, amount.toString());
  }

  private isRegistered(accountId: string): boolean {
    return !!this.registered.get(accountId);
  }

  private internalRegister(accountId: string) {
    if (!this.isRegistered(accountId)) {
      this.registered.set(accountId, true);
      if (!this.accounts.get(accountId)) {
        this.setBalance(accountId, BigInt("0"));
      }
    }
  }

  private requireRegistered(accountId: string) {
    assert(
      this.isRegistered(accountId),
      `Account ${accountId} is not registered. Call storage_deposit first.`
    );
  }

  private mint(accountId: string, amount: bigint) {
    this.internalRegister(accountId);
    this.setBalance(accountId, this.getBalance(accountId) + amount);
    this.totalSupply = (BigInt(this.totalSupply) + amount).toString();
  }

  private burnFrom(accountId: string, amount: bigint) {
    const balance = this.getBalance(accountId);
    assert(balance >= amount, "Insufficient BTQ balance");
    this.setBalance(accountId, balance - amount);
    this.totalSupply = (BigInt(this.totalSupply) - amount).toString();
  }

  // ---------- NEP-148 metadata ----------

  @view({})
  ft_metadata() {
    return {
      spec: "ft-1.0.0",
      name: "NEARena",
      symbol: "BTQ",
      decimals: 18,
      icon: null,
      reference: null,
      reference_hash: null,
    };
  }

  // ---------- NEP-145 storage management ----------

  @call({ payableFunction: true })
  storage_deposit({ account_id }: { account_id?: string }) {
    const accountId = account_id || near.predecessorAccountId();
    const deposit = near.attachedDeposit();

    if (this.isRegistered(accountId)) {
      if (deposit > BigInt("0")) {
        near.log(`${accountId} already registered, refunding deposit`);
        NearPromise.new(near.predecessorAccountId()).transfer(deposit);
      }
      return this.storage_balance_of({ account_id: accountId });
    }

    assert(
      deposit >= STORAGE_COST,
      `Attach at least ${STORAGE_COST.toString()} yoctoNEAR to register`
    );

    this.internalRegister(accountId);

    const refund = deposit - STORAGE_COST;
    if (refund > BigInt("0")) {
      NearPromise.new(near.predecessorAccountId()).transfer(refund);
    }

    return this.storage_balance_of({ account_id: accountId });
  }

  @view({})
  storage_balance_of({ account_id }: { account_id: string }) {
    if (!this.isRegistered(account_id)) return null;
    return {
      total: STORAGE_COST.toString(),
      available: "0",
    };
  }

  @view({})
  storage_balance_bounds() {
    return {
      min: STORAGE_COST.toString(),
      max: STORAGE_COST.toString(),
    };
  }

  // ---------- NEP-141 fungible token ----------

  @view({})
  ft_total_supply(): string {
    return this.totalSupply;
  }

  @view({})
  ft_balance_of({ account_id }: { account_id: string }): string {
    return this.getBalance(account_id).toString();
  }

  @call({ payableFunction: true })
  ft_transfer({
    receiver_id,
    amount,
    memo,
  }: {
    receiver_id: string;
    amount: string;
    memo?: string;
  }) {
    assertOneYocto();
    const senderId = near.predecessorAccountId();
    this.requireRegistered(senderId);
    this.requireRegistered(receiver_id);
    assert(senderId !== receiver_id, "Sender and receiver must differ");

    const amt = BigInt(amount);
    assert(amt > BigInt("0"), "Transfer amount must be positive");

    this.burnFrom(senderId, amt);
    this.mint(receiver_id, amt);

    near.log(`ft_transfer: ${amount} BTQ from ${senderId} to ${receiver_id}${memo ? ` (${memo})` : ""}`);
  }

  @call({ payableFunction: true })
  ft_transfer_call({
    receiver_id,
    amount,
    memo,
    msg,
  }: {
    receiver_id: string;
    amount: string;
    memo?: string;
    msg: string;
  }) {
    assertOneYocto();
    const senderId = near.predecessorAccountId();
    this.requireRegistered(senderId);
    this.requireRegistered(receiver_id);

    const amt = BigInt(amount);
    assert(amt > BigInt("0"), "Transfer amount must be positive");

    this.burnFrom(senderId, amt);
    this.mint(receiver_id, amt);
    near.log(`ft_transfer_call: ${amount} BTQ from ${senderId} to ${receiver_id}${memo ? ` (${memo})` : ""}`);

    const promise = NearPromise.new(receiver_id)
      .functionCall(
        "ft_on_transfer",
        JSON.stringify({ sender_id: senderId, amount, msg }),
        BigInt("0"),
        GAS_FOR_FT_TRANSFER_CALL
      )
      .then(
        NearPromise.new(near.currentAccountId()).functionCall(
          "ft_resolve_transfer",
          JSON.stringify({ sender_id: senderId, receiver_id, amount }),
          BigInt("0"),
          GAS_FOR_RESOLVE_TRANSFER
        )
      );

    return promise.asReturn();
  }

  @call({ privateFunction: true })
  ft_resolve_transfer({
    sender_id,
    receiver_id,
    amount,
  }: {
    sender_id: string;
    receiver_id: string;
    amount: string;
  }) {
    let usedAmount = BigInt(amount);
    try {
      const result = near.promiseResult(0);
      const unused = BigInt(JSON.parse(result));
      if (unused > BigInt("0") && unused <= usedAmount) {
        usedAmount = unused;
      } else {
        usedAmount = BigInt("0");
      }
    } catch {
      usedAmount = BigInt("0");
    }

    if (usedAmount > BigInt("0") && this.isRegistered(sender_id)) {
      const receiverBalance = this.getBalance(receiver_id);
      const refund = receiverBalance < usedAmount ? receiverBalance : usedAmount;
      if (refund > BigInt("0")) {
        this.burnFrom(receiver_id, refund);
        this.mint(sender_id, refund);
      }
    }

    return (BigInt(amount) - usedAmount).toString();
  }

  // ---------- NEARena game economy ----------

  @call({ payableFunction: true })
  buy() {
    const buyer = near.predecessorAccountId();
    this.requireRegistered(buyer);

    const deposit = near.attachedDeposit();
    assert(deposit > BigInt("0"), "Must attach NEAR to buy BTQ");

    const btqAmount = (deposit * BTQ_ONE) / BigInt(this.rate);
    assert(btqAmount > BigInt("0"), "Insufficient deposit to buy at least 1 BTQ");

    this.mint(buyer, btqAmount);
    near.log(`buy: ${buyer} purchased ${btqAmount.toString()} BTQ for ${deposit.toString()} yoctoNEAR`);

    return btqAmount.toString();
  }

  @call({})
  sell({ amount }: { amount: string }) {
    const seller = near.predecessorAccountId();
    this.requireRegistered(seller);

    const btqAmount = BigInt(amount);
    assert(btqAmount > BigInt("0"), "Must sell more than 0 BTQ");
    assert(this.getBalance(seller) >= btqAmount, "Insufficient BTQ balance");

    const nativeAmount = (btqAmount * BigInt(this.rate)) / BTQ_ONE;
    assert(
      near.accountBalance() >= nativeAmount,
      "Contract has insufficient NEAR balance to cover this sale"
    );

    this.burnFrom(seller, btqAmount);
    NearPromise.new(seller).transfer(nativeAmount);

    near.log(`sell: ${seller} sold ${amount} BTQ for ${nativeAmount.toString()} yoctoNEAR`);
    return nativeAmount.toString();
  }

  /**
   * Burns the caller's own BTQ. Used by the game client to lock a stake/pay a penalty.
   */
  @call({})
  burn({ amount }: { amount: string }) {
    const accountId = near.predecessorAccountId();
    this.requireRegistered(accountId);
    this.burnFrom(accountId, BigInt(amount));
    near.log(`burn: ${accountId} burned ${amount} BTQ`);
  }

  /**
   * Mints a game-win reward to the caller. Not signature-gated; fine for a hackathon
   * demo but a production build must verify the win server-side before minting.
   */
  @call({})
  record_game_win({ reward_amount }: { reward_amount: string }) {
    const accountId = near.predecessorAccountId();
    this.requireRegistered(accountId);
    const amt = BigInt(reward_amount);
    assert(amt > BigInt("0"), "Reward must be > 0");
    this.mint(accountId, amt);
    near.log(`record_game_win: minted ${reward_amount} BTQ to ${accountId}`);
  }

  @call({})
  set_rate({ new_rate }: { new_rate: string }) {
    assert(near.predecessorAccountId() === this.owner, "Only the owner can update the rate");
    const rate = BigInt(new_rate);
    assert(rate > BigInt("0"), "Rate must be > 0");
    this.rate = rate.toString();
    near.log(`set_rate: ${new_rate}`);
  }

  @view({})
  get_rate(): string {
    return this.rate;
  }

  @call({})
  withdraw() {
    assert(near.predecessorAccountId() === this.owner, "Only the owner can withdraw");
    const balance = near.accountBalance();
    NearPromise.new(this.owner).transfer(balance);
  }
}
