import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import Menu from "./Menu/Menu";
import UploadDeleteTemplate from "./UploadDeletetemplate/UploadDeleteTemplate";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/Menu' element={<Menu />} />
            <Route
              path='/UploadDeleteTemplate'
              element={<UploadDeleteTemplate />}
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
