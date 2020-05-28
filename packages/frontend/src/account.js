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
import {withRouter} from 'react-router';
import {UserContext} from './context/user-context';

class BaseAccount extends React.Component {
  render() {
    return (
      <Container fluid>
        <Row>
          <Col>
            <Alert variant="success">
              <Alert.Heading>Welcome to flaky.dev {this.props.user.name}</Alert.Heading>
              <p>
	You are currently logged in to an acccount, good work!
              </p>
              <hr/>
              <p className="mb-0">
	look at me go! <img src={this.props.user.avatar_url}/>
              </p>
            </Alert>
          </Col>
        </Row>
      </Container>
    );
  }
}

const BaseAccountWithRouter = withRouter(BaseAccount);

const Account = () => (
  <UserContext.Consumer>
    {({user, setUser}) =>
      <BaseAccountWithRouter user={user} setUser={setUser}/>}
  </UserContext.Consumer>
);

export default Account;
