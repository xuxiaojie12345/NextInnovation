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
import UploadDeleteTemplate from "./UploadDeleteTemplate/UploadDeleteTemplate";
import HdocTemplateCheck from "./HdocTemplateCheck/HdocTemplateCheck";
import ListAvailableTemplates from "./ListAvailableTemplates/ListAvailableTemplates";
import VinPlate from "./VinPlate/VinPlate";
import ADChange from "./ADChange/ADChange";
import HDocUserAdministration from "./HDocUserAdministration/HDocUserAdministration";
import HDocUserDocAdministration from "./HDocUserDocAdministration/HDocUserDocAdministration";
import SearchUser from "./SearchUser/SearchUser";
import HDocHelp from "./HDocHelp/HDocHelp";
import DownloadAndPrintQuickGuides from "./DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides";
import DocumentTypes from "./DocumentTypes/DocumentTypes";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />
            <Route element={<Layout />}>
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
              <Route
                path='/upload-delete-template'
                element={<UploadDeleteTemplate />}
              />
              <Route
                path='/hdoc-template-check'
                element={<HdocTemplateCheck />}
              />
              <Route
                path='/list-available-templates'
                element={<ListAvailableTemplates />}
              />
              <Route
                path='/vin-plate'
                element={<VinPlate />}
              />
              <Route
                path='/ad-change'
                element={<ADChange />}
              />
              <Route
                path='/hdoc-user-administration'
                element={<HDocUserAdministration />}
              />
              <Route
                path='/hdoc-user-doc-administration'
                element={<HDocUserDocAdministration />}
              />
              <Route
                path='/search-user'
                element={<SearchUser />}
              />
              <Route
                path='/hdoc-help'
                element={<HDocHelp />}
              />
              <Route
                path='/DownloadAndPrintQuickGuides'
                element={<DownloadAndPrintQuickGuides />}
              />
              <Route
                path='/document-types'
                element={<DocumentTypes />}
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
