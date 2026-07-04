import axios from 'axios'
import * as cheerio from 'cheerio'

interface SubtitleItem {
  content: string
  start: number
  end: number
}

async function crawlSubtitles(url: string): Promise<string> {
  const videoId = extractVideoId(url)
  
  if (!videoId) {
    throw new Error('无法解析视频ID')
  }

  const pageUrl = `https://www.bilibili.com/video/${videoId}`
  
  const response = await axios.get(pageUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.bilibili.com/',
    },
  })

  const html = response.data
  const $ = cheerio.load(html)
  
  const scriptTags = $('script')
  let subtitleJsonStr = ''

  for (const script of scriptTags.toArray()) {
    const content = $(script).html() || ''
    if (content.includes('ai_subtitle')) {
      const match = content.match(/ai_subtitle\s*=\s*(\{.*?\})/s)
      if (match) {
        subtitleJsonStr = match[1]
        break
      }
    }
  }

  if (!subtitleJsonStr) {
    const initialStateMatch = html.match(/window\.__INITIAL_STATE__\s*=\s*(.+?);/s)
    if (initialStateMatch) {
      try {
        const initialState = JSON.parse(initialStateMatch[1])
        if (initialState.videoData && initialState.videoData.subtitle) {
          const subtitles = initialState.videoData.subtitle.subtitles
          if (subtitles && subtitles.length > 0) {
            const subUrl = `https:${subtitles[0].subtitle_url}`
            const subResponse = await axios.get(subUrl)
            return parseSubtitleData(subResponse.data)
          }
        }
      } catch {
        throw new Error('未能解析字幕数据')
      }
    }
    throw new Error('未能找到字幕数据，请确保视频已开启AI字幕')
  }

  try {
    const subtitleData = JSON.parse(subtitleJsonStr)
    return parseSubtitleData(subtitleData)
  } catch {
    throw new Error('字幕数据解析失败')
  }
}

function extractVideoId(url: string): string | null {
  const bvMatch = url.match(/BV[a-zA-Z0-9]+/)
  if (bvMatch) return bvMatch[0]

  const avMatch = url.match(/av\d+/)
  if (avMatch) return avMatch[0]

  return null
}

function parseSubtitleData(data: unknown): string {
  if (typeof data !== 'object' || data === null) {
    throw new Error('无效的字幕数据')
  }

  const obj = data as Record<string, unknown>
  
  let subtitles: SubtitleItem[] = []

  if (obj.body) {
    subtitles = (obj.body as SubtitleItem[]) || []
  } else if (obj.subtitles) {
    subtitles = (obj.subtitles as SubtitleItem[]) || []
  }

  if (subtitles.length === 0) {
    throw new Error('字幕列表为空')
  }

  return subtitles
    .map(item => item.content)
    .filter(content => content && content.trim())
    .join('\n')
}

function summarizeText(text: string): string {
  const sentences = text
    .split(/[。！？\n]+/)
    .filter(s => s.trim().length > 5)

  if (sentences.length <= 3) {
    return text
  }

  const segments: string[] = []
  let currentSegment = ''
  
  for (const sentence of sentences) {
    if (currentSegment.length + sentence.length < 150) {
      currentSegment += sentence + '。'
    } else {
      segments.push(currentSegment)
      currentSegment = sentence + '。'
    }
  }
  
  if (currentSegment) {
    segments.push(currentSegment)
  }

  const summaryPoints: string[] = []
  
  for (let i = 0; i < Math.min(segments.length, 8); i++) {
    const segment = segments[i]
    if (segment.trim()) {
      summaryPoints.push(`${i + 1}. ${segment.trim()}`)
    }
  }

  if (segments.length > 8) {
    summaryPoints.push(`${segments.length - 8} 个更多要点...`)
  }

  return summaryPoints.join('\n')
}

export async function onRequestPost(context: { request: Request }) {
  try {
    const { url } = await context.request.json()

    if (!url) {
      return new Response(JSON.stringify({ success: false, error: '请提供视频URL' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const subtitles = await crawlSubtitles(url)
    
    if (!subtitles || subtitles.trim() === '') {
      return new Response(JSON.stringify({ success: false, error: '未能获取到字幕内容，请确保视频已开启AI字幕' }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const summary = summarizeText(subtitles)

    return new Response(JSON.stringify({
      success: true,
      subtitles,
      summary,
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Crawl error:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : '爬取失败，请重试',
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  }
}