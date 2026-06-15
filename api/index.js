require('dotenv').config()
const express = require('express')
const path = require('path')
const { getSubtitles } = require('../src/bili-api')

const app = express()

app.use(express.json())
app.use(express.static(path.join(__dirname, '..', 'public')))

app.get('/api/status', (req, res) => {
  res.json({
    ok: true,
    biliLoggedIn: !!process.env.BILI_SESSDATA
  })
})

app.post('/api/subtitle', async (req, res) => {
  try {
    const { url } = req.body
    if (!url) return res.status(400).json({ error: '请提供B站视频链接' })

    const data = await getSubtitles(url)
    if (!data.text) {
      return res.status(404).json({
        error: data.hint || '该视频没有找到字幕',
        videoTitle: data.title
      })
    }

    res.json({
      videoTitle: data.title,
      subtitleSource: data.source === 'ai_subtitle' ? 'AI字幕' : 'UP主上传字幕',
      text: data.text
    })
  } catch (err) {
    console.error('获取字幕失败:', err)
    res.status(500).json({ error: err.message })
  }
})

module.exports = app
