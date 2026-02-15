// NAICS codes with 4 or fewer digits are industry groups
// NAICS codes with more than 4 digits are specific industry codes
export function isIndustryGroup(code: string): boolean {
  return code.length <= 4;
}

export function resolveNaicsType(code: string): 'industryGroup' | 'industryCode' {
  return isIndustryGroup(code) ? 'industryGroup' : 'industryCode';
}
