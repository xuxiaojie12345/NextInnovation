import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;