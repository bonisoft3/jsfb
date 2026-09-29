// The benchmark's own markup. Element ids, class names, table shape and button
// captions are the published implementation's and are not ours to improve on;
// what is ours is the wiring — a click per mutation and per selection, each
// reaching the bench fold, which states every write itself.
package jsfb

_mainMarkup: #"""
<section class="screen" data-screen="main">
  <!-- The fold answers clicks and nothing else, so the region declares no
       mutation handler: a wake per write batch would call it only to be told
       there is nothing to conclude. -->
  <div id="main" data-live="bench" data-filter="id=eq.bench" data-order="id.asc"
       data-handler="bench" data-reads="row,bench">
    <template data-item>
      <div class="container">

        <div class="jumbotron">
          <div class="row">
            <div class="col-md-6"><h1>pronto/omnishell</h1></div>
            <div class="col-md-6">
              <div class="row">
                <div class="col-sm-6 smallpad">
                  <!-- Emptying and refilling are one conclusion, so they are one
                       fold: it states the absence of every row it can see and
                       the presence of the thousand that replace them, and the
                       terminal sends each run down as one call (ir decision-05). -->
                  <button type="button" class="btn btn-primary btn-block" id="run" data-on-click="bench">Create 1,000 rows</button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button type="button" class="btn btn-primary btn-block" id="runlots" data-on-click="bench">Create 10,000 rows</button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button type="button" class="btn btn-primary btn-block" id="add" data-on-click="bench">Append 1,000 rows</button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button type="button" class="btn btn-primary btn-block" id="update" data-on-click="bench">Update every 10th row</button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button type="button" class="btn btn-primary btn-block" id="clear" data-on-click="bench">Clear</button>
                </div>
                <div class="col-sm-6 smallpad">
                  <button type="button" class="btn btn-primary btn-block" id="swaprows" data-on-click="bench">Swap Rows</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <table class="table table-hover table-striped test-data"
               data-live="row" data-order="ord.asc" data-handler="bench"
               data-reads="row,bench" data-empty="">
          <template data-item>
            <tr class="{cls}">
              <td class="col-md-1" data-text="{id}"></td>
              <td class="col-md-4"><a class="lbl" data-on-click="bench" data-text="{label}"></a></td>
              <!-- The row's own id, because a click carries the row and the
                   element's DOM id and nothing else, and the label beside this
                   carries the same row (ir decision-03). -->
              <td class="col-md-1"><a class="remove" id="rm-{id}" data-on-click="bench"><span class="remove glyphicon glyphicon-remove" aria-hidden="true"></span></a></td>
              <td class="col-md-6"></td>
            </tr>
          </template>
        </table>

        <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
      </div>
    </template>
  </div>
</section>
"""#
