const API_BASE = process.env.NODE_ENV === 'production' 
  ? 'https://neru.dpdns.org' 
  : ''

export async function crawlSubtitles(url: string) {
  const response = await fetch(`${API_BASE}/api/crawl`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  })
  return response.json()
}
