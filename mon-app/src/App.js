import logo from './logo.svg';
import './App.css';
import React, { Component } from "react";
import { VegaLite, Vega } from 'react-vega'
import elasticsearch from "elasticsearch";
import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet'
let client = new elasticsearch.Client({
  host: "localhost:9200",
  log: "trace"
});

const spec = {
  width: 400,
  height: 200,
  mark: 'bar',
  encoding: {
    x: { field: 'code_postale', type: 'ordinal' },
    y: { field: 'nombre_activites', type: 'quantitative' },
  },
  data: { name: 'table' },
}

const pieSpec = {
  "data": { "name": 'table' },
  "mark": "arc",
  "encoding": {
    "theta": {"field": "nombre_activites", "type": "quantitative"},
    "color": {"field": "code_postale", "type": "ordinal"}
  },
  "view": {"stroke": null}
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { data: [], query: '', price: '', aggreg: {} };
  }

  componentWillMount(){
    client
      .search({
        index: 'beach',
        size: '0',
        body: {
          aggs: {
            "cities": {
              terms: {
                field: "code_postal"
              }
            }
          }
        }
      })
      .then((body)=> {
          let barData = {
            table: []
          }
          console.log(body.aggregations.cities.buckets)
          body.aggregations.cities.buckets.forEach(city=>{
            barData.table.push({ code_postale: city.key, nombre_activites: city.doc_count })
          })
          this.setState({
            aggreg: barData
          })
        },
        function(error) {
          console.trace(error.message);
        }
      );
  }

  handleInputChange = (event) => {
    this.setState({
        query: event.target.value
    })
  }

  handleInputChangePrice = (event) => {
    this.setState({
        price: event.target.value
    })
  }

  getData = () => {
    client
      .search({
        index: 'beach',
        size: '50',
        body: {
          query: {
            multi_match: {
              query : this.state.query + ' ' + this.state.price, 
              fields : [ "tarifs", "description" ] 
            }
          }
        }
      })
      .then((body)=> {
          console.log(body.hits.hits)
          this.setState({ data: body.hits.hits });
        },
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
          <VegaLite spec={spec} data={this.state.aggreg} />
          <Vega spec={pieSpec} data={this.state.aggreg} />
        </header>
        <input type="text" id="filter" placeholder="Cherchez une activité" onChange={this.handleInputChange}/>
        <input type="text" id="filter" placeholder="Cherchez un tarif" onChange={this.handleInputChangePrice}/>
        <button onClick={this.getData}>
          Chercher
        </button>
        <MapContainer center={[44.8333, -0.5667]} zoom={8} scrollWheelZoom={false}>
          <TileLayer
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {this.state.data.map(place=>(
          <Marker position={[place._source.latitude, place._source.longitude]}>
            <Popup>
              {place._source.nom}
              <br />
              {place._source.commune}
              <br />
              {place._source.adresse}
              <br />
              {place._source.mail}, {place._source.tel}
              <br />
              {place._source.description}
              <br />
              {place._source.tarifs}
          </Popup>
          </Marker>
          ))}
        </MapContainer>
      </div>
    );
    }
}

export default App;
