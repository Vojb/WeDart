/**
 * Score font that fits its cell width (needs an inline-size container parent):
 * capped at `maxSize`, shrinking as the score gets more digits.
 */
export const fitScoreFontSize = (score: number, maxSize: string): string => {
  const digits = Math.max(String(Math.round(score)).length, 2);
  return `min(${maxSize}, calc((100cqw - 4px) / ${(digits * 0.62).toFixed(2)}))`;
};
