import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import UD01 from "./20260603/01/UD01";
import UD02 from "./20260603/02/UD02";

function App() {
  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            {/* <Route path="/" element={<Login />} /> */}
            <Route path="/" element={<Navigate to="/UD01" replace />} />
            <Route path="/TestMain" element={<TestMain />} />
            {/* <Route path="/Menu" element={<Menu />} /> */}
            <Route path="/UD01" element={<UD01 />} />
            <Route path="/UD02" element={<UD02 />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
