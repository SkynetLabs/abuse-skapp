import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';

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

  const onSubmit = (data: any) => {
    const report = {
      reporter: {
        name: data.reporterName,
        email: data.reporterEmail
      },
      skylink: data.skylink,
      tags: data.tags
    }
    console.log('reporting', JSON.stringify(report))

    const requestOptions = {
      method: 'POST',
      // mode: "no-cors" as RequestMode,
      credentials: 'include' as RequestCredentials,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report)
    };
    
    fetch('https://siasky.net/abuse/block', requestOptions)
      .then(response => {
        if (response.status === 401) {
          toast("You are not authenticated")
          return;
        }

        console.log('received response', response)
        const okResponses = [200, 201, 204]
        if (!okResponses.includes(response.status)) {
          toast("Something went wrong")
          console.log('block failed, unexpected status', response.status)
          return;
        }

        return response.body
      })
      .then((data) => {
        if (!data) {
          return;
        }

        console.log('block succeeded, res: ', data)
        toast("Thank you for reporting!")
        reset();
      })
      .catch(error => {
        toast("Something went wrong")
        console.log('block failed, err', error)
      } );
  };
  
  return (
    <div className="App">
      <header className="App-header">
        <div className="card m-3">
          <h5 className="card-header">Skynet Abuse Form</h5>
          <div className="card-body row g-2">
          <form onSubmit={handleSubmit(onSubmit)}>
              <div className="form-group info">
                <label>Reporter Name</label>
                
                <input {...register('reporterName', { required: true })} /> 
                {errors.reporterName && <p className="error">this field is required</p>}
                
              </div>

              <div className="form-group info">
                <label>Reporter Email</label>
                <input {...register('reporterEmail', { required: true })} />
                {errors.reporterEmail && <p className="error">this field is required</p>}
              </div>

              <div className="form-group info">
                <label>Skylink</label>
                <input {...register('skylink', { required: true })} />
                {errors.skylink && <p className="error">this field is required</p>}
              </div>

              <div className="form-group">
                <label>Tags:</label>

                <div>
                <input {...register('tags')} type="checkbox" value="copyright"/>
                <label htmlFor="copyright">copyright violation</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" value="non-consensual"/>
                <label htmlFor="non-consensual">non-consensual content</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" value="childabuse"/>
                <label htmlFor="childabuse">child abuse content</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" value="malware"/>
                <label htmlFor="malware">malware</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" value="terrorist"/>
                <label htmlFor="terrorist">terrorist content</label>
                </div>

                <div>
                <input {...register('tags')} type="checkbox" value="phishing"/>
                <label htmlFor="phishing">phishing content</label>
                </div>
              </div>

              <div>
                <button disabled={isSubmitting} type="submit" className="btn btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      </header>
    </div>
  );
}

export default App;
