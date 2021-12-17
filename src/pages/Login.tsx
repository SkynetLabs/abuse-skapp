import { useContext, useEffect } from "react";
import { Redirect } from "react-router-dom";
import MySkyButton from "../components/MySkyButton";
import { MySkyContext } from "../state/mySky";
import { Spinner } from 'react-bootstrap';

export default function Login() {
  // fetch info from context
  const { userId, userLoggingIn } = useContext(MySkyContext);
  const { generateProof, proof, proofLoading } = useContext(MySkyContext)

  // fetch user info from the context
  const authenticated = userId && !userLoggingIn
  const proofOfWorkOK = proof && !proofLoading
  const powNotGenerated = !proof && !proofLoading 
  const generatingPoW = !proof && proofLoading

  // generate the proof
  useEffect(() => {
    if (authenticated && powNotGenerated) { 
      generateProof();
    }
  }, [authenticated, generateProof, powNotGenerated]);
  
  // redirect the user if he's authenticated
  if (authenticated && proofOfWorkOK) {
    console.log('proof', proof)
    return (
      <Redirect to={{ pathname: "/" }} />
    );
  }

  return (
    <div className="card m-3">
      <h5 className="card-header">Skynet Abuse Form</h5>
      <div className="card-body">
        {!authenticated && !generatingPoW && 
          <div>
            <p style={{marginBottom: '40px'}}>
              In order to report abuse, you have to be logged in to MySky.<br/>
              Creating an account is really easy and only takes a couple of seconds, <br />please click the button below to either log in or create an account.
            </p>
            <MySkyButton />
          </div>
        }
        {authenticated && generatingPoW &&
          <div>
            <p>
              Thank you for creating an account, you are almost ready to report abuse!<br />
              In order to protect our network, we require you to do some proof of work.<br />
              <br />
              This is now running in the backgound.<br />
              Please be patient as it might take multiple minutes.<br />
              You only have to do this once.
            </p>
            <div className="d-flex justify-content-center">
              <Spinner animation="border" variant="primary" />
            </div>
          </div>  
        }
      </div>
    </div>
  )
}