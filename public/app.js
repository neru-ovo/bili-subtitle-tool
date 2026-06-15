let currentText = ''
let currentTitle = ''

function $(id) { return document.getElementById(id) }

function show(el) { el.classList.remove('hidden') }
function hide(el) { el.classList.add('hidden') }

async function checkStatus() {
  try {
    const resp = await fetch('/api/status')
    const data = await resp.json()
    const bar = $('statusBar')
    bar.innerHTML = data.biliLoggedIn
      ? '<span class="status-badge ok">B站已登录</span>'
      : '<span class="status-badge fail">B站未登录（需配置SESSDATA）</span>'
  } catch {}
}
checkStatus()

async function process() {
  const url = $('urlInput').value.trim()
  if (!url) { alert('请先输入B站视频链接'); return }

  const btn = $('processBtn')
  btn.disabled = true
  btn.textContent = '处理中...'

  hide($('result'))
  hide($('error'))
  show($('loading'))
  $('statusText').textContent = '正在获取字幕...'

  try {
    const resp = await fetch('/api/subtitle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })

    const data = await resp.json()
    if (!resp.ok) throw new Error(data.error)

    currentText = data.text
    currentTitle = data.videoTitle

    $('videoTitle').textContent = data.videoTitle
    $('subtitleSource').textContent = data.subtitleSource || '字幕'
    $('charCount').textContent = `${data.text.length} 字`
    $('subtitleContent').textContent = data.text

    hide($('loading'))
    show($('result'))
  } catch (err) {
    hide($('loading'))
    show($('error'))
    $('errorText').textContent = err.message
  } finally {
    btn.disabled = false
    btn.textContent = '获取字幕'
  }
}

function copyText() {
  navigator.clipboard.writeText(currentText).then(() => {
    const btn = event.target
    const orig = btn.textContent
    btn.textContent = '已复制'
    setTimeout(() => btn.textContent = orig, 1500)
  }).catch(() => alert('复制失败'))
}

function downloadTxt() {
  if (!currentText) return
  const title = currentTitle.replace(/[\\/:*?"<>|]/g, '_')
  const blob = new Blob([currentText], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `${title}_字幕.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}

$('urlInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') process()
})
