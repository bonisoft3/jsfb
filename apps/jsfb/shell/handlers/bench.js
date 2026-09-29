// bench — all nine of the benchmark's operations, as one fold.
//
// Each operation is here because it forces a different part of the write
// contract: create in bulk, update by key, reorder, select, and remove — one
// row and the whole table.
(state, event) => {
  const rows = state.rows ?? {};
  const bench = (rows.bench ?? [])[0];
  if (bench === undefined) return { updates: [] };
  const list = rows.row ?? [];

  // The published vocabulary, unchanged: a label is one word from each list.
  const ADJECTIVES = [
    "pretty", "large", "big", "small", "tall", "short", "long", "handsome",
    "plain", "quaint", "clean", "elegant", "easy", "angry", "crazy", "helpful",
    "mushy", "odd", "unsightly", "adorable", "important", "inexpensive",
    "cheap", "expensive", "fancy",
  ];
  const COLOURS = [
    "red", "yellow", "blue", "green", "pink", "brown", "purple", "brown",
    "white", "black", "orange",
  ];
  const NOUNS = [
    "table", "chair", "house", "bbq", "desk", "car", "pony", "cookie",
    "sandwich", "burger", "pizza", "mouse", "keyboard",
  ];

  /* The reference implementation samples these three lists at random. A
   * compartment has no Math.random, so the draw is a walk instead. The three
   * lengths are pairwise coprime and each stride is coprime to its own length,
   * so consecutive labels differ in all three words and the walk runs 3,575
   * long before it returns to its start. It yields 3,250 distinct labels, not
   * 3,575, because "brown" is in the colour list twice — that repetition is the
   * benchmark's and is kept (ir decision-02). */
  const labelAt = (k) =>
    `${ADJECTIVES[k % 25]} ${COLOURS[(k * 7) % 11]} ${NOUNS[(k * 5) % 13]}`;

  const num = (v) => Number(v) || 0;
  // Asked for by the two operations that count down the table, and by nothing
  // else: sorting ten thousand rows to answer a click on one of them is work
  // the answer never reads.
  const byOrd = () => list.slice().sort((a, b) => num(a.ord) - num(b.ord));
  const settle = (row) => ({ op: "patch", entity: "bench", id: bench.id, row });
  /** Every row the fold can see, stated absent. */
  const gone = () => list.map((row) => ({ op: "delete", entity: "row", id: row.id }));

  /** `n` fresh rows. One counter serves as the id, the label's place in the
   * walk, and the position, so a new row always sorts after every row that
   * exists. Ids climb for the life of the page and are never reused, as the
   * benchmark's do. */
  const build = (n) => {
    const first = num(bench.next_id);
    const out = [];
    for (let i = 0; i < n; i += 1) {
      out.push({
        op: "put",
        entity: "row",
        id: String(first + i),
        row: { label: labelAt(first + i), ord: first + i, cls: "" },
      });
    }
    out.push(settle({ next_id: first + n }));
    return out;
  };

  /* A click carries the row's id and the element's own id, and that is the
   * whole of it — so the buttons that mean something other than "this row"
   * carry a DOM id and are told apart by it (ir decision-03). */
  if (event.type !== "click") return { updates: [] };
  const from = String(event.from ?? "");

  // Emptying and refilling are one conclusion: the absences and the arrivals go
  // down together, and no row is named twice because the counter never hands an
  // id back.
  if (from === "run") return { updates: [...gone(), ...build(1000)] };
  if (from === "runlots") return { updates: [...gone(), ...build(10000)] };
  if (from === "clear") return { updates: [...gone(), settle({ picked: "" })] };
  if (from === "add") return { updates: build(1000) };

  // Every tenth row, counted down the table as it is drawn.
  if (from === "update") {
    return {
      updates: byOrd().filter((_, i) => i % 10 === 0)
        .map((row) => ({ op: "patch", entity: "row", id: row.id, row: { label: `${row.label} !!!` } })),
    };
  }

  // The second row and the second from the end of a thousand, which is what the
  // benchmark swaps. Two rows exchange the column the table is ordered by;
  // nothing else moves.
  if (from === "swaprows") {
    const ranked = byOrd();
    if (ranked.length <= 998) return { updates: [] };
    const a = ranked[1];
    const b = ranked[998];
    return {
      updates: [
        { op: "patch", entity: "row", id: a.id, row: { ord: num(b.ord) } },
        { op: "patch", entity: "row", id: b.id, row: { ord: num(a.ord) } },
      ],
    };
  }

  // The row's ✕ carries the row in its own id, because the label beside it
  // carries the same row and a click says nothing else about which was hit.
  if (from.startsWith("rm-")) return { updates: [{ op: "delete", entity: "row", id: from.slice(3) }] };

  const id = String(event.id ?? "");
  if (id === "") return { updates: [] };
  const was = String(bench.picked ?? "");
  if (was === id) return { updates: [] };
  const updates = [];
  if (was !== "") updates.push({ op: "patch", entity: "row", id: was, row: { cls: "" } });
  updates.push({ op: "patch", entity: "row", id, row: { cls: "danger" } });
  updates.push(settle({ picked: id }));
  return { updates };
}
