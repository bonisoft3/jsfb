# js-framework-benchmark

Nine row operations over one table, and nothing else. The benchmark is the
oracle: its operations, counts and markup are published, so an implementation is
either faithful or wrong, with nothing to argue about.

- **Create 1,000 rows** — replace the table with a thousand
- **Create 10,000 rows** — replace it with ten thousand
- **Append 1,000 rows** — add a thousand to the end
- **Update every 10th row** — append `" !!!"` to rows 0, 10, 20, …
- **Clear** — remove every row
- **Swap Rows** — exchange the rows at positions 1 and 998
- **Select a row** — clicking its label highlights it, and only it
- **Remove a row** — clicking its ✕ removes that row

A row is an id, a label of three words, and whether it is selected. Labels are
one adjective, one colour and one noun.

This app exists to show what each of those operations looks like in this
terminal: which are forms, which are folds, and which cannot be a fold at all.
