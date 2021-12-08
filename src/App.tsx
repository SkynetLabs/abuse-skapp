import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState } from 'react';
import { css } from 'glamor'
import { ToastContainer } from 'react-toastify';

const DEBUG = false;
const ABUSE_ENDPOINT = DEBUG
  ? 'https://siasky.dev/abuse/block'
  : 'https://siasky.net/abuse/block';

function App() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: "onChange"
  });

  const [skylinkInputs, setSkylinkInputs] = useState([0])

  // TODO: colors not working yet
  const showSuccess = (msg: string) => {
    toast(msg, {
      className: css({
        background: "#00C65E !important"
      }) as any
    })
  }

  // TODO: colors not working yet
  const showError = (msg: string) => {
    toast(msg, {
      className: css({
        background: "#FFCCCC !important"
      }) as any
    })
  }

  const onSubmit = (data: any) => {
    // aggregate all skylinks
    const skylinks: {[key: string]: boolean} = {};
    const keys = Object.keys(data);
    for (const key of keys) {
      if (key.startsWith('skylink_') && data[key]) {
        skylinks[data[key]] = true;
      }
    }

    console.log('skylinks', skylinks)

    // report every skykink separately
    return Promise.all(Object.keys(skylinks).map(skylink => {
      const report = {
        reporter: {
          name: data.reporterName,
          email: data.reporterEmail
        },
        skylink,
        tags: data.tags
      }
      console.log('report', JSON.stringify(report))
  
      const requestOptions = {
        method: 'POST',
        // mode: "no-cors" as RequestMode,
        credentials: 'include' as RequestCredentials,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      };

      return fetch(ABUSE_ENDPOINT, requestOptions)
    })).then(responses => {
      if (responses.length && responses[0].status === 401) {
        showError("You are not authenticated")
        return;
      }

      console.log('received responses', responses)

      let allOk = true;
      const okResponses = [200, 201, 204]
      for (const response of responses) {
        if (!okResponses.includes(response.status)) {
          showError("Something went wrong")
          console.log('block failed, unexpected status', response.status, response)
          allOk = false
        }
      }

      return allOk
    })
    .then((ok) => {
      if (ok) {
        console.log('block succeeded, res: ', data)
        showSuccess("Thank you for reporting!")
        reset();
      }
    })
    .catch(error => {
      showError("Something went wrong")
      console.log('block failed, err', error)
    });
  };
  
  return (
    <div className="App">
      <div className="alert alert-warning">
        <strong>NOTE: </strong>
        you must be logged in with a <a href="https://account.siasky.net/" target="_blank" rel="noopener noreferrer"> Skynet account</a> to be able to report abuse
      </div>

      <header className="App-header">
        <div className="card m-3" style={{minWidth: '500px'}}>
          <h5 className="card-header">Skynet Abuse Form</h5>
          <div className="card-body row g-2">
            
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group form-input">
                <label>Reporter Name (*):</label>
                <input {...register('reporterName', { required: true })} /> 
                {errors.reporterName && <p className="error">this field is required</p>}
              </div>

              <div className="form-group form-input">
                <label>Reporter Email (*):</label>
                <input {...register('reporterEmail', { required: true })} />
                {errors.reporterEmail && <p className="error">this field is required</p>}
              </div>

              <div className="form-group form-input">
                <label style={{lineHeight: '36px'}}>Skylinks (*):</label>
                <div className="buttons-add-remove">
                  <button type="button" className="btn btn-secondary" onClick={(e) => {
                    (e.target as any).blur()
                    setSkylinkInputs([...skylinkInputs, skylinkInputs.length])
                  }}>+
                  </button>
                  <button disabled={skylinkInputs.length===1} type="button" className="btn btn-secondary" onClick={(e) => {
                    (e.target as any).blur()
                    if (skylinkInputs.length > 1) {
                      setSkylinkInputs(skylinkInputs.slice(0, -1))
                    }
                  }}>-
                  </button>
                </div>
                {skylinkInputs.map(i => {
                  const isFirst = i === 0;
                  return (
                    <div key={`skylink_${i}`}>
                      <input
                        style={{ marginTop: isFirst ? '0px' : '20px' }}
                        {...register(`skylink_${i}`, { required: isFirst })}
                      />
                      { errors[`skylink_${i}`] && <p className="error">this field is required</p> }
                      </div>
                  )
                })}
              </div>

              <div className="form-group">
                <label>Tags:</label>

                <div>
                <input {...register('tags')} type="checkbox" id="childabuse" value="childabuse"/>
                <label htmlFor="childabuse">child abuse content</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" id="copyright" value="copyright"/>
                <label htmlFor="copyright">copyright violation</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" id="malware" value="malware"/>
                <label htmlFor="malware">malware</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" id="non-consensual" value="non-consensual"/>
                <label htmlFor="non-consensual">non-consensual content</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" id="phishing" value="phishing"/>
                <label htmlFor="phishing">phishing content</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" id="terrorist" value="terrorist"/>
                <label htmlFor="terrorist">terrorist content</label>
                </div>

              </div>

              <div>
                <button disabled={isSubmitting} type="submit" className="btn btn-primary">{isSubmitting ? "Submitting..." : "Submit" }</button>
              </div>
            </form>
          </div>
        </div>
      </header>
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
  );
}

export default App;
