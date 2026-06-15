const { getSubtitles } = require('../src/bili-api')
const fs = require('fs')
const path = require('path')

const MIME = {
  '.html': 'text/html;charset=utf-8',
  '.css': 'text/css;charset=utf-8',
  '.js': 'application/javascript;charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml'
}

function send(res, code, data, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain;charset=utf-8' })
  res.end(data)
}

function sendJson(res, code, data) {
  send(res, code, JSON.stringify(data), 'application/json')
}

function sendFile(res, filePath) {
  const ext = path.extname(filePath)
  const contentType = MIME[ext] || 'application/octet-stream'
  try {
    const content = fs.readFileSync(filePath)
    send(res, 200, content, contentType)
  } catch {
    send(res, 404, 'Not Found')
  }
}

function safeJoin(base, target) {
  const resolved = path.join(base, target)
  if (!resolved.startsWith(base)) {
    throw new Error('Invalid path')
  }
  return resolved
}

async function handleSubtitle(req, res) {
  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', async () => {
    try {
      let json
      try {
        json = JSON.parse(body)
      } catch {
        return sendJson(res, 400, { error: '请求体必须是有效的 JSON' })
      }

      const { url } = json
      if (!url) return sendJson(res, 400, { error: '请提供B站视频链接' })

      const data = await getSubtitles(url)
      if (!data.text) {
        return sendJson(res, 404, { error: data.hint || '该视频没有找到字幕', videoTitle: data.title })
      }

      sendJson(res, 200, {
        videoTitle: data.title,
        subtitleSource: data.source === 'ai_subtitle' ? 'AI字幕' : 'UP主上传字幕',
        text: data.text
      })
    } catch (err) {
      console.error('获取字幕失败:', err)
      sendJson(res, 500, { error: err.message })
    }
  })
}

module.exports = (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const pathname = url.pathname

  if (pathname === '/api/status') {
    return sendJson(res, 200, { ok: true, biliLoggedIn: !!process.env.BILI_SESSDATA })
  }

  if (pathname === '/api/subtitle' && req.method === 'POST') {
    return handleSubtitle(req, res)
  }

  const publicDir = path.join(__dirname, '..', 'public')
  try {
    const filePath = safeJoin(publicDir, pathname === '/' ? 'index.html' : pathname)
    sendFile(res, filePath)
  } catch {
    send(res, 403, 'Forbidden')
  }
}
