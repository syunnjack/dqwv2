import { useEffect, useMemo, useState } from 'react'
import './App.css'

// 検証の記録。以前の日課チェックリスト・ジェム貯蓄・イベント板は
// 「無課金・オートでどこまでできるか」という主題から外れるため外した。
// 引き継ぐのは編成（＝検証の条件）と、うまくいった設定の記録。
const RUNS_KEY = 'dqwv2.verificationRuns'
const SETUPS_KEY = 'dqwv2.setups'
const NOTES_KEY = 'dqwv2.notes'
const GEAR_LINKS_KEY = 'dqwv2.gearLinks'
const RULES_KEY = 'dqwv2.rules'

// 検証の前提。ここを変えると結果の意味が変わるので、記録と一緒に残す。
const defaultRules = {
  noPurchase: true,
  autoOnly: true,
  note: '課金なし。戦闘はオートのみ（手動操作をしない）。この2つを守った上での到達点を記録する。',
}

const RESULTS = [
  { value: 'cleared', label: '突破できた' },
  { value: 'failed', label: '突破できなかった' },
  { value: 'unstable', label: '運次第で通る' },
]

const resultLabel = (value) =>
  RESULTS.find((item) => item.value === value)?.label ?? '未記入'

const emptyRunForm = {
  target: '',
  attempts: '',
  result: 'cleared',
  setup: '',
  note: '',
  date: '',
}

const emptySetupForm = { name: '', members: '', reason: '', obtained: '' }

const emptyNoteForm = { category: 'オートの挙動', title: '', body: '' }

const noteCategories = ['オートの挙動', '編成の考え方', '装備・こころ', '検証のやり方']

const gearCategories = [
  { id: 'battery', label: 'モバイルバッテリー' },
  { id: 'stand', label: 'スマホスタンド・ホルダー' },
  { id: 'other', label: 'その他' },
]

function readStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function toNumber(value) {
  const n = Number(String(value).trim())
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function App() {
  const [rules, setRules] = useState(() => readStorage(RULES_KEY, defaultRules))
  const [runs, setRuns] = useState(() => readStorage(RUNS_KEY, []))
  const [setups, setSetups] = useState(() => readStorage(SETUPS_KEY, []))
  const [notes, setNotes] = useState(() => readStorage(NOTES_KEY, []))
  const [gearLinks, setGearLinks] = useState(() => readStorage(GEAR_LINKS_KEY, {}))

  const [runForm, setRunForm] = useState(emptyRunForm)
  const [setupForm, setSetupForm] = useState(emptySetupForm)
  const [noteForm, setNoteForm] = useState(emptyNoteForm)

  useEffect(() => localStorage.setItem(RULES_KEY, JSON.stringify(rules)), [rules])
  useEffect(() => localStorage.setItem(RUNS_KEY, JSON.stringify(runs)), [runs])
  useEffect(() => localStorage.setItem(SETUPS_KEY, JSON.stringify(setups)), [setups])
  useEffect(() => localStorage.setItem(NOTES_KEY, JSON.stringify(notes)), [notes])
  useEffect(() => localStorage.setItem(GEAR_LINKS_KEY, JSON.stringify(gearLinks)), [gearLinks])

  // 記録から出せる範囲の集計だけを出す。母数が少ないうちは割合を出さない。
  const summary = useMemo(() => {
    const total = runs.length
    const cleared = runs.filter((r) => r.result === 'cleared').length
    const unstable = runs.filter((r) => r.result === 'unstable').length
    const failed = runs.filter((r) => r.result === 'failed').length
    const attempts = runs.reduce((sum, r) => sum + toNumber(r.attempts), 0)
    return { total, cleared, unstable, failed, attempts }
  }, [runs])

  const addRun = (event) => {
    event.preventDefault()
    const target = runForm.target.trim()
    if (!target) return
    setRuns([
      {
        ...runForm,
        target,
        id: `run-${Date.now()}`,
        date: runForm.date || new Date().toISOString().slice(0, 10),
      },
      ...runs,
    ])
    setRunForm(emptyRunForm)
  }

  const deleteRun = (id) => setRuns(runs.filter((r) => r.id !== id))

  const addSetup = (event) => {
    event.preventDefault()
    const name = setupForm.name.trim()
    if (!name) return
    setSetups([...setups, { ...setupForm, name, id: `setup-${Date.now()}` }])
    setSetupForm(emptySetupForm)
  }

  const deleteSetup = (id) => setSetups(setups.filter((s) => s.id !== id))

  const addNote = (event) => {
    event.preventDefault()
    const title = noteForm.title.trim()
    if (!title) return
    setNotes([...notes, { ...noteForm, title, id: `note-${Date.now()}` }])
    setNoteForm(emptyNoteForm)
  }

  const deleteNote = (id) => setNotes(notes.filter((n) => n.id !== id))

  return (
    <div className="app">
      <header className="hero">
        <p className="eyebrow">DQW 検証記録</p>
        <h1>無課金・オート戦闘だけで、どこまで行けるか。</h1>
        <p className="lead">
          課金をせず、戦闘は自動のまま。この2つを守ったときに、どこを突破できて、
          どこで止まるのかを記録していくサイトです。攻略の正解を示すものではなく、
          条件をそろえて試した結果をそのまま残していきます。
        </p>
        <dl className="summary" aria-label="記録の集計">
          <div>
            <dt>記録した検証</dt>
            <dd>{summary.total}</dd>
          </div>
          <div>
            <dt>突破できた</dt>
            <dd>{summary.cleared}</dd>
          </div>
          <div>
            <dt>運次第</dt>
            <dd>{summary.unstable}</dd>
          </div>
          <div>
            <dt>突破できなかった</dt>
            <dd>{summary.failed}</dd>
          </div>
          <div>
            <dt>のべ試行</dt>
            <dd>{summary.attempts}</dd>
          </div>
        </dl>
        {summary.total === 0 && (
          <p className="note">
            まだ記録がありません。下の「検証を記録する」から、試した相手と結果を入れてください。
          </p>
        )}
      </header>

      <section className="rules-section" id="rules" aria-label="検証の条件">
        <h2>検証の条件</h2>
        <p className="section-lead">
          結果は条件とセットでなければ意味を持ちません。守っている縛りをここに書き、
          記録と一緒に残します。
        </p>
        <div className="rule-toggles">
          <label className="rule-toggle">
            <input
              type="checkbox"
              checked={rules.noPurchase}
              onChange={(e) => setRules({ ...rules, noPurchase: e.target.checked })}
            />
            <span>課金しない</span>
          </label>
          <label className="rule-toggle">
            <input
              type="checkbox"
              checked={rules.autoOnly}
              onChange={(e) => setRules({ ...rules, autoOnly: e.target.checked })}
            />
            <span>戦闘はオートのみ（手動操作をしない）</span>
          </label>
        </div>
        <label className="field">
          <span>条件の補足</span>
          <textarea
            rows={3}
            value={rules.note}
            onChange={(e) => setRules({ ...rules, note: e.target.value })}
            placeholder="例: 無料配布のジェムは使う。イベント限定装備は取れたものだけ使う。"
          />
        </label>
      </section>

      <section className="runs-section" id="runs" aria-label="検証の記録">
        <h2>検証を記録する</h2>
        <p className="section-lead">
          何に挑んで、何回試して、どうなったか。オートのまま放置した結果をそのまま書きます。
        </p>
        <form className="run-form" onSubmit={addRun}>
          <label className="field">
            <span>挑んだ相手・場所</span>
            <input
              value={runForm.target}
              onChange={(e) => setRunForm({ ...runForm, target: e.target.value })}
              placeholder="例: 第◯章 ◯話のボス / ◯◯のほこら"
              required
            />
          </label>
          <label className="field">
            <span>試行回数</span>
            <input
              type="number"
              min="0"
              value={runForm.attempts}
              onChange={(e) => setRunForm({ ...runForm, attempts: e.target.value })}
              placeholder="例: 5"
            />
          </label>
          <label className="field">
            <span>結果</span>
            <select
              value={runForm.result}
              onChange={(e) => setRunForm({ ...runForm, result: e.target.value })}
            >
              {RESULTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>使った編成</span>
            <input
              value={runForm.setup}
              onChange={(e) => setRunForm({ ...runForm, setup: e.target.value })}
              placeholder="下で登録した編成名など"
            />
          </label>
          <label className="field">
            <span>実施日</span>
            <input
              type="date"
              value={runForm.date}
              onChange={(e) => setRunForm({ ...runForm, date: e.target.value })}
            />
          </label>
          <label className="field field-wide">
            <span>気づいたこと</span>
            <textarea
              rows={2}
              value={runForm.note}
              onChange={(e) => setRunForm({ ...runForm, note: e.target.value })}
              placeholder="例: 状態異常を受けると立て直せない。2回に1回は事故で全滅。"
            />
          </label>
          <button type="submit" className="primary">
            記録する
          </button>
        </form>

        {runs.length > 0 && (
          <ul className="run-list">
            {runs.map((run) => (
              <li key={run.id} className={`run-card result-${run.result}`}>
                <div className="run-head">
                  <strong>{run.target}</strong>
                  <span className="badge">{resultLabel(run.result)}</span>
                </div>
                <p className="run-meta">
                  {run.date}
                  {run.attempts ? ` ・ ${run.attempts}回試行` : ''}
                  {run.setup ? ` ・ ${run.setup}` : ''}
                </p>
                {run.note && <p className="run-note">{run.note}</p>}
                <button type="button" onClick={() => deleteRun(run.id)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="setups-section" id="setups" aria-label="使った編成">
        <h2>使った編成</h2>
        <p className="section-lead">
          どの編成で試したのかを残しておくと、結果の違いがどこから来たのか後から追えます。
        </p>
        <form className="setup-form" onSubmit={addSetup}>
          <label className="field">
            <span>編成名</span>
            <input
              value={setupForm.name}
              onChange={(e) => setSetupForm({ ...setupForm, name: e.target.value })}
              placeholder="自分で分かる名前"
              required
            />
          </label>
          <label className="field">
            <span>構成</span>
            <input
              value={setupForm.members}
              onChange={(e) => setSetupForm({ ...setupForm, members: e.target.value })}
              placeholder="例: 前衛2 / 後衛2、回復役1"
            />
          </label>
          <label className="field field-wide">
            <span>この編成にした理由</span>
            <textarea
              rows={2}
              value={setupForm.reason}
              onChange={(e) => setSetupForm({ ...setupForm, reason: e.target.value })}
              placeholder="オートで放置しても崩れにくいと考えた理由"
            />
          </label>
          <label className="field field-wide">
            <span>装備の入手元</span>
            <textarea
              rows={2}
              value={setupForm.obtained}
              onChange={(e) => setSetupForm({ ...setupForm, obtained: e.target.value })}
              placeholder="無課金で手に入るものかどうかが後から分かるように"
            />
          </label>
          <button type="submit" className="primary">
            追加する
          </button>
        </form>

        {setups.length > 0 && (
          <ul className="setup-list">
            {setups.map((setup) => (
              <li key={setup.id} className="setup-card">
                <strong>{setup.name}</strong>
                {setup.members && <p className="setup-members">{setup.members}</p>}
                {setup.reason && <p>{setup.reason}</p>}
                {setup.obtained && <p className="setup-obtained">{setup.obtained}</p>}
                <button type="button" onClick={() => deleteSetup(setup.id)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="notes-section" id="notes" aria-label="検証メモ">
        <h2>検証していて分かったこと</h2>
        <p className="section-lead">
          結果そのものではなく、次の検証に使える気づきを残す場所です。
        </p>
        <form className="note-form" onSubmit={addNote}>
          <label className="field">
            <span>分類</span>
            <select
              value={noteForm.category}
              onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value })}
            >
              {noteCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>見出し</span>
            <input
              value={noteForm.title}
              onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
              placeholder="短くまとめる"
              required
            />
          </label>
          <label className="field field-wide">
            <span>内容</span>
            <textarea
              rows={3}
              value={noteForm.body}
              onChange={(e) => setNoteForm({ ...noteForm, body: e.target.value })}
              placeholder="どういう場面で、何が起きたか"
            />
          </label>
          <button type="submit" className="primary">
            追加する
          </button>
        </form>

        {notes.length > 0 && (
          <ul className="note-list">
            {notes.map((note) => (
              <li key={note.id} className="note-card">
                <span className="note-category">{note.category}</span>
                <strong>{note.title}</strong>
                {note.body && <p>{note.body}</p>}
                <button type="button" onClick={() => deleteNote(note.id)}>
                  削除
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="gear-section" aria-label="歩き続けるための道具">
        <h2>歩き続けるための道具</h2>
        <p className="section-lead">
          オートで放置する時間が長くなるほど、バッテリーと持ち方が効いてきます。
          自分で使っているもののリンクを入れて使ってください。
        </p>
        <div className="gear-grid">
          {gearCategories.map((category) => (
            <label key={category.id} className="field">
              <span>{category.label}</span>
              <input
                value={gearLinks[category.id] ?? ''}
                onChange={(e) => setGearLinks({ ...gearLinks, [category.id]: e.target.value })}
                placeholder="商品ページのURLを入力"
              />
              {gearLinks[category.id] && (
                <a
                  href={gearLinks[category.id]}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                >
                  開く
                </a>
              )}
            </label>
          ))}
        </div>
      </section>

      <section className="about-section" aria-label="このサイトについて">
        <h2>このサイトについて</h2>
        <p>
          無課金のまま、戦闘をオートに任せてどこまで進めるかを記録していくサイトです。
          攻略情報をまとめたものではありません。
        </p>
        <p>
          <strong>掲載しているのは、記録した本人が試した結果だけです。</strong>
          ゲームの仕様や確率、イベントの日程はこちらでは扱いません。
          同じ条件でも結果は変わるため、ここの記録をそのまま当てにせず、
          公式のお知らせをご確認ください。
        </p>
        <p>
          入力した内容はお使いのブラウザにのみ保存されます。サーバーへは送信していません。
        </p>
        <p className="trademark">
          「ドラゴンクエストウォーク」は株式会社スクウェア・エニックスの登録商標です。
          当サイトは個人が作った非公式のもので、スクウェア・エニックス社とは関係ありません。
        </p>
      </section>
    </div>
  )
}

export default App
