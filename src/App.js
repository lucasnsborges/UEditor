import React, { Component } from "react";
import PropTypes from "prop-types";

import { Route, Switch, withRouter } from "react-router-dom";
import { Helmet } from "react-helmet";

import Home from './components/Home';

import "./App.css"

class App extends Component {
  render() {
    return (
      <div className="App">
        <Helmet>
          <meta charSet="utf-8" />
          <title>Urupemba-v0 - Feed for showcasing your projects.</title>
          <meta
            name="description"
            content="Urupemba is a platform to receive academic projects."
          />
          <meta
            name="keywords"
            content="office dashboard"
          />
          <link rel="canonical" href="https://urubempa.ifal.edu.br" />
        </Helmet>
        <Switch>
          <Route exact path="/" component={Home} />
        </Switch>
      </div>
    );
  }
}

export default App;
