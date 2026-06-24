import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import MenuChildPlaceholder from "./Menu/MenuChildPlaceholder";
import MenuRouteWrapper from "./Menu/MenuRouteWrapper";
import GenerateHomologationDocument from "./Generate Homologation Document/GenerateHomologationDocument";
import GenerateDocument from "./Generate document/GenerateDocument";
import SaveModifications from "./Save Modifications/SaveModifications";
import ModifyDocument from "./Modify Document/ModifyDocument";
import VehicleSpecification from "./Vehicle Specification/VehicleSpecification";
import HDocUserDocAdministration from "./HDoc User Doc Administration/HDocUserDocAdministration";
import SearchUser from "./Search User/SearchUser";
import UserGuide from './User Guide/UserGuide';
import DownloadPrintQuickGuides from './Download and Print Quick Guides/DownloadPrintQuickGuides';

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />}>
              <Route index element={<MenuChildPlaceholder />} />
              <Route path=':childRoute' element={<MenuRouteWrapper />} />
            </Route>
            <Route path='/GenerateHomologationDocument' element={<GenerateHomologationDocument />} />
            <Route path='/generate-document' element={<GenerateDocument />} />
            <Route path='/SaveModifications' element={<SaveModifications />} />
            <Route path='/ModifyDocument' element={<ModifyDocument />} />
            <Route path='/VehicleSpecification' element={<VehicleSpecification />} />
            <Route path='/HDocUserDocAdministration' element={<HDocUserDocAdministration />} />
            <Route path='/SearchUser' element={<SearchUser />} />
            <Route path='/user-guide' element={<UserGuide />} />
            <Route path='/DownloadPrintQuickGuides' element={<DownloadPrintQuickGuides />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;