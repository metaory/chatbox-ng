export function modelMatchesSearch(
  model: { modelId: string; modelName?: string },
  search: string,
  providerName = ''
): boolean {
  const query = search.trim().toLowerCase()
  if (!query) return true
  return (
    providerName.toLowerCase().includes(query) ||
    model.modelId.toLowerCase().includes(query) ||
    (model.modelName || model.modelId).toLowerCase().includes(query)
  )
}
