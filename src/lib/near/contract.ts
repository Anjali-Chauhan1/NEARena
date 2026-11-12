import { providers } from "near-api-js";
import type { WalletSelector } from "@near-wallet-selector/core";
import { CONTRACT_NAME, DEFAULT_GAS, NEAR_NETWORK, STORAGE_DEPOSIT_YOCTO } from "./config";

const provider = new providers.JsonRpcProvider({ url: NEAR_NETWORK.nodeUrl });

export async function viewMethod<T = unknown>(
  methodName: string,
  args: Record<string, unknown> = {},
  contractId: string = CONTRACT_NAME
): Promise<T> {
  const result: any = await provider.query({
    request_type: "call_function",
    account_id: contractId,
    method_name: methodName,
    args_base64: Buffer.from(JSON.stringify(args)).toString("base64"),
    finality: "optimistic",
  });
  return JSON.parse(Buffer.from(result.result).toString());
}

export async function getAccountBalance(accountId: string): Promise<string> {
  try {
    const result: any = await provider.query({
      request_type: "view_account",
      account_id: accountId,
      finality: "optimistic",
    });
    return result.amount as string;
  } catch {
    return "0";
  }
}

export interface CallMethodOptions {
  methodName: string;
  args?: Record<string, unknown>;
  deposit?: string; // yoctoNEAR, defaults to "0"
  gas?: string;
  contractId?: string;
}

export async function callMethod(
  selector: WalletSelector,
  options: CallMethodOptions
): Promise<unknown> {
  const wallet = await selector.wallet();
  const { methodName, args = {}, deposit = "0", gas = DEFAULT_GAS, contractId = CONTRACT_NAME } = options;

  const outcome = await wallet.signAndSendTransaction({
    receiverId: contractId,
    actions: [
      {
        type: "FunctionCall",
        params: {
          methodName,
          args,
          gas,
          deposit,
        },
      },
    ],
  });

  return outcome;
}

export async function ftBalanceOf(accountId: string): Promise<string> {
  return viewMethod<string>("ft_balance_of", { account_id: accountId });
}

export async function storageBalanceOf(accountId: string): Promise<{ total: string; available: string } | null> {
  return viewMethod("storage_balance_of", { account_id: accountId });
}

export async function isStorageRegistered(accountId: string): Promise<boolean> {
  const balance = await storageBalanceOf(accountId);
  return balance !== null;
}

export async function ensureStorageDeposit(selector: WalletSelector, accountId: string) {
  const registered = await isStorageRegistered(accountId);
  if (registered) return;
  await callMethod(selector, {
    methodName: "storage_deposit",
    args: { account_id: accountId },
    deposit: STORAGE_DEPOSIT_YOCTO,
    gas: "30000000000000",
  });
}
