// Copyright 2020 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
//
import React from 'react';
import Alert from 'react-bootstrap/Alert';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Login from './login';
import {ErrorContext} from './context/error-context';
import {getAuthorizationUrl} from './api/github';

class BaseHome extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      authorizationUrl: null
    };
  }

  async componentDidMount() {
    const authorizationUrl = await getAuthorizationUrl();
    this.setState({
      loading: false,
      authorizationUrl
    });
  }

  render() {
    return (
      <Container fluid className="home">
        <Row className="header">
          <Col md={10}>flaky.dev</Col>
          <Col>
            <Login text="Login with GitHub" loading={this.state.loading} authorizationUrl={this.state.authorizationUrl}/>
          </Col>
        </Row>
        {(() => {
          if (this.props.error.msg) {
            return (
              <Row>
                <Col md={{span: 6, offset: 3}}>
                  <Alert variant="danger">{this.props.error.msg}</Alert>
                </Col>
              </Row>
            );
          }
        })()}
        <Row>
          <Col md={{span: 6, offset: 2}}>
            <h1>Stop wrestling with flaky tests</h1>
            <p>
	flaky.dev collects information from your tests runs, performs
	statistical analysis, and helps you keep on top of failing tests.
            </p>
          </Col>
        </Row>
        <Row>
          <Col md={3}/>
          <Col md={6}>
            <Login text="Create an Account" loading={this.state.loading} authorizationUrl={this.state.authorizationUrl}/>
          </Col>
        </Row>
      </Container>
    );
  }
}

const Home = () => (
  <ErrorContext.Consumer>
    {({error}) =>
      <BaseHome error={error}/>}
  </ErrorContext.Consumer>
);

export default Home;
