const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function genBuvid3() {
  const hex = () => Math.random().toString(16).substring(2, 10)
  return `${hex()}-${hex()}-${hex()}-${hex()}-${hex()}infoc`
}

function getCookie(biliSessdata) {
  const raw = biliSessdata || ''
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
    'Referer': 'https://www.bilibili.com',
    'Origin': 'https://www.bilibili.com',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  }
  if (cookie) headers['Cookie'] = cookie
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`B站API请求失败: ${resp.status}`)
  return await resp.json()
}

function getMixinKey(keys) {
  const mixinKeyEncTab = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35,
    27, 43, 5, 49, 33, 9, 42, 19, 29, 28, 14, 37, 12, 52, 56, 6,
    54, 59, 26, 44, 20, 1, 0, 38, 41, 51, 57, 60, 13, 4, 62, 17,
    55, 61, 7, 24, 16, 36, 11, 30, 34, 39, 48, 21, 40, 22, 25, 63
  ]
  return mixinKeyEncTab.map(i => keys[i]).join('').slice(0, 32)
}

async function getWbiKeys(cookie) {
  const data = await fetchJSON('https://api.bilibili.com/x/web-interface/nav', cookie)
  if (data.code !== 0) throw new Error('获取WBI密钥失败')
  const { img_key, sub_key } = data.data.wbi_img
  return getMixinKey(img_key + sub_key)
}

