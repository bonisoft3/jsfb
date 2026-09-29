import { createRoot } from "react-dom/client";
import { useState, useCallback } from "react";

// The canonical keyed implementation: rows in a JS array, React reconciles.
const A = ["pretty","large","big","small","tall","short","long","handsome","plain","quaint","clean","elegant","easy","angry","crazy","helpful","mushy","odd","unsightly","adorable","important","inexpensive","cheap","expensive","fancy"];
const C = ["red","yellow","blue","green","pink","brown","purple","brown","white","black","orange"];
const N = ["table","chair","house","bbq","desk","car","pony","cookie","sandwich","burger","pizza","mouse","keyboard"];
const rnd = (n) => Math.round(Math.random() * 1000) % n;

let nextId = 1;
const build = (count) => {
  const data = new Array(count);
  for (let i = 0; i < count; i++) {
    data[i] = { id: nextId++, label: `${A[rnd(25)]} ${C[rnd(11)]} ${N[rnd(13)]}` };
  }
  return data;
};

// Module scope, as the published implementation has it: declared inside App
// it would be a new component type per render, remounting all six buttons on
// every operation inside the window the driver times.
const Button = ({ id, title, cb }) => (
  <div className="col-sm-6 smallpad">
    <button type="button" className="btn btn-primary btn-block" id={id} onClick={cb}>{title}</button>
  </div>
);

function App() {
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);

  const run = useCallback(() => setData(build(1000)), []);
  const runLots = useCallback(() => setData(build(10000)), []);
  const add = useCallback(() => setData((d) => d.concat(build(1000))), []);
  const update = useCallback(() => setData((d) => {
    const n = d.slice();
    for (let i = 0; i < n.length; i += 10) n[i] = { ...n[i], label: n[i].label + " !!!" };
    return n;
  }), []);
  const clear = useCallback(() => { setData([]); setSelected(null); }, []);
  const swapRows = useCallback(() => setData((d) => {
    if (d.length <= 998) return d;
    const n = d.slice();
    const t = n[1]; n[1] = n[998]; n[998] = t;
    return n;
  }), []);
  const remove = useCallback((id) => setData((d) => {
    const i = d.findIndex((r) => r.id === id);
    return d.slice(0, i).concat(d.slice(i + 1));
  }), []);

  return (
    <div className="container">
      <div className="jumbotron"><div className="row">
        <div className="col-md-6"><h1>React</h1></div>
        <div className="col-md-6"><div className="row">
          <Button id="run" title="Create 1,000 rows" cb={run} />
          <Button id="runlots" title="Create 10,000 rows" cb={runLots} />
          <Button id="add" title="Append 1,000 rows" cb={add} />
          <Button id="update" title="Update every 10th row" cb={update} />
          <Button id="clear" title="Clear" cb={clear} />
          <Button id="swaprows" title="Swap Rows" cb={swapRows} />
        </div></div>
      </div></div>
      <table className="table table-hover table-striped test-data"><tbody>
        {data.map((item) => (
          <tr key={item.id} className={item.id === selected ? "danger" : ""}>
            <td className="col-md-1">{item.id}</td>
            <td className="col-md-4"><a className="lbl" onClick={() => setSelected(item.id)}>{item.label}</a></td>
            <td className="col-md-1"><a className="remove" onClick={() => remove(item.id)}>✕</a></td>
            <td className="col-md-6"></td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
