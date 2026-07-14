import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./UD01Login/UD01Login";
import TestMain from "./Test/Test";
import Menu from "./UD02Menu/UD02Menu";
import Layout from "./Layout/Layout";
import GenerateHomologationDocument from "./UD03GenerateHomologationDocument/UD03GenerateHomologationDocument";
import GenerateDocument from "./UD04GenerateDocument/UD04GenerateDocument";
import ModifyDocument from "./UD05ModifyDocument/UD05ModifyDocument";
import SaveModifications from "./UD06SaveModifications/SaveModifications";
import VehicleSpecification from "./UD07VehicleSpecification/VehicleSpecification";
import HomologationVariables from "./UD08HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./UD09HomologationVariablesResultList/HomologationVariablesResultList";
import HdocVariables from "./UD10ExistingHdocVariables/HdocVariables";
import HdocVariablesResultList from "./UD11ExistingHdocVariablesResultList/HdocVariablesResultList";
import UploadDeleteTemplate from "./UD12UploadDeleteTemplate/UploadDeleteTemplate";
import HdocTemplateCheck from "./UD13HdocTemplateCheck/HdocTemplateCheck";
import ListAvailableTemplates from "./UD14ListAvailableTemplates/ListAvailableTemplates";
import VinPlate from "./UD15VinPlate/VinPlate";
import ADChange from "./UD16ADChange/ADChange";
import HDocUserAdministration from "./UD17HDocUserAdministration/HDocUserAdministration";
import HDocUserDocAdministration from "./UD18HDocUserDocAdministration/HDocUserDocAdministration";
import SearchUser from "./UD19SearchUser/SearchUser";
import HDocHelp from "./UD24UserGuide/HDocHelp";
import DownloadAndPrintQuickGuides from "./DownloadAndPrintQuickGuides/UD23DlAndPrintQuickGuides";
import DocumentTypes from "./UD22DocumentTypes/DocumentTypes";
import MarketsInHdoc from "./UD21MarketsInHdoc/MarketsInHdoc";
import EdbUserView from "./UD25EdbUserView/EdbUserView";
import MarketDocumentSettings from "./UD20-1MarketDocumentSettings/MarketDocumentSettings";
import MarketDocumentSettingsList from "./UD20MarketDocumentSettingsList/MarketDocumentSettingsList";

function App() {
  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/TestMain" element={<TestMain />} />
            <Route path="/Menu" element={<Menu />} />
            <Route element={<Layout />}>
              <Route
                path="/generate-homologation-document"
                element={<GenerateHomologationDocument />}
              />
              <Route path="/generate-document" element={<GenerateDocument />} />
              <Route path="/modify-document" element={<ModifyDocument />} />
              <Route
                path="/save-modifications"
                element={<SaveModifications />}
              />
              <Route
                path="/vehicle-specification"
                element={<VehicleSpecification />}
              />
              <Route
                path="/homologation-variables"
                element={<HomologationVariables />}
              />
              <Route
                path="/homologation-variables-result-list"
                element={<HomologationVariablesResultList />}
              />
              <Route path="/hdoc-variables" element={<HdocVariables />} />
              <Route
                path="/hdoc-variables-result-list"
                element={<HdocVariablesResultList />}
              />
              <Route
                path="/upload-delete-template"
                element={<UploadDeleteTemplate />}
              />
              <Route
                path="/hdoc-template-check"
                element={<HdocTemplateCheck />}
              />
              <Route
                path="/list-available-templates"
                element={<ListAvailableTemplates />}
              />
              <Route path="/vin-plate" element={<VinPlate />} />
              <Route path="/ad-change" element={<ADChange />} />
              <Route
                path="/hdoc-user-administration"
                element={<HDocUserAdministration />}
              />
              <Route
                path="/hdoc-user-doc-administration"
                element={<HDocUserDocAdministration />}
              />
              <Route path="/search-user" element={<SearchUser />} />
              <Route path="/hdoc-help" element={<HDocHelp />} />
              <Route
                path="/DownloadAndPrintQuickGuides"
                element={<DownloadAndPrintQuickGuides />}
              />
              <Route path="/document-types" element={<DocumentTypes />} />
              <Route path="/markets-in-hdoc" element={<MarketsInHdoc />} />
              <Route
                path="/edb-user-view/:username"
                element={<EdbUserView />}
              />
              <Route
                path="/market-document-settings"
                element={<MarketDocumentSettings />}
              />
              <Route
                path="/market-document-settings-list"
                element={<MarketDocumentSettingsList />}
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
