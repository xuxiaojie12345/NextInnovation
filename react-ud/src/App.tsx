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
import UploadDeleteTemplate from "./Upload&DeleteTemplate/UploadDeleteTemplate";
import HDocTemplateCheck from "./HDocTemplateCheck/HDocTemplateCheck";
import ListAvailableTemplates from "./ListAvailableTemplates/ListAvailableTemplates";
import VinPlate from "./VinPlate/VinPlate";
import HDocUserAdministration from "./HDocUserAdministration/HDocUserAdministration";
import HDocUserDocAdministration from "./HDocUserDocAdministration/HDocUserDocAdministration";
import EDBUserView from "./EDBUserView/EDBUserView";
import SearchUser from "./SearchUser/SearchUser";
import MarketDocumentSettingsList from "./MarketDocumentSettingsList/MarketDocumentSettingsList";
import DocumentTypes from "./DocumentTypes/DocumentTypes";
import MarketsInHDoc from "./MarketsInHDoc/MarketsInHDoc";
import ADChange from "./ADChange/ADChange";
import DownloadAndPrintQuickGuides from "./DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides";
import UserGuide from "./UserGuide/UserGuide";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/login' element={<Login />} />
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
            <Route path='/upload-delete-template' element={<UploadDeleteTemplate />} />
            <Route path='/hdoc-template-check' element={<HDocTemplateCheck />} />
            <Route path='/list-available-templates' element={<ListAvailableTemplates />} />
            <Route path='/vin-plate' element={<VinPlate />} />
            <Route path='/hdoc-user-administration' element={<HDocUserAdministration />} />
            <Route path='/hdoc-user-doc-administration' element={<HDocUserDocAdministration />} />
            <Route path='/edb-user-view' element={<EDBUserView />} />
            <Route path='/search-user' element={<SearchUser />} />
            <Route path='/market-document-settings-list' element={<MarketDocumentSettingsList />} />
            <Route path='/document-types' element={<DocumentTypes />} />
            <Route path='/markets-in-hdoc' element={<MarketsInHDoc />} />
            <Route path='/ad-change' element={<ADChange />} />
            <Route path='/download-and-print-quick-guides' element={<DownloadAndPrintQuickGuides />} />
            <Route path='/user-guide' element={<UserGuide />} />
            <Route path='/TestMain' element={<TestMain />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;