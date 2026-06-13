const CHANNELS = [
  'tieutruong', 'tam', 'tamtieu', 'tambao', 'daitrang', 'phe',
  'bangquang', 'than', 'dam', 'vi', 'can', 'ty',
];

function round2(n) {
  return Math.round(n * 100) / 100;
}

function calculateBounds(vals) {
  const allVals = vals.filter(v => v > 0);
  const sum = allVals.reduce((a, b) => a + b, 0);
  const avg = round2(sum / allVals.length);
  const maxVal = Math.max(...allVals);
  const minVal = Math.min(...allVals);
  const range = maxVal - minVal;
  const midPoint = avg;
  const dungSai = round2(range / 6.0);
  return { midPoint, dungSai, upperLimit: round2(midPoint + dungSai), lowerLimit: round2(midPoint - dungSai) };
}

const left = [26, 42, 38, 40, 22, 28, 30, 22, 30, 36, 12, 10];
const right = [24, 30, 22, 32, 16, 20, 24, 20, 38, 38, 14, 18];

const upperBounds = calculateBounds([...left.slice(0, 6), ...right.slice(0, 6)]);
const lowerBounds = calculateBounds([...left.slice(6, 12), ...right.slice(6, 12)]);

console.log("Upper Bounds:", upperBounds);
console.log("Lower Bounds:", lowerBounds);

for (let i = 0; i < 12; i++) {
  const b = i < 6 ? upperBounds : lowerBounds;
  const L = left[i];
  const R = right[i];
  const avg = round2((L + R) / 2);
  const c10 = avg > b.midPoint ? 1 : avg < b.midPoint ? -1 : 0;
  const c8 = L > b.upperLimit ? 1 : L < b.lowerLimit ? -1 : 0;
  const c11 = R > b.upperLimit ? 1 : R < b.lowerLimit ? -1 : 0;
  console.log(`${CHANNELS[i].padEnd(12)}: L=${L}, R=${R}, Avg=${avg}, c10=${c10}, c8=${c8}, c11=${c11}`);
}
