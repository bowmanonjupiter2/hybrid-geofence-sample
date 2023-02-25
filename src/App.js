import logo from './logo.svg';
import './App.css';
import { useEffect, useState } from 'react';

function App() {

  const [data, setData] = useState(null);
  const [fetchData, setFetch] = useState(false);

  useEffect(() => {
    if(fetchData) {
      makeAPICall();
    }
  }, [fetchData]);

  const makeAPICall = async () => {
    try {
      const response = await fetch('http://localhost:8080/http://120.79.165.40/fetchWechatTicket', {
        method: "GET",
        headers : {
          "Content-Type" : "application/json",
        }
      });
      const jsonResp = await response.json();
      setData(jsonResp)
    } catch (e) {
        console.log(e);
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button onClick={() => setFetch(true)}>Fetch Data</button>
        <p>{JSON.stringify(data)}</p>
      </header>
    </div>
  );
}

export default App;
