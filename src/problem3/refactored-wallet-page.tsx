import { useMemo, type ComponentType, type HTMLAttributes } from "react";

type SupportedBlockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

interface WalletBalance {
  blockchain: string;
  currency: string;
  amount: number;
}

interface WalletRowProps {
  className?: string;
  amount: number;
  usdValue: number;
  formattedAmount: string;
}

interface Props extends HTMLAttributes<HTMLDivElement> {}

declare function useWalletBalances(): WalletBalance[];
declare function usePrices(): Record<string, number | undefined>;
declare const WalletRow: ComponentType<WalletRowProps>;
declare const classes: { row: string };

const BLOCKCHAIN_PRIORITY: Readonly<Record<SupportedBlockchain, number>> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

function getPriority(blockchain: string): number {
  return BLOCKCHAIN_PRIORITY[blockchain as SupportedBlockchain] ?? -99;
}

export function WalletPage(props: Props) {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return [...balances]
      .filter((balance) => getPriority(balance.blockchain) > -99 && balance.amount > 0)
      .sort(
        (left, right) =>
          getPriority(right.blockchain) - getPriority(left.blockchain),
      );
  }, [balances]);

  const walletRows = sortedBalances.map((balance) => {
    const usdValue = (prices[balance.currency] ?? 0) * balance.amount;

    return (
      <WalletRow
        className={classes.row}
        key={`${balance.blockchain}:${balance.currency}`}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.amount.toFixed(6)}
      />
    );
  });

  return (
    <div {...props}>
      {walletRows}
    </div>
  );
}
