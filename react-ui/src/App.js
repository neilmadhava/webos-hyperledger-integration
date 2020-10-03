import React, { Component } from 'react'
import {Route, Switch} from "react-router-dom";
import RegistrationForm from './RegistrationForm'; 
import Parent from './Parent';
import Child from './Child';
// import OrgsInterface from './OrgsInterface';
// import OrgsUI from './OrgsUI';
import './static/App.css';

class App extends Component {
  constructor(props){
    super(props);
    this.state = {
      tokens: {}
    };
    this.addTokens = this.addTokens.bind(this);
  }

  addTokens(obj){
      this.setState({
          tokens: obj
      });
  }

  render() {
    return (
      <Switch>
        <Route 
          exact 
          path="/"
          // component={OrgsInterface}
          render={routeProps => <RegistrationForm {...routeProps} tokens={this.state.tokens} addTokens={this.addTokens} />}
        />
        
        <Route 
          exact 
          path="/parent" 
          component={Parent}
        />

        <Route 
          exact 
          path="/child" 
          component={Child}
        />
      </Switch>
    );
  }
}

export default App;