function md5(str) {
  const md5Table = [
    0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA, 0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
    0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988, 0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
    0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE, 0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
    0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC, 0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
    0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172, 0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
    0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940, 0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
    0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116, 0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
    0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924, 0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
    0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A, 0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
    0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818, 0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
    0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E, 0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
    0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C, 0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
    0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2, 0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
    0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0, 0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
    0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086, 0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
    0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4, 0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
    0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A, 0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
    0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8, 0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
    0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE, 0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
    0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC, 0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
    0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252, 0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
    0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60, 0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
    0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236, 0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
    0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04, 0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
    0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A, 0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
    0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38, 0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
    0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E, 0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
    0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C, 0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
    0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2, 0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
    0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0, 0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
    0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6, 0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
    0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94, 0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
  ]

  const rotateLeft = (lValue, iShiftBits) => {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits))
  }

  const addUnsigned = (lX, lY) => {
    const lX4 = (lX & 0xFFFFFFFF) >>> 16
    const lX8 = lX & 0xFFFF
    const lY4 = (lY & 0xFFFFFFFF) >>> 16
    const lY8 = lY & 0xFFFF
    let lResult = (lX8 + lY8) & 0xFFFF
    let lCarry = (lResult >>> 16) & 1
    lResult = (lResult & 0xFFFF) + ((lX4 + lY4 + lCarry) << 16)
    return lResult & 0xFFFFFFFF
  }

  const F = (x, y, z) => { return (x & y) | (~x & z) }
  const G = (x, y, z) => { return (x & z) | (y & ~z) }
  const H = (x, y, z) => { return x ^ y ^ z }
  const I = (x, y, z) => { return y ^ (x | ~z) }

  const FF = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  const GG = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  const HH = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }
  const II = (a, b, c, d, x, s, ac) => {
    a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac))
    return addUnsigned(rotateLeft(a, s), b)
  }

  const convertToWordArray = (str) => {
    const lWordCount = ((str.length + 8) >> 6) + 1
    const lWordArray = new Array(lWordCount)
    let lByteCount = 0
    while (lByteCount < str.length) {
      const lWordCount2 = (lByteCount >> 2)
      const lBytePosition2 = (lByteCount % 4) * 8
      lWordArray[lWordCount2] = (lWordArray[lWordCount2] || 0) | ((str.charCodeAt(lByteCount) & 0xFF) << lBytePosition2)
      lByteCount++
    }
    const lWordCount3 = (lByteCount >> 2)
    const lBytePosition3 = (lByteCount % 4) * 8
    lWordArray[lWordCount3] = (lWordArray[lWordCount3] || 0) | (0x80 << lBytePosition3)
    lWordArray[lWordCount - 1] = (str.length << 3) | ((str.length >> 29) & 0xFF)
    return lWordArray
  }

  const wordToHex = (lValue) => {
    const wordToHexValue = '0123456789abcdef'
    let lByte
    let str = ''
    for (let i = 0; i <= 3; i++) {
      lByte = (lValue >>> (i * 8)) & 0xFF
      str += wordToHexValue.charAt((lByte >>> 4) & 0x0F) + wordToHexValue.charAt(lByte & 0x0F)
    }
    return str
  }

  const x = convertToWordArray(str)
  let a = 0x67452301
  let b = 0xEFCDAB89
  let c = 0x98BADCFE
  let d = 0x10325476
  const N = x.length

  for (let i = 0; i < N; i += 16) {
    const AA = a
    const BB = b
    const CC = c
    const DD = d

    a = FF(a, b, c, d, x[i + 0], 7, 0xD76AA478)
    d = FF(d, a, b, c, x[i + 1], 12, 0xE8C7B756)
    c = FF(c, d, a, b, x[i + 2], 17, 0x242070DB)
    b = FF(b, c, d, a, x[i + 3], 22, 0xC1BDCEEE)
    a = FF(a, b, c, d, x[i + 4], 7, 0xF57C0FAF)
    d = FF(d, a, b, c, x[i + 5], 12, 0x4787C62A)
    c = FF(c, d, a, b, x[i + 6], 17, 0xA8304613)
    b = FF(b, c, d, a, x[i + 7], 22, 0xFD469501)
    a = FF(a, b, c, d, x[i + 8], 7, 0x698098D8)
    d = FF(d, a, b, c, x[i + 9], 12, 0x8B44F7AF)
    c = FF(c, d, a, b, x[i + 10], 17, 0xFFFF5BB1)
    b = FF(b, c, d, a, x[i + 11], 22, 0x895CD7BE)
    a = FF(a, b, c, d, x[i + 12], 7, 0x6B901122)
    d = FF(d, a, b, c, x[i + 13], 12, 0xFD987193)
    c = FF(c, d, a, b, x[i + 14], 17, 0xA679438E)
    b = FF(b, c, d, a, x[i + 15], 22, 0x49B40821)

    a = GG(a, b, c, d, x[i + 1], 5, 0xF61E2562)
    d = GG(d, a, b, c, x[i + 6], 9, 0xC040B340)
    c = GG(c, d, a, b, x[i + 11], 14, 0x265E5A51)
    b = GG(b, c, d, a, x[i + 0], 20, 0xE9B6C7AA)
    a = GG(a, b, c, d, x[i + 5], 5, 0xD62F105D)
    d = GG(d, a, b, c, x[i + 10], 9, 0x02441453)
    c = GG(c, d, a, b, x[i + 15], 14, 0xD8A1E681)
    b = GG(b, c, d, a, x[i + 4], 20, 0xE7D3FBC8)
    a = GG(a, b, c, d, x[i + 9], 5, 0x21E1CDE6)
    d = GG(d, a, b, c, x[i + 14], 9, 0xC33707D6)
    c = GG(c, d, a, b, x[i + 3], 14, 0xF4D50D87)
    b = GG(b, c, d, a, x[i + 8], 20, 0x455A14ED)
    a = GG(a, b, c, d, x[i + 13], 5, 0xA9E3E905)
    d = GG(d, a, b, c, x[i + 2], 9, 0xFCEFA3F8)
    c = GG(c, d, a, b, x[i + 7], 14, 0x676F02D9)
    b = GG(b, c, d, a, x[i + 12], 20, 0x8D2A4C8A)

    a = HH(a, b, c, d, x[i + 5], 4, 0xFFFA3942)
    d = HH(d, a, b, c, x[i + 8], 11, 0x8771F681)
    c = HH(c, d, a, b, x[i + 11], 16, 0x6D9D6122)
    b = HH(b, c, d, a, x[i + 14], 23, 0xFDE5380C)
    a = HH(a, b, c, d, x[i + 1], 4, 0xA4BEEA44)
    d = HH(d, a, b, c, x[i + 4], 11, 0x4BDECFA9)
    c = HH(c, d, a, b, x[i + 7], 16, 0xF6BB4B60)
    b = HH(b, c, d, a, x[i + 10], 23, 0xBEBFBC70)
    a = HH(a, b, c, d, x[i + 13], 4, 0x289B7EC6)
    d = HH(d, a, b, c, x[i + 0], 11, 0xEAA127FA)
    c = HH(c, d, a, b, x[i + 3], 16, 0xD4EF3085)
    b = HH(b, c, d, a, x[i + 6], 23, 0x04881D05)
    a = HH(a, b, c, d, x[i + 9], 4, 0xD9D4D039)
    d = HH(d, a, b, c, x[i + 12], 11, 0xE6DB99E5)
    c = HH(c, d, a, b, x[i + 15], 16, 0x1FA27CF8)
    b = HH(b, c, d, a, x[i + 2], 23, 0xC4AC5665)

    a = II(a, b, c, d, x[i + 0], 6, 0xF4292244)
    d = II(d, a, b, c, x[i + 7], 10, 0x432AFF97)
    c = II(c, d, a, b, x[i + 14], 15, 0xAB9423A7)
    b = II(b, c, d, a, x[i + 5], 21, 0xFC93A039)
    a = II(a, b, c, d, x[i + 12], 6, 0x655B59C3)
    d = II(d, a, b, c, x[i + 3], 10, 0x8F0CCC92)
    c = II(c, d, a, b, x[i + 10], 15, 0xFFEFF47D)
    b = II(b, c, d, a, x[i + 1], 21, 0x85845DD1)
    a = II(a, b, c, d, x[i + 8], 6, 0x6FA87E4F)
    d = II(d, a, b, c, x[i + 15], 10, 0xFE2CE6E0)
    c = II(c, d, a, b, x[i + 6], 15, 0xA3014314)
    b = II(b, c, d, a, x[i + 13], 21, 0x4E0811A1)
    a = II(a, b, c, d, x[i + 4], 6, 0xF7537E82)
    d = II(d, a, b, c, x[i + 11], 10, 0xBD3AF235)
    c = II(c, d, a, b, x[i + 2], 15, 0x2AD7D2BB)
    b = II(b, c, d, a, x[i + 9], 21, 0xEB86D391)

    a = addUnsigned(a, AA)
    b = addUnsigned(b, BB)
    c = addUnsigned(c, CC)
    d = addUnsigned(d, DD)
  }

  return wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)
}

