import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/components/Login";
import HdocMenu from "./HdocMenu/components/HdocMenu";
import HdocGenerateHomologationDocument from "./HdocGenerateHomologationDocument/components/HdocGenerateHomologationDocument";
import GeneratedDocument from "./GeneratedDocument/GeneratedDocument";
 import ModifyDocument from "./ModifyDocument/ModifyDocument";
 import SaveModifications from "./SaveModifications/SaveModifications";
 import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";
 import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./HomologationVariablesResultList/HomologationVariablesResultList";
import ExistingHdocVariables from "./ExistingHdocVariables/ExistingHdocVariables";
import ExistingHdocVariablesResultList from "./ExistingHdocVariablesResultList/ExistingHdocVariablesResultList";
import UploadDeleteTemplate from "./UploadDeleteTemplate/UploadDeleteTemplate";
import HdocTemplateCheck from "./HdocTemplateCheck/HdocTemplateCheck";
import ListAvailableTemplates from "./ListAvailableTemplates/ListAvailableTemplates";
import VinPlate from "./VinPlate/VinPlate";
import AdChange from "./AdChange/AdChange";
import HdocUserAdministration from "./HdocUserAdministration/HdocUserAdministration";
import HDocUserDocAdministration from "./HDocUserDocAdministration/HDocUserDocAdministration"; 
import SearchUser from "./SearchUser/SearchUser";
import HdocHelp from "./HdocHelp/HdocHelp";
import MarketDocumentSettings from "./MarketDocumentSettings/MarketDocumentSettings";
import MarketDocumentSettingsList from "./MarketDocumentSettingsList/MarketDocumentSettingsList";
import MarketsInHdoc from "./MarketsInHdoc/MarketsInHdoc";
import DocumentTypes from "./DocumentTypes/DocumentTypes";
import DownloadAndPrintQuickGuides from "./DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides";
import EdbUserView from "./EdbUserView/EdbUserView";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            
            {/* HdocMenu作为布局容器，内部包含Outlet */}
            <Route path='/HdocMenu' element={<HdocMenu />}>
              {/* HdocMenu的直接子路由 */}
              <Route path='HdocGenerateHomologationDocument' element={<HdocGenerateHomologationDocument />} ></Route>
                <Route path='GeneratedDocument' element={<GeneratedDocument />} />
             
              <Route path='ModifyDocument' element={<ModifyDocument />} />
              <Route path='SaveModifications' element={<SaveModifications />} />
              <Route path='VehicleSpecification' element={<VehicleSpecification />} />
              <Route path='HomologationVariables' element={<HomologationVariables />} />
              <Route path='HomologationVariablesResultList' element={<HomologationVariablesResultList />} />
              <Route path='ExistingHdocVariables' element={<ExistingHdocVariables />} />
              <Route path='ExistingHdocVariablesResultList' element={<ExistingHdocVariablesResultList />} />
              <Route path='UploadDeleteTemplate' element={<UploadDeleteTemplate />} />
              <Route path='HdocTemplateCheck' element={<HdocTemplateCheck />} />
              <Route path='ListAvailableTemplates' element={<ListAvailableTemplates />} />
              <Route path='VinPlate' element={<VinPlate />} />
              <Route path='AdChange' element={<AdChange />} />
              <Route path='HdocUserAdministration' element={<HdocUserAdministration />} />
              <Route path='HDocUserDocAdministration' element={<HDocUserDocAdministration />} />
              <Route path='SearchUser' element={<SearchUser />} />
              
              {/* HdocHelp及其子路由 */}
              
              <Route path='HdocHelp' element={<HdocHelp />}></Route>
                <Route path='DownloadAndPrintQuickGuides' element={<DownloadAndPrintQuickGuides />} />
            
              
              <Route path='MarketDocumentSettings' element={<MarketDocumentSettings />} />
              <Route path='MarketDocumentSettingsList' element={<MarketDocumentSettingsList />} />
              <Route path='MarketsInHdoc' element={<MarketsInHdoc />} />
              <Route path='DocumentTypes' element={<DocumentTypes />} /> 
              <Route path='EdbUserView' element={<EdbUserView />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
