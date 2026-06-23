import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import MenuLayout from "./Menu/MenuLayout";
import HDoc from "./HDoc/HDoc";
import GenerateDoc from "./GenerateDoc/GenerateDoc";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import SaveModifications from "./SaveModifications/SaveModifications";
import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";
import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResult from "./HomologationVariablesResult/HomologationVariablesResult";
import ExistingHDocVariables from "./ExistingHDocVariables/ExistingHDocVariables";
import ExistingHDocVariablesResult from "./ExistingHDocVariablesResult/ExistingHDocVariablesResult";
import UploadDeleteTemplate from "./UploadDeleteTemplate/UploadDeleteTemplate";

function App() {
  return (
    <div className="App">
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />

          {/* Menu 为父路由，子路由在右侧内容区显示 */}
          <Route path="/menu" element={<MenuLayout />}>
            <Route index element={<div />} />
            <Route path="HDoc" element={<HDoc />} />
            <Route path="GenerateDoc" element={<GenerateDoc />} />
            <Route path="modify-document" element={<ModifyDocument />} />
            <Route path="save-modifications" element={<SaveModifications />} />
            <Route
              path="mvda-vehicle-specification"
              element={<VehicleSpecification />}
            />
            <Route
              path="homologation-variables"
              element={<HomologationVariables />}
            />
            <Route
              path="homologation-variables-result"
              element={<HomologationVariablesResult />}
            />
            <Route
              path="existing-hdoc-variables"
              element={<ExistingHDocVariables />}
            />
            <Route
              path="existing-hdoc-variables-result"
              element={<ExistingHDocVariablesResult />}
            />
            <Route
              path="upload-delete-template"
              element={<UploadDeleteTemplate />}
            />
          </Route>

          <Route path="/TestMain" element={<TestMain />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
