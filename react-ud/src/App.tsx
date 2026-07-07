import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TestMain from "./Test/Test";
import Login from "./Login/Login";
import Menu from "./Menu/Menu";
import GenerateHomologationDocument from "./GenerateHomologationDocument​/GenerateHomologationDocument";
import GenerateDocument from "./GenerateHomologationDocument​/GenerateDocument";
import HDocHelp from "./GenerateHomologationDocument​/HDocHelp";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/menu' element={<Menu />} />
            <Route path='/generate-homologation-document' element={<GenerateHomologationDocument />} />
            <Route path='/generate-document' element={<GenerateDocument />} />
            <Route path='/hdoc-help' element={<HDocHelp />} />
            <Route path='/TestMain' element={<TestMain />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;