import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import GenerateHomologationDocument from "./GenerateHomologationDocument/GenerateHomologationDocument";
import GenerateDocument from "./GenerateDocument/GenerateDocument";
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
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />
            <Route
              path='/generate-homologation-document'
              element={<GenerateHomologationDocument />}
            />
            <Route
              path='/generate-document'
              element={<GenerateDocument />}
            />
            <Route
              path='/modify-document'
              element={<ModifyDocument />}
            />
            <Route
              path='/save-modifications'
              element={<SaveModifications />}
            />
            <Route
              path='/vehicle-specification'
              element={<VehicleSpecification />}
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
