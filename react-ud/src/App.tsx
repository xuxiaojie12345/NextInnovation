import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import Layout from "./Layout/Layout";
import GenerateHomologationDocument from "./GenerateHomologationDocument/GenerateHomologationDocument";
import GenerateDocument from "./GenerateDocument/GenerateDocument";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import SaveModifications from "./SaveModifications/SaveModifications";
import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";
import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./HomologationVariablesResultList/HomologationVariablesResultList";
import HdocVariables from "./HdocVariables/HdocVariables";
import HdocVariablesResultList from "./HdocVariablesResultList/HdocVariablesResultList";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />

            {/* 包含 Menu（左側）+ 內容（右側）的頁面 */}
            <Route element={<Layout />}>
              <Route
                path='/generate-homologation-document'
                element={<GenerateHomologationDocument />}
              />
              <Route path='/generate-document' element={<GenerateDocument />} />
              <Route path='/modify-document' element={<ModifyDocument />} />
              <Route path='/save-modifications' element={<SaveModifications />} />
              <Route
                path='/vehicle-specification'
                element={<VehicleSpecification />}
              />
              <Route
                path='/homologation-variables'
                element={<HomologationVariables />}
              />
              <Route
                path='/homologation-variables-result-list'
                element={<HomologationVariablesResultList />}
              />
              <Route
                path='/hdoc-variables'
                element={<HdocVariables />}
              />
              <Route
                path='/hdoc-variables-result-list'
                element={<HdocVariablesResultList />}
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
