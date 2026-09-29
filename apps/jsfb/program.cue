// The machine rung of apps/jsfb: js-framework-benchmark, compiled to pronto.
//
// The benchmark is the oracle. Its operations, its element ids, its markup and
// its label vocabulary are fixed by the published implementation and are
// reproduced here rather than reinterpreted — a deviation would make this app
// useless as the thing it is for, which is showing what each row operation
// looks like in this terminal (ir decision-01).
@extern(embed)

package jsfb

import (
	pronto "bonisoft.org/plugins/pronto"
)

_designMd: _ @embed(file="DESIGN.md", type=text)

code: pronto.#App & {
	state: {
		entities: {
			// The table under test. `ord` is what the region orders by, so a swap
			// is two rows exchanging it — the same observable move as swapping
			// two elements of an array (ir decision-04).
			Row: {
				id: "0xc75ee275aaa2d971"
				table: "row"
				durability: "tab"
				fields: [
					{ordinal: 1, name: "id", type: "string", pk: true, cel: "this.size() <= 12"},
					{ordinal: 2, name: "label", type: "string", cel: "this.size() >= 3 && this.size() <= 60"},
					{ordinal: 3, name: "ord", type: "int32", cel: "this >= 0"},
					// The class the benchmark's row wears when it is selected. A
					// template binds a field and cannot compute one, so the word
					// itself is the column (ir decision-06).
					{ordinal: 4, name: "cls", type: "string", required: false, cel: "this in ['', 'danger']"},
				]
			}
			// One row the controls write to, and the reduce folds. A click reaches
			// a reduce carrying only ids, so a button that means "append a
			// thousand" says so here (ir decision-03).
			Bench: {
				id: "0xfd0708091405b292"
				table: "bench"
				durability: "tab"
				fields: [
					{ordinal: 1, name: "id", type: "string", pk: true, cel: "this.size() <= 8"},
					// The next id to hand out. The benchmark's ids climb for the
					// life of the page and are never reused.
					{ordinal: 2, name: "next_id", type: "int32", cel: "this >= 1"},
					// Which row wears the selection, so clearing the last one is a
					// lookup and not a walk of the table.
					{ordinal: 3, name: "picked", type: "string", required: false},
				]
				seed: [{id: "bench", next_id: 1, picked: ""}]
			}
		}
		pipelines: {}
	}

	// Nothing steps outside the cluster and terminal contracts: the app is a
	// measurement of the terminal, so a hatch would measure something else
	// (ir decision-08).
	capabilities: {
		blobs: false
		hatches: {}
		vendored: {}
	}

	surface: {
		screens: {
			main: {
				title:  "js-framework-benchmark"
				route:  "/"
				markup: _mainMarkup
				// No form: the benchmark's six buttons and the two links in each row
				// are click bindings to the bench reduce, and the reduce states every
				// mutation itself, deletes included (ir decision-05).
				forms: []
				states: ["loading", "empty", "populated", "populated-dark"]
				// The storyboard the ir draws, path for path, so every acceptance
				// claim settles on a path the program declares.
				paths: {
					arrive: {states: ["loading", "empty"], accepts: []}
					create: {states: ["empty", "populated"], accepts: ["accept-run", "accept-labels", "accept-ids"]}
					create_lots: {states: ["empty", "populated"], accepts: ["accept-runlots"]}
					append: {states: ["populated", "populated"], accepts: ["accept-add", "accept-ids"]}
					update: {states: ["populated", "populated"], accepts: ["accept-update"]}
					select: {states: ["populated", "populated"], accepts: ["accept-select"]}
					swap: {states: ["populated", "populated"], accepts: ["accept-swap", "accept-swap-short"]}
					remove: {states: ["populated", "populated"], accepts: ["accept-remove"]}
					clear: {states: ["populated", "empty"], accepts: ["accept-clear"]}
					night: {states: ["populated", "populated-dark"], accepts: []}
				}
			}
		}

		handlers: {}

		design: (pronto.#DesignMd & {text: _designMd}).design

		flows: {
			"run":      {of: "main", entity: "Row", action: "delete"}
			"runlots":  {of: "main", entity: "Row", action: "delete"}
			"add":      {of: "main", entity: "Bench", action: "update"}
			"update":   {of: "main", entity: "Bench", action: "update"}
			"swaprows": {of: "main", entity: "Bench", action: "update"}
			"select":   {of: "main", entity: "Row", action: "update"}
			"clear":    {of: "main", entity: "Row", action: "delete"}
			"remove":   {of: "main", entity: "Row", action: "delete"}
		}
	}

	meta: {
		name:        "jsfb"
		description: "js-framework-benchmark's row operations, as a pronto app: what create, update, select, swap and remove look like in this terminal."
		ir: {sha256: "3ca04528bfb4918186a599869b5bd0c0817227db8069368ca89c05487bcf233a"}
		targets: ["pages"]
		decisions: {
			"decision-01": {}
			"decision-02": {}
			"decision-03": {}
			"decision-04": {}
			"decision-05": {}
			"decision-06": {}
			"decision-07": {}
			"decision-08": {}
		}
		tests: {}
	}
}

cluster: (pronto.#DefaultCluster & {"code": code, statics: terminal.surface.statics}).out
terminal: (pronto.#DefaultTerminal & {"code": code}).out
loop: (pronto.#DefaultLoop & {"code": code, "cluster": cluster, "terminal": terminal}).out

// The operations are a function of the rows, so they are checkable without a
// browser or a cluster — which is what makes this app a regression gate rather
// than a demonstration.
loop: surface: checks: "ops": {
	verb: "test"
	cmds: [
		"deno run --allow-read tests/ops.ts",
	]
	note: "the nine operations against the reduce: counts, ids, label shape, every-tenth, the swap's two writes, and what a selection costs"
}

build: (pronto.#DefaultBuild & {"code": code, "loop": loop, "cluster": cluster}).out

out: pronto.#emit & {"code": code, "cluster": cluster, "terminal": terminal, "loop": loop, "build": build}
