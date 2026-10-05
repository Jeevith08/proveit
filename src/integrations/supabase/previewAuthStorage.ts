// Standard localStorage-based auth storage (no Lovable preview brokering needed)
export function brokeredPreviewStorage() {
  if (typeof window === 'undefined') return undefined;
  return localStorage;
}
