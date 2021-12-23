import 'bootstrap/dist/css/bootstrap.min.css';
import { ReactNode, useContext } from 'react';
import {
  HashRouter as Router,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import Form from './pages/Form';
import Login from './pages/Login';
import { MySkyContext, MySkyProvider } from './state/mySky';

function Authenticated({ children }: { children: ReactNode }) {
  const auth = useContext(MySkyContext);
  return (
    <Route
      render={(routeProps:any) => {
        if (auth && auth.userId) {
          return children;
        }

        return (
          <Redirect
            to={{
              pathname: "/login",
              state: { from: routeProps.location },
            }}
          />
        );
      }}
    />
  );
}

function App() {
  return (
    <>
      <div className="App">
        <MySkyProvider>
          <Router>
            <Switch>
              <Route path="/login">
                {/* <LoginPage /> */}
                <Login />
              </Route>
              <Authenticated>
                <Form />
              </Authenticated>
            </Switch>
          </Router>
        </MySkyProvider>

        <ToastContainer
            position="top-right"
            autoClose={3000}
            hideProgressBar={true}
            newestOnTop={true}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
        />
        </div>
      </>
  );
}

export default App;
