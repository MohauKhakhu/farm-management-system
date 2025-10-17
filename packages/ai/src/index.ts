export async function classifyPestImage(_image: Buffer): Promise<{ label: string; confidence: number }> {
  return { label: 'unknown', confidence: 0.0 };
}

export async function breedingRecommendation(_animalId: string): Promise<{ recommendation: string }> {
  return { recommendation: 'Insufficient data. Collect more lineage and performance metrics.' };
}

export function detectAnomaly(values: number[]): { isAnomaly: boolean; score: number } {
  if (values.length < 5) return { isAnomaly: false, score: 0 };
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const last = values[values.length - 1];
  const z = std === 0 ? 0 : Math.abs((last - mean) / std);
  return { isAnomaly: z > 3, score: z };
}
