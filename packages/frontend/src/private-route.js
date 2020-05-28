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
import {UserContext} from './context/user-context';
import {withRouter} from 'react-router';
import {
  Route,
  Redirect
} from 'react-router-dom';
import {getUserSession} from './api/account';
import {ErrorContext} from './context/error-context';

class BasePrivateRoute extends Route {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  async componentDidMount() {
    try {
      const user = await getUserSession();
      this.props.setUser(user);
    } catch (error) {
      if (error.code === 404) {
        console.info(error.code);
        this.props.setError({
          msg: 'could not find a user session, please login or create an account'
        });
      } else {
        this.props.setError({
          msg: 'an unexpected error occurred'
        });
      }

      this.props.setUser({});
    }

    this.setState(() => {
      return {
        loading: false
      };
    });
  }

  render() {
    if (this.state.loading) {
      return (
        <b>loading...</b>
      );
    }

    const {user} = this.props;
    if (this.props.match) {
      if (user.login) {
        return super.render();
      }

      return <Redirect to="/"/>;
    }

    return super.render();
  }
}

const BasePrivateRouteWithRouter = withRouter(BasePrivateRoute);

const PrivateRoute = ({component: Component, ...rest}) => (
  <ErrorContext.Consumer>
    {({setError}) => (
      <UserContext.Consumer>
        {({user, setUser}) =>
          <BasePrivateRouteWithRouter {...rest} user={user} setUser={setUser} setError={setError}/>}
      </UserContext.Consumer>
    )}
  </ErrorContext.Consumer>
);

export default PrivateRoute;
