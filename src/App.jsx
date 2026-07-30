import { useEffect, useMemo, useState } from 'react'
import './App.css'

const TASKS_KEY = 'dqwv2.dailyTasks'
const TASKS_RESET_KEY = 'dqwv2.tasksLastReset'
const EVENTS_KEY = 'dqwv2.events'
const PARTY_GUIDES_KEY = 'dqwv2.partyGuides'
const GEAR_LINKS_KEY = 'dqwv2.gearLinks'
const STREAK_KEY = 'dqwv2.streak'

const defaultStreak = { count: 0, bestCount: 0, lastCompletedDate: '' }

const defaultTasks = [
  { id: 'task-walk', title: '今日の歩数目標を達成する', category: '移動', done: false },
  { id: 'task-shrine', title: 'ほこら討伐の初回クリア報酬を受け取る', category: '討伐', done: false },
  { id: 'task-login', title: 'ログインボーナス・ジェムを受け取る', category: '受取', done: false },
  { id: 'task-ad', title: '広告視聴でジェムを追加獲得する', category: '受取', done: false },
  { id: 'task-equip', title: '装備強化・付け替えを確認する', category: '強化', done: false },
]

const emptyTaskForm = { title: '', category: '移動' }

const emptyEventForm = { name: '', startDate: '', endDate: '', memo: '' }

const defaultPartyGuides = [
  {
    id: 'guide-starter-1',
    name: '編成名を入力してください',
    roles: '例: 前衛2/後衛2、回復役を1体含める',
    reason: 'なぜ無課金・オートバトル向きかの理由をここに書きます',
    equipment: '主要装備の入手先(討伐/ふくびき/イベント無料配布など)をメモ',
  },
]

const emptyGuideForm = { name: '', roles: '', reason: '', equipment: '' }

const gearCategories = [
  { id: 'battery', label: 'モバイルバッテリー', hint: '長時間の外歩き対策' },
  { id: 'fan', label: 'スマホ冷却ファン', hint: '夏場の熱暴走・電池消費対策' },
  { id: 'armband', label: 'スマホアームバンド/ホルダー', hint: '手ぶらで安全に歩くため' },
  { id: 'shoes', label: '歩きやすいウォーキングシューズ', hint: '毎日歩く距離を無理なく伸ばす' },
]

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function formatLocalDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function daysBetween(fromDate, toDate) {
  const oneDay = 24 * 60 * 60 * 1000
  const from = new Date(`${fromDate}T00:00:00`)
  const to = new Date(`${toDate}T00:00:00`)
  return Math.round((to - from) / oneDay)
}

function eventStatus(event, today) {
  if (!event.startDate && !event.endDate) return 'no-date'
  if (event.startDate && daysBetween(event.startDate, today) < 0) return 'upcoming'
  if (event.endDate && daysBetween(event.endDate, today) > 0) return 'ended'
  return 'active'
}

function eventStatusLabel(status) {
  return {
    'no-date': ['日付未設定', 'no-date'],
    upcoming: ['開始前', 'upcoming'],
    active: ['開催中', 'active'],
    ended: ['終了', 'ended'],
  }[status]
}

