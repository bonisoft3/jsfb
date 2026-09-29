# Acceptance

- [ ] Create 1,000 rows leaves exactly 1,000 rows in the table, whatever was there before. {#accept-run}
- [ ] Create 10,000 rows leaves exactly 10,000. {#accept-runlots}
- [ ] Append 1,000 rows adds a thousand to the end and disturbs nothing above them. {#accept-add}
- [ ] Every label is one adjective, one colour and one noun, and a thousand consecutive labels are not all alike. {#accept-labels}
- [ ] Row ids climb and are never reused, so appending after a clear does not repeat an id. {#accept-ids}
- [ ] Update every 10th row appends " !!!" to rows 0, 10, 20 … and to no others. {#accept-update}
- [ ] Clicking a row's label marks that row and unmarks whichever was marked before. {#accept-select}
- [ ] Swap Rows exchanges the rows at positions 1 and 998, ids included, and leaves the rest in place. {#accept-swap}
- [ ] Swap Rows on a table shorter than 999 rows does nothing. {#accept-swap-short}
- [ ] Clicking a row's ✕ removes that row and no other. {#accept-remove}
- [ ] Clear empties the table. {#accept-clear}
