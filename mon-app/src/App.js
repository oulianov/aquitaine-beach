import './App.css';
import React, { Component } from "react";
import { VegaLite } from 'react-vega'
import elasticsearch from "elasticsearch";
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import {FormGroup, FormControl, Dropdown, DropdownButton, Container, Row, Col, Card, Alert } from 'react-bootstrap'

let client = new elasticsearch.Client({
  host: "localhost:9200",
  log: "trace"
});

const spec = {
  width: 400,
  height: 400,
  mark: 'bar',
  encoding: {
    x: { 
      field: 'activity',
      type: 'ordinal',
      "axis": {
        "labelAlign": "right",
        "labelAngle": "-45"
      }
     },
    y: { field: 'nombre_activites', type: 'quantitative' },
  },
  data: { name: 'table' },
}

class App extends Component {
  constructor(props) {
    super(props);

    this.state = { data: [], query: '', fields: 'tout', aggreg: {} };
  }

  componentDidMount() {
    client
      .search({
        index: 'beach',
        size: '0',
        body: {
          aggs: {
            "activity_type": {
              terms: {
                field: "type"
              }
            }
          }
        }
      })
      .then((body) => {
        let barData = {
          table: []
        }
        body.aggregations.activity_type.buckets.forEach(activity => {
          barData.table.push({ activity: activity.key, nombre_activites: activity.doc_count })
        })
        this.setState({
          aggreg: barData
        })
      },
        function (error) {
          console.trace(error.message);
        }
      );

    client
    .search({
      index: 'beach',
      size: '1000',
      body: {
        query: {
          match_all: {}
        }
      }
    })
    .then((body) => {
      console.log(body.hits.hits)
      this.setState({ data: body.hits.hits });
    },
      function (error) {
        console.trace(error.message);
      }
    );
  }

  handleInputChange = (event) => {
    const query = event.target.value.toLowerCase()
    this.setState({
      query: query
    })
    this.getData(query, this.state.fields)
    this.getAggregData(query, this.state.fields)
  }

  handleSelect = (value) => {
    console.log(value)
    this.setState({
      fields: value
    })
    this.getData(this.state.query, value)
    this.getAggregData(this.state.query, value)
  }

  getAggregData = (query, field)=> {
    client
      .search({
        index: 'beach',
        size: '0',
        body: {
          query: {
            multi_match: {
              query: query,
              fields: (field === "tout" ? ['tarifs', 'description', 'adresse'] : [field])
            }
          },
          aggs: {
            "activity_type": {
              terms: {
                field: "type"
              }
            }
          }
        }
      })
      .then((body) => {
        let barData = {
          table: []
        }
        body.aggregations.activity_type.buckets.forEach(activity => {
          barData.table.push({ activity: activity.key, nombre_activites: activity.doc_count })
        })
        this.setState({
          aggreg: barData
        })
      },
        function (error) {
          console.trace(error.message);
        }
      );
  }
  getData = (query, field) => {
    client
      .search({
        index: 'beach',
        size: '1000',
        body: {
          query: {
            multi_match: {
              query: query,
              fields: (field === "tout" ? ['tarifs', 'description', 'adresse'] : [field])
            }
          }
        }
      })
      .then((body) => {
        this.setState({ data: body.hits.hits });
      },
        function (error) {
          console.trace(error.message);
        }
      );
  }

  render() {
    return (
      <Container fluid>
        <Row className="justify-content-md-center">
          <Col xs={5}>
            <Alert variant="info" size>
                <h2 className="text-center">🏖️ Découvrez l'Aquitaine</h2>
            </Alert>
          </Col>
        </Row>
        <Row className="justify-content-right">
          <Col xs={3}>
          <FormGroup>
            <FormControl 
              type='text' 
              placeholder='Rechechez une activité...' 
              onChange={(value)=>this.handleInputChange(value)}
            />
            </FormGroup>
          </Col>
          <Col xs={1}>
            <DropdownButton bsStyle="success" title={this.state.fields} onSelect={(value)=>this.handleSelect(value)} >
              <Dropdown.Item eventKey="tout">Tout</Dropdown.Item>
              <Dropdown.Item eventKey="description">Description</Dropdown.Item>
              <Dropdown.Item eventKey="tarifs">Tarifs</Dropdown.Item>
              <Dropdown.Item eventKey="adresse">Adresse</Dropdown.Item>
            </DropdownButton>
          </Col>
        </Row>
        <Row className="justify-content-md-center">
          <Col xs={8}>
            <Card border="success">
              <Card.Body>
                <Card.Title className="text-center">Carte des activités</Card.Title>
                <Card.Subtitle className="text-center">{this.state.data.length} résultats</Card.Subtitle>
                <MapContainer center={[44.8333, -0.5667]} zoom={8} scrollWheelZoom={false}>
                 <TileLayer
                  attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                {this.state.data.map(place => (
                  <Marker position={[place._source.latitude, place._source.longitude]}>
                    <Popup>
                      <b>{place._source.nom}</b> ({place._source.type})
                      <br />
                      <a
                        className="popup-website"
                        href={place._source.site_web}
                        target="_blank"
                        rel="noopener noreferrer"
                      >{place._source.site_web}</a>
                      <br />
                      {place._source.description}
                      <hr></hr>
                      <a className="popup-mail"
                        href={`mailto:${place._source.mail}`}
                        target="_blank"
                        rel="noopener noreferrer"> {place._source.mail}</a> {place._source.tel}
                      <br />
                      {place._source.commune}
                      <br />
                      {place._source.adresse}
                      <br />
                      <hr></hr>
                      {place._source.tarifs}
                      <br />
                    </Popup>
                  </Marker>
                ))}
                </MapContainer>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={4}>
          <Card border="success">
              <Card.Body>
                <Card.Title className="text-center">Répartition des activités</Card.Title>
                  <VegaLite spec={spec} data={this.state.aggreg} />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container >
    );
  }
}

export default App;
