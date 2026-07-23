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
import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./HomologationVariablesResultList/HomologationVariablesResultList";
import ExistingHDocVariables from "./ExistingHDocVariables/ExistingHDocVariables";
import ExistingHDocVariablesResultList from "./ExistingHDocVariablesResultList/ExistingHDocVariablesResultList";

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
            <Route path='/homologation-variables' element={<HomologationVariables />} />
            <Route path='/homologation-variables-result' element={<HomologationVariablesResultList />} />
            <Route path='/existing-hdoc-variables' element={<ExistingHDocVariables />} />
            <Route path='/existing-hdoc-variables-result' element={<ExistingHDocVariablesResultList />} />
            <Route path='/TestMain' element={<TestMain />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;