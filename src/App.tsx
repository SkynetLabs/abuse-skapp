import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { css } from 'glamor'
import { ToastContainer } from 'react-toastify';

const DEBUG = true;
const ABUSE_ENDPOINT = DEBUG
  ? 'https://dev1.siasky.dev/abuse/block'
  : 'https://siasky.net/abuse/block';

type FormData = {
  reporterName: string;
  reporterEmail: string;
  skylinks: string;
  tags: string[];
}

function App() {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    mode: 'onSubmit',
    reValidateMode: "onChange"
  });

  const watchSkylinks = watch("skylinks")

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

  const extractSkylinks = (input: string): string[] => {
    if (!input) {
      return [];
    }
    const skylinksMap: {[key: string]: boolean} = {};
    for (const line of input.split("\n")) {
      for (const skylink of line.split(",")) {
        skylinksMap[skylink.trim()] = true;
      }
    }
    const skylinks = Object.keys(skylinksMap)
    console.log(skylinks)
    return skylinks.filter(Boolean)
  }

  const filterSkylinks = (input: string[]): string[] => {
    const validated:string[] = [];

    const regEx = new RegExp('^.*([a-z0-9]{55})|([a-zA-Z0-9-_]{46}).*$')
    for (const skylink of input) {
      if (regEx.test(skylink)) {
        validated.push(skylink)
      }
    }

    return validated;
  }

  const onSubmit = (data: FormData) => {
    // report every skykink separately
    const skylinks = extractSkylinks(data.skylinks)
    return Promise.all(skylinks.map(skylink => {
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
      <header className="App-header">
        <div className="card m-3">
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
                <div className="form-group">
                  <label htmlFor="exampleFormControlTextarea1">Skylinks (*):</label>
                  <p className="note"><strong>NOTE:</strong><br />
                  please enter skylinks separated by a comma or new line<br />
                  currently <strong>{filterSkylinks(extractSkylinks(watchSkylinks)).length}</strong> possible skylinks detected</p>

                  <textarea className="form-control" id="exampleFormControlTextarea1" rows={3}
                  {...register('skylinks', { required: true })}
                  ></textarea>
                  {errors.skylinks && <p className="error">this field is required</p>}
                </div>

              </div>

              <div className="form-group">
                <label>Tags: (*)</label>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="childabuse" value="childabuse"/>
                <label htmlFor="childabuse">child abuse content</label>
                </div>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="copyright" value="copyright"/>
                <label htmlFor="copyright">copyright violation</label>
                </div>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="malware" value="malware"/>
                <label htmlFor="malware">malware</label>
                </div>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="non-consensual" value="non-consensual"/>
                <label htmlFor="non-consensual">non-consensual content</label>
                </div>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="phishing" value="phishing"/>
                <label htmlFor="phishing">phishing content</label>
                </div>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="terrorist" value="terrorist"/>
                <label htmlFor="terrorist">terrorist content</label>
                </div>

                <div>
                <input {...register('tags', {validate: v => v.length > 0})} type="checkbox" id="abusive" value="abusive"/>
                <label htmlFor="abusive">other (abusive) content</label>
                </div>

                {errors.tags && <p className="error">at least one tag is required</p>}
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
