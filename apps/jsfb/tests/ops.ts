// The nine operations, driven against the reduce itself. No browser and no
// cluster: a fold is a function, and every claim the acceptance list makes
// about counts, ids, labels and order is checkable here in milliseconds.
const src = await Deno.readTextFile(new URL("../shell/handlers/bench.js", import.meta.url));
// deno-lint-ignore no-explicit-any
const bench: any = new Function(`return (${src.replace(/^\/\/.*$/gm, "")});`)();

type Row = { id: string; label: string; ord: number; cls: string };
const BENCH = { id: "bench", next_id: 1, picked: "" };

// deno-lint-ignore no-explicit-any
const run = (rows: Row[], b: Record<string, unknown>, event: any) =>
  bench({ rows: { row: rows, bench: [b] }, items: rows }, event);

/** A click on the control whose DOM id names it. */
const click = (from: string) => ({ type: "click", from });

// deno-lint-ignore no-explicit-any
const applied = (rows: Row[], updates: any[]): Row[] => {
  const by = new Map(rows.map((r) => [r.id, { ...r }]));
  for (const u of updates) {
    if (u.entity !== "row") continue;
    const id = String(u.id);
    if (u.op === "delete") by.delete(id);
    else if (u.op === "put") by.set(id, { id, ...u.row });
    else Object.assign(by.get(id)!, u.row);
  }
  return [...by.values()].sort((a, b2) => Number(a.ord) - Number(b2.ord));
};

let bad = 0;
const check = (name: string, ok: boolean, got?: unknown) => {
  if (!ok) bad += 1;
  console.log(`${ok ? "ok  " : "FAIL"} ${name}${ok ? "" : `  got ${JSON.stringify(got)}`}`);
};

// --- append ---------------------------------------------------------------
const add = run([], BENCH, click("add"));
const thousand = applied([], add.updates);
check("append gives exactly 1000 rows", thousand.length === 1000, thousand.length);
check("ids climb from the bench counter", thousand[0].id === "1" && thousand[999].id === "1000");
check("ord is dense, and starts at the counter the ids start at",
  thousand.every((r, i) => Number(r.ord) === Number(thousand[0].id) + i));
// The watermark Create's delete filters on only works if this holds: a row made
// later must sort above every row that already existed.
const more = applied(thousand, run(thousand, { ...BENCH, next_id: 1001 }, click("add")).updates);
check("appended rows sort above every row that existed",
  more.length === 2000 && more.slice(1000).every((r) => Number(r.ord) > 1000));
check("and the watermark separates them exactly",
  more.filter((r) => Number(r.ord) < 1001).length === 1000);
check("every label is three words", thousand.every((r) => r.label.split(" ").length === 3));
check(
  "consecutive labels differ in all three words",
  thousand.slice(0, 50).every((r, i) => {
    if (i === 0) return true;
    const a = thousand[i - 1].label.split(" "), b2 = r.label.split(" ");
    return a[0] !== b2[0] && a[1] !== b2[1] && a[2] !== b2[2];
  }),
);
check("the counter advances past what it handed out",
  add.updates.some((u: {row?: {next_id?: number}}) => u.row?.next_id === 1001));

// --- update every 10th ----------------------------------------------------
const upd = applied(thousand, run(thousand, BENCH, click("update")).updates);
const banged = upd.map((r, i) => [i, r.label.endsWith(" !!!")] as const).filter(([, b2]) => b2).map(([i]) => i);
check("exactly 100 rows gain the suffix", banged.length === 100, banged.length);
check("and they are 0, 10, 20 …", banged.every((i, k) => i === k * 10));

// --- swap -----------------------------------------------------------------
const before = thousand.map((r) => r.id);
const swapped = applied(thousand, run(thousand, BENCH, click("swaprows")).updates);
const after = swapped.map((r) => r.id);
check("positions 1 and 998 exchange", after[1] === before[998] && after[998] === before[1]);
check("every other position holds",
  after.every((id, i) => (i === 1 || i === 998) ? true : id === before[i]));
check("a swap is two row writes",
  run(thousand, BENCH, click("swaprows")).updates
    .filter((u: {entity: string}) => u.entity === "row").length === 2);

const short = thousand.slice(0, 500);
check("a table shorter than 999 rows does not swap",
  run(short, BENCH, click("swaprows")).updates
    .filter((u: {entity: string}) => u.entity === "row").length === 0);

// --- select ---------------------------------------------------------------
const pick = run(thousand, BENCH, { type: "click", id: "7" });
check("selecting with nothing selected writes the row and the note", pick.updates.length === 2,
  pick.updates.length);
check("and writes the class the markup binds", pick.updates[0].row.cls === "danger");
const marked = applied(thousand, pick.updates);
const held = { ...BENCH, picked: "7" };
const move = run(marked, held, { type: "click", id: "9" });
check("selecting another clears the last and marks the new one, and says which",
  move.updates.length === 3, move.updates.length);
check("one gains the class and one loses it",
  move.updates.filter((u: {row: {cls: string}}) => u.row.cls === "danger").length === 1 &&
  move.updates.filter((u: {row: {cls: string}}) => u.row.cls === "").length === 1);
check("selecting the row already selected writes nothing",
  run(marked, held, { type: "click", id: "7" }).updates.length === 0);
// The class is cleared by naming the row that wore it, not by walking the table.
check("clearing the last selection is one write, whatever the table's length",
  move.updates.filter((u: {entity: string}) => u.entity === "row").length === 2);

// --- replace and remove ---------------------------------------------------
// Emptying and refilling are one conclusion, so one fold states both: every row
// it can see goes, and the thousand that replace them arrive, in one array.
const replaced = run(thousand, { ...BENCH, next_id: 1001 }, { type: "click", from: "run" });
const refilled = applied(thousand, replaced.updates);
check("Create-1,000 replaces the table in one fold", refilled.length === 1000, refilled.length);
check("it states the absence of every row that was there",
  replaced.updates.filter((u: {op: string}) => u.op === "delete").length === 1000);
check("and no row is named both gone and present",
  refilled.every((r) => Number(r.id) > 1000));
check("Create-10,000 gives 10000",
  applied([], run([], BENCH, { type: "click", from: "runlots" }).updates).length === 10000);
check("Create on an empty table states no absences",
  run([], BENCH, click("run")).updates.every((u: {op: string}) => u.op !== "delete"));

check("Clear states every row absent, and lets go of the selection",
  (() => { const r = run(thousand, held, click("clear"));
    const rows = r.updates.filter((u: {entity: string}) => u.entity === "row");
    return rows.length === 1000 && rows.every((u: {op: string}) => u.op === "delete") &&
      applied(thousand, r.updates).length === 0 &&
      r.updates.some((u: {entity: string; row: {picked?: string}}) =>
        u.entity === "bench" && u.row.picked === ""); })());

// The row's ✕ carries its row in its own DOM id, because the label beside it
// carries the same row and a click says nothing else about which was hit.
const dropped = run(thousand, BENCH, { type: "click", from: "rm-7", id: "7" });
check("the row's remove drops exactly that row",
  dropped.updates.length === 1 && dropped.updates[0].op === "delete" && dropped.updates[0].id === "7");
check("and leaves the rest standing", applied(thousand, dropped.updates).length === 999);
check("removing does not select", applied(thousand, dropped.updates).every((r) => r.cls === ""));

console.log(bad === 0 ? "\nall operations behave" : `\n${bad} FAILED`);
if (bad > 0) Deno.exit(1);
