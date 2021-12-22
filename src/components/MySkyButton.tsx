import * as React from "react";
import classNames from "classnames";
import { Spinner } from 'react-bootstrap';
import { MySkyContext } from "../state/mySky";

export const MySkyButton = () => {
  const { userId, userLoggingIn, login, logout } = React.useContext(MySkyContext);

  const className = "mysky-login border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors";

  return (
    <>
      {/* not logged in */}
      {!userLoggingIn && !userId && (
        <button className={className} onClick={() => login()}>
          Authenticate with MySky
        </button>
      )}

      {/* logging in */}
      {userLoggingIn && (
        <button className={classNames(className, "cursor-auto")} disabled={true}>
          <Spinner animation="border" variant="primary" style={{marginRight: '20px'}}/> Waiting for authentication
        </button>
      )}

      {/* logged in */}
      {!userLoggingIn && userId && (
        <button
          className="inline-flex items-center px-4 py-2 border border-palette-300 shadow-sm text-sm font-medium rounded-md bg-white hover:border-palette-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary text-palette-300 hover:text-palette-600"
          onClick={logout}
        >
          Sign out from MySky
        </button>
      )}
    </>
  );
};

export default MySkyButton;
