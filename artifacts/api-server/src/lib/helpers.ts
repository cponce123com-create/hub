export function getLast6MonthsLabels(): Array<{ monthStr: string; label: string }> {
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    result.push({
      monthStr: d.toISOString().substring(0, 7),
      label: d.toLocaleString("es-PE", { month: "short", year: "numeric" }),
    });
  }
  return result;
}
