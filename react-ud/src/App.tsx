import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
