import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import MenuLayout from "./Menu/MenuLayout";
import HDoc from "./Generate/HDoc";
import GenerateDoc from "./Generate/GenerateDoc";
import ModifyDocument from "./Generate/ModifyDocument";
import SaveModifications from "./Generate/SaveModifications";
import VehicleSpecification from "./Generate/VehicleSpecification";
import HomologationVariables from "./Admin/HomologationVariables";

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
          </Route>

          <Route path="/TestMain" element={<TestMain />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
