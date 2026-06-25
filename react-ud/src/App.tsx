import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import GenerateHomologationDocument from "./GenerateHomologationDocument/GenerateHomologationDocument";
import UploadDeleteTemplate from "./UploadDeleteTemplate/UploadDeleteTemplate";
import GenerateDocument from "./GenerateDocument/GenerateDocument";
import SaveModifications from "./SaveModifications/SaveModifications";
import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./HomologationVariablesResultList/HomologationVariablesResultList";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import ExistingHDocVariables from "./ExistingHDocVariables/ExistingHDocVariables";
import ExistingHDocVariablesResultList from "./ExistingHDocVariablesResultList/ExistingHDocVariablesResultList";
import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";
import EDBUserView from "./EDBUserView/EDBUserView";
import HDocTemplateCheck from "./HDocTemplateCheck/HDocTemplateCheck";
import ListTemplates from "./ListTemplates/ListTemplates";
import VinPlate from "./VinPlate/VinPlate";
import ADChange from "./ADChange/ADChange";
import HDocUserAdministration from "./HDocUserAdministration/HDocUserAdministration";
import HDocUserDocAdministration from "./HDocUserDocAdministration/HDocUserDocAdministration";
import SearchUser from "./SearchUser/SearchUser";
import MarketDocumentSettings from "./MarketDocumentSettings/MarketDocumentSettings";
import MarketDocumentSettingsList from "./MarketDocumentSettingsList/MarketDocumentSettingsList";
import HDocHelp from "./HDocHelp/HDocHelp";
import MarketsInHDoc from "./MarketsInHDoc/MarketsInHDoc";
import DocumentTypes from "./DocumentTypes/DocumentTypes";
import DownloadPrintQuickGuides from "./DownloadPrintQuickGuides/DownloadPrintQuickGuides";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            {/* Menu 使用嵌套路由，子页面通过 Outlet 在右侧内容区动态加载 */}
            <Route path='/Menu' element={<Menu />}>
              <Route path='GenerateHomologationDocument' element={<GenerateHomologationDocument />} />
              <Route path='GenerateDocument/:chassisNo?' element={<GenerateDocument />} />
              <Route path='HomologationVariables' element={<HomologationVariables />} />
              <Route path='HomologationVariables/Search' element={<HomologationVariablesResultList />} />
              <Route path='ModifyDocument' element={<ModifyDocument />} />
              <Route path='SaveModifications' element={<SaveModifications />} />
              <Route path='ExistingHDocVariables' element={<ExistingHDocVariables />} />
              <Route path='ExistingHDocVariables/Search' element={<ExistingHDocVariablesResultList />} />
              <Route path='UploadDeleteTemplate' element={<UploadDeleteTemplate />} />
              <Route path='VehicleSpecification' element={<VehicleSpecification />} />
              <Route path='EDBUserView' element={<EDBUserView />} />
              <Route path='HDocTemplateCheck' element={<HDocTemplateCheck />} />
              <Route path='ListTemplates' element={<ListTemplates />} />
              <Route path='VinPlate' element={<VinPlate />} />
              <Route path='ADCAChange' element={<ADChange />} />
              <Route path='HDocUserAdministration' element={<HDocUserAdministration />} />
              <Route path='HDocUserDocAdministration' element={<HDocUserDocAdministration />} />
              <Route path='SearchUser' element={<SearchUser />} />
              <Route path='MarketDocumentSettings' element={<MarketDocumentSettings />} />
              <Route path='MarketDocumentSettingsList' element={<MarketDocumentSettingsList />} />
              <Route path='UserGuide' element={<HDocHelp />} />
              <Route path='MarketsInHDoc' element={<MarketsInHDoc />} />
              <Route path='DocumentTypes' element={<DocumentTypes />} />
              <Route path='DownloadAndPrintQuickGuides' element={<DownloadPrintQuickGuides />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