function App() {
  const today = formatLocalDateKey(new Date())

  const [tasks, setTasks] = useState(() => readStorage(TASKS_KEY, defaultTasks))
  const [taskForm, setTaskForm] = useState(emptyTaskForm)
  const [events, setEvents] = useState(() => readStorage(EVENTS_KEY, []))
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [partyGuides, setPartyGuides] = useState(() => readStorage(PARTY_GUIDES_KEY, defaultPartyGuides))
  const [guideForm, setGuideForm] = useState(emptyGuideForm)
  const [gearLinks, setGearLinks] = useState(() => readStorage(GEAR_LINKS_KEY, {}))
  const [streak, setStreak] = useState(() => readStorage(STREAK_KEY, defaultStreak))

  useEffect(() => {
    const lastReset = readStorage(TASKS_RESET_KEY, '')
    if (lastReset !== today) {
      setTasks((current) => current.map((task) => ({ ...task, done: false })))
      localStorage.setItem(TASKS_RESET_KEY, JSON.stringify(today))

      setStreak((current) => {
        if (current.lastCompletedDate && daysBetween(current.lastCompletedDate, today) > 1) {
          return { ...current, count: 0 }
        }
        return current
      })
    }
  }, [today])

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events))
  }, [events])

  useEffect(() => {
    localStorage.setItem(PARTY_GUIDES_KEY, JSON.stringify(partyGuides))
  }, [partyGuides])

  useEffect(() => {
    localStorage.setItem(GEAR_LINKS_KEY, JSON.stringify(gearLinks))
  }, [gearLinks])

  useEffect(() => {
    localStorage.setItem(STREAK_KEY, JSON.stringify(streak))
  }, [streak])

  useEffect(() => {
    if (tasks.length === 0 || !tasks.every((task) => task.done)) return
    setStreak((current) => {
      if (current.lastCompletedDate === today) return current
      const gap = current.lastCompletedDate ? daysBetween(current.lastCompletedDate, today) : null
      const nextCount = gap === 1 ? current.count + 1 : 1
      return {
        count: nextCount,
        bestCount: Math.max(current.bestCount, nextCount),
        lastCompletedDate: today,
      }
    })
  }, [tasks, today])

  const doneCount = tasks.filter((task) => task.done).length

  const toggleTask = (taskId) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)))
  }

  const addTask = (event) => {
    event.preventDefault()
    if (!taskForm.title.trim()) return
    setTasks((current) => [
      ...current,
      { id: crypto.randomUUID(), title: taskForm.title.trim(), category: taskForm.category, done: false },
    ])
    setTaskForm(emptyTaskForm)
  }

  const deleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  const addEvent = (event) => {
    event.preventDefault()
    if (!eventForm.name.trim()) return
    setEvents((current) => [
      {
        id: crypto.randomUUID(),
        name: eventForm.name.trim(),
        startDate: eventForm.startDate,
        endDate: eventForm.endDate,
        memo: eventForm.memo.trim(),
      },
      ...current,
    ])
    setEventForm(emptyEventForm)
  }

  const deleteEvent = (eventId) => {
    setEvents((current) => current.filter((event) => event.id !== eventId))
  }

  const sortedEvents = useMemo(
    () => [...events]
      .map((event) => ({ ...event, status: eventStatus(event, today) }))
      .sort((a, b) => (a.startDate || a.endDate || '').localeCompare(b.startDate || b.endDate || '')),
    [events, today],
  )

  const addGuide = (event) => {
    event.preventDefault()
    if (!guideForm.name.trim()) return
    setPartyGuides((current) => [
      { id: crypto.randomUUID(), ...guideForm, name: guideForm.name.trim() },
      ...current,
    ])
    setGuideForm(emptyGuideForm)
  }

  const deleteGuide = (guideId) => {
    setPartyGuides((current) => current.filter((guide) => guide.id !== guideId))
  }

  const streakSuffix = streak.count > 0 ? `(${streak.count}日連続達成中🔥)` : ''
  const shareText = `今日の無課金ウォーカー日課: ${doneCount}/${tasks.length}件クリア${streakSuffix}！ #ドラクエウォーク #無課金勢`
  const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">DQ Walk / F2P support</p>
          <h1>無課金ウォーカーの手引き</h1>
          <p className="lead">
            課金なしでドラクエウォークを気長に楽しむ人のための、日課チェック・イベントメモ・
            オートバトル安定重視の編成ガイドをまとめました。
          </p>
          <div className="hero-actions">
            <a href="#daily-tasks">日課チェックリストへ</a>
            <a href="#events">イベント情報へ</a>
            <a href="#party-guide">編成ガイドへ</a>
          </div>
        </div>
        <div className="hero-share">
          <p className="eyebrow">Share</p>
          <h2>{doneCount}/{tasks.length}</h2>
          <p>今日の日課クリア数</p>
          <div className="streak-row">
            <strong>🔥 {streak.count}日連続</strong>
            <span>ベスト {streak.bestCount}日</span>
          </div>
          <a href={shareUrl} target="_blank" rel="noreferrer">Xでシェア</a>
        </div>
      </section>

      <section className="daily-tasks-section" id="daily-tasks" aria-label="日課チェックリスト">
        <div className="section-title">
          <div>
            <p className="eyebrow">Daily checklist</p>
            <h2>今日の日課チェックリスト</h2>
            <p>日付が変わって開くと、チェックは自動でリセットされます。項目は自由に追加・削除できます。</p>
          </div>
          <div className="task-progress">
            <strong>{doneCount}/{tasks.length}</strong>
            <span>完了</span>
          </div>
        </div>
        <div className="task-list">
          {tasks.map((task) => (
            <article className={`task-card ${task.done ? 'done' : ''}`} key={task.id}>
              <label>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                <span>{task.title}</span>
              </label>
              <div className="task-card-foot">
                <span className="task-category">{task.category}</span>
                <button type="button" onClick={() => deleteTask(task.id)}>削除</button>
              </div>
            </article>
          ))}
          {tasks.length === 0 && <p className="empty-text">日課がありません。下のフォームから追加してください。</p>}
        </div>
        <form className="task-form" onSubmit={addTask}>
          <label>
            項目名
            <input
              value={taskForm.title}
              onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })}
              placeholder="例: メタル系の日は討伐を優先する"
            />
          </label>
          <label>
            カテゴリ
            <select value={taskForm.category} onChange={(event) => setTaskForm({ ...taskForm, category: event.target.value })}>
              <option>移動</option>
              <option>討伐</option>
              <option>受取</option>
              <option>強化</option>
              <option>その他</option>
            </select>
          </label>
          <button type="submit">日課を追加</button>
        </form>
      </section>

      <section className="events-section" id="events" aria-label="イベント情報">
        <div className="section-title">
          <div>
            <p className="eyebrow">Event board</p>
            <h2>イベント情報ボード</h2>
            <p>
              公式サイト・アプリ内お知らせで確認した開催期間をここにメモしておくと、
              開催中/開始前/終了が一覧で分かります。内容は手動入力です(自動取得はしていません)。
            </p>
          </div>
        </div>
        <form className="event-form" onSubmit={addEvent}>
          <label className="wide-field">
            イベント名
            <input
              value={eventForm.name}
              onChange={(event) => setEventForm({ ...eventForm, name: event.target.value })}
              placeholder="例: 特定モンスターの討伐イベント"
            />
          </label>
          <label>
            開始日
            <input type="date" value={eventForm.startDate} onChange={(event) => setEventForm({ ...eventForm, startDate: event.target.value })} />
          </label>
          <label>
            終了日
            <input type="date" value={eventForm.endDate} onChange={(event) => setEventForm({ ...eventForm, endDate: event.target.value })} />
          </label>
          <label className="wide-field">
            メモ
            <input
              value={eventForm.memo}
              onChange={(event) => setEventForm({ ...eventForm, memo: event.target.value })}
              placeholder="やること、対象、注意点など"
            />
          </label>
          <button type="submit">イベントを追加</button>
        </form>
        <div className="event-list">
          {sortedEvents.map((event) => {
            const [statusLabel, statusTone] = eventStatusLabel(event.status)
            return (
              <article className={`event-card ${statusTone}`} key={event.id}>
                <span className="event-status">{statusLabel}</span>
                <strong>{event.name}</strong>
                <p>{event.memo || 'メモ未入力'}</p>
                <small>{event.startDate || '開始日未設定'} 〜 {event.endDate || '終了日未設定'}</small>
                <button type="button" onClick={() => deleteEvent(event.id)}>削除</button>
              </article>
            )
          })}
          {sortedEvents.length === 0 && <p className="empty-text">イベントを登録すると、ここに一覧表示されます。</p>}
        </div>
      </section>

      <section className="party-guide-section" id="party-guide" aria-label="パーティ編成・装備ガイド">
        <div className="section-title">
          <div>
            <p className="eyebrow">Party &amp; gear guide</p>
            <h2>無課金・オートバトル安定編成ガイド</h2>
            <p>
              自分が実際に使って安定した編成・装備の組み合わせをメモしておくためのガイドです。
              サンプルの1件はプレースホルダーなので、実際の内容に書き換えてください。
            </p>
          </div>
        </div>
        <form className="guide-form" onSubmit={addGuide}>
          <label className="wide-field">
            編成名
            <input
              value={guideForm.name}
              onChange={(event) => setGuideForm({ ...guideForm, name: event.target.value })}
              placeholder="例: 物理アタッカー2+回復1+バフ1"
            />
          </label>
          <label className="wide-field">
            役割構成
            <input
              value={guideForm.roles}
              onChange={(event) => setGuideForm({ ...guideForm, roles: event.target.value })}
              placeholder="前衛/後衛、回復役の有無など"
            />
          </label>
          <label className="wide-field">
            無課金向きの理由
            <textarea
              value={guideForm.reason}
              onChange={(event) => setGuideForm({ ...guideForm, reason: event.target.value })}
              placeholder="無料配布・討伐報酬だけで揃う理由、オートバトルでの安定性など"
            />
          </label>
          <label className="wide-field">
            装備・入手先メモ
            <textarea
              value={guideForm.equipment}
              onChange={(event) => setGuideForm({ ...guideForm, equipment: event.target.value })}
              placeholder="主要装備と、無料で入手できる場所(討伐、ふくびき、イベント配布など)"
            />
          </label>
          <button type="submit">編成を追加</button>
        </form>
        <div className="guide-list">
          {partyGuides.map((guide) => (
            <article className="guide-card" key={guide.id}>
              <h3>{guide.name}</h3>
              <p><strong>役割構成: </strong>{guide.roles || '未入力'}</p>
              <p><strong>無課金向きの理由: </strong>{guide.reason || '未入力'}</p>
              <p><strong>装備・入手先: </strong>{guide.equipment || '未入力'}</p>
              <button type="button" onClick={() => deleteGuide(guide.id)}>削除</button>
            </article>
          ))}
          {partyGuides.length === 0 && <p className="empty-text">編成ガイドを追加すると、ここに一覧表示されます。</p>}
        </div>
      </section>

      <section className="gear-section" aria-label="おすすめグッズ">
        <div className="section-title">
          <div>
            <p className="eyebrow">Walking gear</p>
            <h2>歩き続けるためのおすすめグッズ</h2>
            <p>
              長時間の外歩きで役立つジャンルをまとめました。リンクは商品ページのアフィリエイトURLに
              差し替えて使ってください(未設定の間はリンクが無効表示になります)。
            </p>
          </div>
        </div>
        <div className="gear-list">
          {gearCategories.map((gear) => (
            <article className="gear-card" key={gear.id}>
              <strong>{gear.label}</strong>
              <p>{gear.hint}</p>
              <input
                type="url"
                value={gearLinks[gear.id] || ''}
                onChange={(event) => setGearLinks({ ...gearLinks, [gear.id]: event.target.value })}
                placeholder="商品ページのアフィリエイトURLを入力"
              />
              <a
                className={!gearLinks[gear.id] ? 'disabled-link' : ''}
                href={gearLinks[gear.id] || undefined}
                target="_blank"
                rel="noreferrer sponsored"
              >
                商品を見る
              </a>
            </article>
          ))}
        </div>
      </section>

      <section className="ad-section" aria-label="広告枠">
        <div className="ad-slot">
          広告枠(Google AdSenseの設置後にここへ広告が表示されます。設置手順はREADME.mdを参照)
        </div>
      </section>
    </main>
  )
}

export default App
