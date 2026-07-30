import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import GenerateHomologationDocument from "./GenerateHomologationDocument/GenerateHomologationDocument";
import GenerateDocument from "./GenerateDocument/GenerateDocument";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import SaveModifications from "./SaveModifications/SaveModifications";
import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";
import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./HomologationVariablesResultList/HomologationVariablesResultList";
import ExistingHDocVariables from "./ExistingHDocVariables/ExistingHDocVariables";
import ExistingHDocVariablesResultList from "./ExistingHDocVariablesResultList/ExistingHDocVariablesResultList";
import UploadDeletetemplate from "./Upload&Deletetemplate/Upload&Deletetemplate";
import HDocTemplateCheck from "./HDocTemplateCheck/HDocTemplateCheck";
import ListAvailableTemplates from "./ListAvailableTemplates/ListAvailableTemplates";
import VinPlate from "./VinPlate/VinPlate";
import ADChange from "./ADChange/ADChange";
import HDocUserAdministration from "./HDocUserAdministration/HDocUserAdministration";
import HDocUserDocAdministration from "./HDocUserDocAdministration/HDocUserDocAdministration";
import SearchUser from "./SearchUser/SearchUser";
import MarketDocumentSettingsList from "./MarketDocumentSettingsList/MarketDocumentSettingsList";
import MarketsInHDoc from "./MarketsInHDoc/MarketsInHDoc";
import DocumentTypes from "./DocumentTypes/DocumentTypes";
import DownloadAndPrintQuickGuides from "./DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides";
import UserGuide from "./UserGuide/UserGuide";
import UserView from "./UserView/UserView";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />
            <Route path='/GenerateHomologationDocument' element={<GenerateHomologationDocument />} />
            <Route path='/generate-document' element={<GenerateDocument />} />
            <Route path='/modify-document' element={<ModifyDocument />} />
            <Route path='/save-modifications' element={<SaveModifications />} />
            <Route path='/vda-vehicle-specification' element={<VehicleSpecification />} />
            <Route path='/homologation-variables' element={<HomologationVariables />} />
            <Route path='/homologation-variables-result-list' element={<HomologationVariablesResultList />} />
            <Route path='/existing-hdoc-variables' element={<ExistingHDocVariables />} />
            <Route path='/existing-hdoc-variables-result-list' element={<ExistingHDocVariablesResultList />} />
            <Route path='/upload-delete-template' element={<UploadDeletetemplate />} />
            <Route path='/hdoc-template-check' element={<HDocTemplateCheck />} />
            <Route path='/list-available-templates' element={<ListAvailableTemplates />} />
            <Route path='/vin-plate' element={<VinPlate />} />
            <Route path='/ad-change' element={<ADChange />} />
            <Route path='/hdoc-user-administration' element={<HDocUserAdministration />} />
            <Route path='/hdoc-user-doc-administration' element={<HDocUserDocAdministration />} />
            <Route path='/search-user' element={<SearchUser />} />
            <Route path='/market-document-settings-list' element={<MarketDocumentSettingsList />} />
            <Route path='/markets-in-hdoc' element={<MarketsInHDoc />} />
            <Route path='/document-types' element={<DocumentTypes />} />
            <Route path='/download-print-quick-guides' element={<DownloadAndPrintQuickGuides />} />
            <Route path='/user-guide' element={<UserGuide />} />
            <Route path='/edb-user-view' element={<UserView />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;