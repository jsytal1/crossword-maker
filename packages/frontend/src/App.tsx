import Navbar from "react-bootstrap/Navbar";
import Nav from "react-bootstrap/Nav";
import { LinkContainer } from "react-router-bootstrap";
import { useEffect, useState } from "react";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";

import "./App.css";

import { onError } from "./lib/errorLib";
import Routes from "./Routes.tsx";
import { AppContext, AppContextType } from "./lib/contextLib";

function App() {
  const nav = useNavigate();
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
    } catch (error) {
      if (error !== "No current user") {
        onError(error);
      }
    }

    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();

    userHasAuthenticated(false);
    nav("/login");
  }

  return (
    !isAuthenticating && (
      <div className="App container py-3">
        <Navbar collapseOnSelect expand="md" className="mb-3 px-3">
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold">Make Me Cross</Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav activeKey={window.location.pathname}>
              {isAuthenticated ? (
                <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
              ) : (
                <>
                  <LinkContainer to="/pl">
                    <Nav.Link>PL</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/signup">
                    <Nav.Link>Signup</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/login">
                    <Nav.Link>Login</Nav.Link>
                  </LinkContainer>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <AppContext.Provider
          value={{ isAuthenticated, userHasAuthenticated } as AppContextType}
        >
          <Routes />
        </AppContext.Provider>
      </div>
    )
  );
}

export default App;
