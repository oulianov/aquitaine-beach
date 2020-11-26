import logo from './logo.svg';
import './App.css';
import React, { Component } from "react";
import { VegaLite } from 'react-vega'
import elasticsearch from "elasticsearch";

let client = new elasticsearch.Client({
  host: "localhost:9200",
  log: "trace"
});

const spec = {
  width: 400,
  height: 200,
  mark: 'bar',
  encoding: {
    x: { field: 'a', type: 'ordinal' },
    y: { field: 'b', type: 'quantitative' },
  },
  data: { name: 'table' }, // note: vega-lite data attribute is a plain object instead of an array
}
 
const barData = {
  table: [
    { a: 'A', b: 28 },
    { a: 'B', b: 55 },
    { a: 'C', b: 43 },
    { a: 'D', b: 91 },
    { a: 'E', b: 81 },
    { a: 'F', b: 53 },
    { a: 'G', b: 19 },
    { a: 'H', b: 87 },
    { a: 'I', b: 52 },
  ],
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { data: [] };
  }

  componentDidMount() {
    client
      .search({
        q: 'tarif'
      })
      .then(
        function(body) {
          this.setState({ data: body.hits.hits });
          console.log(body.hits.hits)
        }.bind(this),
        function(error) {
          console.trace(error.message);
        }
      );
  }

render() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <VegaLite spec={spec} data={barData} />,
        <ul>
          {this.state.data.map(result => {
            return (
              <li key={result._id}>
                {result._source["NOM_OFFRE"]}
              </li>
            );
          })}
        </ul>
      </header>
    </div>
  );
  }
}

export default App;
