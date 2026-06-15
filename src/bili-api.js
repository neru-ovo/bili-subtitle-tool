const crypto = require('crypto')

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function genBuvid3() {
  const hex = () => Math.random().toString(16).substring(2, 10)
  return `${hex()}-${hex()}-${hex()}-${hex()}-${hex()}infoc`
}

function getCookie() {
  const raw = process.env.BILI_SESSDATA || ''
  if (!raw) return ''
  const buvid3 = genBuvid3()
  return `SESSDATA=${raw}; buvid3=${buvid3}; b_nut=${Math.floor(Date.now()/1000)}`
}

function extractBvid(input) {
  const match = input.match(/(BV[a-zA-Z0-9]{10})/)
  if (!match) throw new Error('无法从输入中提取BV号，请检查链接是否正确')
  return match[1]
}

async function fetchJSON(url, cookie = '') {
  const headers = {
    'User-Agent': USER_AGENT,
    'Referer': 'https://www.bilibili.com'
  }
  if (cookie) headers['Cookie'] = cookie
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`B站API请求失败: ${resp.status}`)
  return await resp.json()
}

// WBI 签名算法
function getMixinKey(keys) {
  const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
    27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 37, 12, 52, 56, 6,
    54, 59, 26, 44, 20, 1, 0, 38, 41, 51, 57, 60, 13, 4, 62, 17,
    55, 61, 7, 24, 16, 36, 11, 30, 34, 39, 48, 21, 40, 22, 25, 63
  ]
  return mixinKeyEncTab.map(i => keys[i]).join('').slice(0, 32)
}

function encryptWbi(params, mixinKey) {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key]
    return acc
  }, {})
  const query = new URLSearchParams(sorted).toString()
  const wts = Math.floor(Date.now() / 1000)
  const toSign = query + wts + mixinKey
  const w_rid = crypto.createHash('md5').update(toSign).digest('hex')
  return { w_rid, wts }
}

async function getWbiKeys(cookie) {
  const data = await fetchJSON('https://api.bilibili.com/x/web-interface/nav', cookie)
  if (data.code !== 0) throw new Error('获取WBI密钥失败')
  const { img_key, sub_key } = data.data.wbi_img
  return getMixinKey(img_key + sub_key)
}

async function fetchVideoInfo(bvid, cookie) {
  return await fetchJSON(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, cookie)
}

function parseUploadedSubtitles(videoInfo) {
  const list = videoInfo.data?.subtitle?.list
  if (!list || list.length === 0) return []
  return list.map(s => ({
    id: s.id,
    lan: s.lan,
    lanDoc: s.lan_doc,
    isAi: false,
    url: s.subtitle_url.startsWith('//') ? 'https:' + s.subtitle_url : s.subtitle_url
  }))
}

async function fetchAISubtitles(aid, cid, cookie) {
  if (!cookie) return []

  try {
    const mixinKey = await getWbiKeys(cookie)
    const params = { aid, cid }
    const { w_rid, wts } = encryptWbi(params, mixinKey)
    const query = `aid=${aid}&cid=${cid}&w_rid=${w_rid}&wts=${wts}`

    const data = await fetchJSON(
      `https://api.bilibili.com/x/player/wbi/v2?${query}`,
      cookie
    )

    if (data.code !== 0) return []
    const subtitles = data.data?.subtitle?.subtitles
    if (!subtitles || subtitles.length === 0) return []

    return subtitles.map(s => ({
      id: s.id,
      lan: s.lan,
      lanDoc: s.lan_doc,
      isAi: s.lan.startsWith('ai-'),
      url: s.subtitle_url.startsWith('//') ? 'https:' + s.subtitle_url : s.subtitle_url
    }))
  } catch {
    return []
  }
}

async function downloadSubtitle(url) {
  const resp = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://www.bilibili.com' }
  })
  if (!resp.ok) throw new Error(`字幕下载失败: ${resp.status}`)
  return await resp.json()
}

function subtitleBodyToText(body) {
  return body.map(item => item.content.trim()).filter(Boolean).join(' ')
}

async function getSubtitles(input) {
  const bvid = extractBvid(input)
  const cookie = getCookie()
  const videoInfo = await fetchVideoInfo(bvid, cookie)

  const aid = videoInfo.data?.aid
  const cid = videoInfo.data?.cid
  const title = videoInfo.data?.title || ''

  if (!aid || !cid) {
    throw new Error('无法获取视频的aid和cid')
  }

  const uploaded = parseUploadedSubtitles(videoInfo)
  const ai = cookie ? await fetchAISubtitles(aid, cid, cookie) : []

  const allSubtitles = [...uploaded, ...ai]

  if (allSubtitles.length === 0) {
    const hint = cookie
      ? '该视频没有找到字幕（包括UP主上传字幕和AI字幕）'
      : '未找到字幕。B站需要登录才能获取大部分视频的字幕，请在项目目录下的 .env 文件中添加 BILI_SESSDATA=你的SESSDATA值'
    return { bvid, title, source: null, subtitles: [], text: '', hint }
  }

  const results = []
  for (const sub of allSubtitles) {
    try {
      const data = await downloadSubtitle(sub.url)
      const text = subtitleBodyToText(data.body || [])
      if (text) {
        results.push({
          id: sub.id,
          lan: sub.lan,
          lanDoc: sub.lanDoc,
          isAi: sub.isAi,
          text
        })
      }
    } catch {
      // skip failed subtitles
    }
  }

  if (results.length === 0) {
    return { bvid, title, source: null, subtitles: [], text: '', hint: '找到字幕条目但下载失败' }
  }

  results.sort((a, b) => a.isAi - b.isAi)

  return {
    bvid,
    title,
    source: results[0].isAi ? 'ai_subtitle' : 'uploaded_subtitle',
    subtitles: results,
    text: results.map(r => r.text).join('\n')
  }
}

module.exports = { getSubtitles, extractBvid }
