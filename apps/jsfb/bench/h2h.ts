// The benchmark's ten operations, timed head to head against the React
// reference in bench/react, in one browser through one driver.
//
// An operation is timed from the click to the last change under the table,
// on a fresh page per run, median of REPS runs. The page keeps no clock of
// its own — a reduce has none — so the driver is what times it.
//
//   just launch                                   # the app, on :8444
//   (cd bench/react && pnpm install && pnpm run dev) # the reference, on :5299
//   deno run --no-lock -A bench/h2h.ts
//
// PRONTO and REACT name the two doors; REPS the runs per operation; ONLY a
// substring of the operations to run; ALL=1 prints every sample.
import { chromium } from "npm:playwright@1.59.1"

const PRONTO = Deno.env.get("PRONTO") ?? "https://localhost:8444/shell/"
const REACT = Deno.env.get("REACT") ?? "http://localhost:5299/"
const REPS = Number(Deno.env.get("REPS") ?? 7)
const ONLY = Deno.env.get("ONLY")
// Warm the thread before the click. Idle, the renderer's main thread lands on
// an efficiency core and the same work takes three times as long; a spin of
// this many milliseconds puts both sides on the same footing.
const SPIN = Number(Deno.env.get("SPIN") ?? 40)
// An operation is over once the table has been still this long. A gap longer
// than this between two of its changes would cut it short.
const QUIET = 400
const READY_MS = 20000

type Op = { name: string; prep: string[]; sel: string; expect: number }
const OPS: Op[] = [
  { name: "create 1,000", prep: [], sel: "#run", expect: 1000 },
  { name: "replace all 1,000", prep: ["#run"], sel: "#run", expect: 1000 },
  { name: "partial update", prep: ["#run"], sel: "#update", expect: 1000 },
  { name: "select row", prep: ["#run"], sel: "table.test-data tr:nth-child(4) a.lbl", expect: 1000 },
  { name: "swap rows", prep: ["#run"], sel: "#swaprows", expect: 1000 },
  { name: "remove row", prep: ["#run"], sel: "table.test-data tr:nth-child(2) a.remove", expect: 999 },
  { name: "create 10,000", prep: [], sel: "#runlots", expect: 10000 },
  { name: "append 1,000 to 1,000", prep: ["#run"], sel: "#add", expect: 2000 },
  { name: "clear 1,000", prep: ["#run"], sel: "#clear", expect: 0 },
  { name: "clear 10,000", prep: ["#runlots"], sel: "#clear", expect: 0 },
]

const browser = await chromium.launch()

const drive = async (url: string, op: Op) => {
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true, viewport: { width: 1280, height: 900 } })
  const page = await ctx.newPage()
  await page.goto(url, { waitUntil: "load" })
  await page.waitForSelector("#add", { timeout: READY_MS })
  const timed = (sel: string, scope: "table" | "body") =>
    page.evaluate(async ([sel, scope, spin, quiet]) => {
      if (spin > 0) {
        const s = performance.now()
        while (performance.now() - s < spin) { /* warm */ }
      }
      const t0 = performance.now()
      let last = t0
      const mo = new MutationObserver(() => { last = performance.now() })
      const root = scope === "table" ? document.querySelector("table.test-data")! : document.body
      mo.observe(root, { childList: true, subtree: true, attributes: true, characterData: true })
      ;(document.querySelector(sel) as HTMLElement).click()
      await new Promise<void>((r) => {
        const t = () => { if (performance.now() - last > quiet) { mo.disconnect(); r() } else requestAnimationFrame(t) }
        requestAnimationFrame(t)
      })
      document.body.offsetHeight
      return { ms: Math.round(last - t0), rows: document.querySelectorAll("table.test-data tr").length }
    }, [sel, scope, SPIN, QUIET] as [string, string, number, number])
  for (const p of op.prep) await timed(p, "body")
  const r = await timed(op.sel, "table")
  await ctx.close()
  return r
}

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]
const run = async (url: string, who: string, op: Op) => {
  const ms: number[] = []
  let rows = -1
  for (let i = 0; i < REPS; i++) {
    const r = await drive(url, op)
    ms.push(r.ms)
    rows = r.rows
  }
  if (Deno.env.get("ALL")) console.log(`    ${who.padEnd(6)} ${ms.join(" ")}`)
  return { ms: median(ms), min: Math.min(...ms), rows }
}

console.log(`${"operation".padEnd(24)}${"pronto".padStart(8)}${"react".padStart(8)}${"ratio".padStart(7)}   (min p/r)`)
let losses = 0
for (const op of OPS) {
  if (ONLY && !op.name.includes(ONLY)) continue
  const p = await run(PRONTO, "pronto", op)
  const r = await run(REACT, "react", op)
  const ratio = r.ms === 0 ? "-" : (p.ms / r.ms).toFixed(2) + "x"
  const bad = p.rows !== op.expect || r.rows !== op.expect ? `  ROWS p=${p.rows} r=${r.rows} want ${op.expect}` : ""
  if (p.ms > r.ms) losses++
  console.log(`${op.name.padEnd(24)}${(p.ms + "ms").padStart(8)}${(r.ms + "ms").padStart(8)}${ratio.padStart(7)}   (${p.min}/${r.min})${bad}`)
}
console.log(`\n${losses} operations slower than react`)
await browser.close()
