// @ts-nocheck
import { useMemo } from "react";

type Blockchain = "Osmosis" | "Ethereum" | "Arbitrum" | "Zilliqa" | "Neo";

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

interface Props extends React.HTMLAttributes<HTMLDivElement> {}

declare function useWalletBalances(): WalletBalance[];
declare function usePrices(): Record<string, number | undefined>;
declare const WalletRow: React.ComponentType<WalletRowProps>;
declare const classes: { row: string };

const BLOCKCHAIN_PRIORITY: Record<Blockchain, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

function isBlockchain(value: string): value is Blockchain {
  return value in BLOCKCHAIN_PRIORITY;
}

function getPriority(blockchain: string): number {
  return isBlockchain(blockchain) ? BLOCKCHAIN_PRIORITY[blockchain] : -99;
}

export const WalletPage: React.FC<Props> = (props) => {
  const balances = useWalletBalances();
  const prices = usePrices();

  const sortedBalances = useMemo(() => {
    return balances
      .filter((balance) => {
        const priority = getPriority(balance.blockchain);
        return priority > -99 && balance.amount > 0;
      })
      .sort((lhs, rhs) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        if (leftPriority > rightPriority) return -1;
        if (rightPriority > leftPriority) return 1;
        return 0;
      });
  }, [balances]);

  const rows = useMemo(() => {
    return sortedBalances.map((balance) => {
      const price = prices[balance.currency] ?? 0;
      const usdValue = price * balance.amount;

      return (
        <WalletRow
          className={classes.row}
          key={`${balance.blockchain}-${balance.currency}`}
          amount={balance.amount}
          usdValue={usdValue}
          formattedAmount={balance.amount.toFixed(6)}
        />
      );
    });
  }, [sortedBalances, prices]);

  return <div {...props}>{rows}</div>;
};
