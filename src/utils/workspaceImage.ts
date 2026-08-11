export function getWorkspaceImage(ws: any): string | null {
  if (!ws) return null
  if (ws.metaAds?.pictureUrl) return ws.metaAds.pictureUrl
  if (ws.metaAds?.pageId) return `https://graph.facebook.com/${ws.metaAds.pageId}/picture?type=normal`
  if (ws.resources && Array.isArray(ws.resources)) {
    const logo = ws.resources.find((r: any) => r.categoria === 'logo')
    if (logo?.url) return logo.url
  }
  return null
}
