import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import TestMain from "./Test/Test";
import Login from "./Login/Login";
import Menu from "./Menu/Menu";
import GenerateHomologationDocument from "./GenerateHomologationDocument​/GenerateHomologationDocument";
import GenerateDocument from "./GenerateDocument/GenerateDocument";
import HDocHelp from "./GenerateHomologationDocument​/HDocHelp";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import SaveModifications from "./SaveModifications/SaveModifications";
import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";

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
            <Route path='/modify-document' element={<ModifyDocument />} />
            <Route path='/save-modifications' element={<SaveModifications />} />
            <Route path='/vehicle-specification' element={<VehicleSpecification />} />
            <Route path='/TestMain' element={<TestMain />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;