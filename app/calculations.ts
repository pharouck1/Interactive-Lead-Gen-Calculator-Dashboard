export type RoofExposure = 'Low' | 'Average' | 'High';
export type PropertyType = 'Residential' | 'Commercial';

export const exposureFactors: Record<RoofExposure, number> = {
  Low: 0.65,
  Average: 0.85,
  High: 1,
};

export const locations = [
  { state: 'California', code: 'CA', rate: 0.30, inflation: 0.052 },
  { state: 'Colorado', code: 'CO', rate: 0.14, inflation: 0.041 },
  { state: 'Florida', code: 'FL', rate: 0.15, inflation: 0.038 },
  { state: 'Massachusetts', code: 'MA', rate: 0.29, inflation: 0.047 },
  { state: 'New York', code: 'NY', rate: 0.23, inflation: 0.043 },
  { state: 'Texas', code: 'TX', rate: 0.14, inflation: 0.039 },
  { state: 'Washington', code: 'WA', rate: 0.12, inflation: 0.035 },
  { state: 'Other / national average', code: 'US', rate: 0.17, inflation: 0.04 },
] as const;

export type LocationCode = (typeof locations)[number]['code'];

export type CalculatorInputs = {
  monthlyBill: number;
  exposure: RoofExposure;
  propertyType: PropertyType;
  location: LocationCode;
};

export type ProjectionYear = {
  year: string;
  doingNothing: number;
  solar: number;
};

export function calculateSavings(inputs: CalculatorInputs) {
  const location = locations.find((item) => item.code === inputs.location) ?? locations.at(-1)!;
  const monthlySavings = inputs.monthlyBill * exposureFactors[inputs.exposure] * 0.75;
  const systemCost = inputs.monthlyBill * (inputs.propertyType === 'Residential' ? 80 : 74);
  const taxCredit = systemCost * 0.3;
  const netSystemCost = systemCost - taxCredit;
  const annualSavings = monthlySavings * 12;
  const projections: ProjectionYear[] = [{ year: 'Today', doingNothing: 0, solar: -netSystemCost }];
  let cumulativeSavings = 0;

  for (let year = 1; year <= 10; year += 1) {
    cumulativeSavings += annualSavings * (1 + location.inflation) ** (year - 1);
    projections.push({
      year: `Year ${year}`,
      doingNothing: 0,
      solar: Math.round(cumulativeSavings - netSystemCost),
    });
  }

  const netSavings = Math.round(cumulativeSavings - netSystemCost);
  const annualOffsetKwh = (monthlySavings / location.rate) * 12;
  const carbonTons = Math.round((annualOffsetKwh * 10 * 0.0004) * 10) / 10;
  const propertyValueIncrease = Math.round(inputs.monthlyBill * 1000 * 0.04);

  return {
    monthlySavings: Math.round(monthlySavings),
    systemCost: Math.round(systemCost),
    taxCredit: Math.round(taxCredit),
    netSystemCost: Math.round(netSystemCost),
    netSavings,
    roi: Math.round((netSavings / netSystemCost) * 100),
    paybackYears: annualSavings > 0 ? Math.round((netSystemCost / annualSavings) * 10) / 10 : 0,
    carbonTons,
    propertyValueIncrease,
    electricityRate: location.rate,
    inflation: location.inflation,
    projections,
  };
}