async function encryptWbi(params, mixinKey) {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    acc[key] = params[key]
    return acc
  }, {})
  const query = new URLSearchParams(sorted).toString()
  const wts = Math.floor(Date.now() / 1000)
  const toSign = query + wts + mixinKey
  const w_rid = md5(toSign)
  return { w_rid, wts }
}

async function fetchVideoInfo(bvid, cookie) {
  return await fetchJSON(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, cookie)
}

function parseUploadedSubtitles(videoInfo) {
  const list = videoInfo.data?.subtitle?.list || []
  if (!list || list.length === 0) return []
  return list.map(s => ({
    id: s.id,
    lan: s.lan,
    lanDoc: s.lan_doc,
    isAi: false,
    url: s.subtitle_url?.startsWith('//') ? 'https:' + s.subtitle_url : s.subtitle_url
  }))
}

async function fetchAISubtitles(aid, cid, cookie) {
  if (!cookie) return []

  try {
    const mixinKey = await getWbiKeys(cookie)
    const params = { aid, cid }
    const { w_rid, wts } = await encryptWbi(params, mixinKey)
    const query = `aid=${aid}&cid=${cid}&w_rid=${w_rid}&wts=${wts}`

    const data = await fetchJSON(
      `https://api.bilibili.com/x/player/wbi/v2?${query}`,
      cookie
    )

    if (data.code !== 0) return []
    const subtitles = data.data?.subtitle?.subtitles || []
    if (!subtitles || subtitles.length === 0) return []

    return subtitles.map(s => ({
      id: s.id,
      lan: s.lan,
      lanDoc: s.lan_doc,
      isAi: s.lan?.startsWith('ai-') || false,
      url: s.subtitle_url?.startsWith('//') ? 'https:' + s.subtitle_url : s.subtitle_url
    }))
  } catch {
    return []
  }
}

async function downloadSubtitle(url) {
  const resp = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Referer': 'https://www.bilibili.com',
      'Origin': 'https://www.bilibili.com',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    }
  })
  if (!resp.ok) throw new Error(`字幕下载失败: ${resp.status}`)
  return await resp.json()
}

function subtitleBodyToText(body) {
  return body.map(item => item.content?.trim()).filter(Boolean).join(' ')
}

async function getSubtitles(input, biliSessdata) {
  const bvid = extractBvid(input)
  const cookie = getCookie(biliSessdata)
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
      : '未找到字幕。B站需要登录才能获取大部分视频的字幕，请配置 BILI_SESSDATA 环境变量'
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

  results.sort((a, b) => (a.isAi ? 1 : 0) - (b.isAi ? 1 : 0))

  return {
    bvid,
    title,
    source: results[0].isAi ? 'ai_subtitle' : 'uploaded_subtitle',
    subtitles: results,
    text: results.map(r => r.text).join('\n')
  }
}

async function handleStatus(env) {
  return new Response(JSON.stringify({
    ok: true,
    biliLoggedIn: !!env?.BILI_SESSDATA
  }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

async function handleSubtitle(request, env) {
  try {
    const { url } = await request.json()
    const biliSessdata = env?.BILI_SESSDATA

    if (!url) {
      return new Response(JSON.stringify({ error: '请提供B站视频链接' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const data = await getSubtitles(url, biliSessdata)

    if (!data.text) {
      return new Response(JSON.stringify({
        error: data.hint || '该视频没有找到字幕',
        videoTitle: data.title
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({
      videoTitle: data.title,
      subtitleSource: data.source === 'ai_subtitle' ? 'AI字幕' : 'UP主上传字幕',
      text: data.text
    }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('获取字幕失败:', error)
    return new Response(JSON.stringify({ error: error.message || '获取字幕失败，请重试' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const path = url.pathname

    // API routes
    if (path === '/api/status' && request.method === 'GET') {
      return handleStatus(env)
    }

    if (path === '/api/subtitle' && request.method === 'POST') {
      return handleSubtitle(request, env)
    }

    // Static assets (served from public/)
    return env.ASSETS.fetch(request)
  }
}
