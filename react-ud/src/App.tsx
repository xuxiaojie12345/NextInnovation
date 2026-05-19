import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import LoginPage from "./Login_x/LoginPage";

function App() {
  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/TestMain" element={<TestMain />} />
            <Route path="/Menu" element={<Menu />} />
            <Route path="/LoginPage" element={<LoginPage />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
