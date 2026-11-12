import { BTQ_DECIMALS } from "./config";

const BTQ_ONE = BigInt(10) ** BigInt(BTQ_DECIMALS);
const NEAR_ONE = BigInt(10) ** BigInt(24);

export function btqToYocto(amount: number | string): string {
  const [whole, frac = ""] = String(amount).split(".");
  const fracPadded = (frac + "0".repeat(BTQ_DECIMALS)).slice(0, BTQ_DECIMALS);
  const sign = whole.startsWith("-") ? BigInt(-1) : BigInt(1);
  const wholePart = BigInt(whole.replace("-", "") || "0") * BTQ_ONE;
  const fracPart = BigInt(fracPadded || "0");
  return (sign * (wholePart + fracPart)).toString();
}

export function yoctoToBtq(amount: string | bigint | undefined | null): number {
  if (amount === undefined || amount === null) return 0;
  const value = typeof amount === "bigint" ? amount : BigInt(amount);
  return Number(value) / Number(BTQ_ONE);
}

export function nearToYocto(amount: number | string): string {
  const [whole, frac = ""] = String(amount).split(".");
  const fracPadded = (frac + "0".repeat(24)).slice(0, 24);
  const wholePart = BigInt(whole || "0") * NEAR_ONE;
  const fracPart = BigInt(fracPadded || "0");
  return (wholePart + fracPart).toString();
}

export function yoctoToNear(amount: string | bigint | undefined | null): number {
  if (amount === undefined || amount === null) return 0;
  const value = typeof amount === "bigint" ? amount : BigInt(amount);
  return Number(value) / Number(NEAR_ONE);
}

export function shortenAccountId(accountId: string): string {
  if (accountId.length <= 20) return accountId;
  return `${accountId.slice(0, 10)}...${accountId.slice(-6)}`;
}
