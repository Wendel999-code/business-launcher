import { Sale } from "@/types";
export const sales: Sale[] = Array.from({ length: 38 }, (_, day) =>
  ["downtown", "riverside", "uptown"].map((branchId, i) => {
    const date = new Date(Date.UTC(2026, 9, 8 - day))
      .toISOString()
      .slice(0, 10);
    const net =
      day === 0
        ? [68450, 61800, 54500][i]
        : Math.round(
            (44500 +
              Math.sin(day * 1.6 + i * 0.8) * 9500 +
              ((day * 719 + i * 4123) % 15000)) /
              50,
          ) * 50;
    const cash = Math.round(net * 0.38);
    const wallet = Math.round(net * 0.42);
    return {
      id: `S-${day}-${i}`,
      branchId,
      date,
      gross: net ,
      discounts: 0,
      transactions: day === 0 ? [187, 169, 148][i] : Math.round(net / 360),
      cash,
      wallet,
      card: net - cash - wallet,
      user: ["Isabella Reyes", "Miguel Santos", "Sofia Garcia"][i],
      status: "Submitted" as const,
    };
  }),
).flat();
