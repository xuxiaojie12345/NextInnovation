import React from "react";
import { Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import PrivateRoute from "./PrivateRoute";
import Menu from "./Menu/Menu";
import GenerateHomologationDoc from "./GenerateHomologationDoc/GenerateHomologationDoc";
import GenerateDocumentResult from "./GenerateDocumentResult/GenerateDocumentResult";
import HomologationVariables from "./HomologationVariables/HomologationVariables";
import HomologationVariablesResultList from "./HomologationVariablesResultList/HomologationVariablesResultList";
import ExistingHDocVariables from "./ExistingHDocVariables/ExistingHDocVariables";
import ExistingHDocVariablesResultList from "./ExistingHDocVariablesResultList/ExistingHDocVariablesResultList";
import UploadDeleteTemplate from "./UploadDeleteTemplate/UploadDeleteTemplate";
import HDocTemplateCheck from "./HDocTemplateCheck/HDocTemplateCheck";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import SaveModifications from "./SaveModifications/SaveModifications";
import VehicleSpecification from "./VehicleSpecification/VehicleSpecification";
import UserGuide from "./UserGuide/UserGuide";
import AdCaChange from "./AdCaChange/AdCaChange";
import VinPlate from "./VinPlate/VinPlate";
import ListAvailableTemplates from "./ListAvailableTemplates/ListAvailableTemplates";
import DocumentTypes from "./DocumentTypes/DocumentTypes";
import MarketsInHDoc from "./MarketsInHDoc/MarketsInHDoc";
import MarketDocumentSettingsList from "./MarketDocumentSettingsList/MarketDocumentSettingsList";
import MarketDocumentSettingsResultList from "./MarketDocumentSettingsResultList/MarketDocumentSettingsResultList";
import DownloadAndPrintQuickGuides from "./DownloadAndPrintQuickGuides/DownloadAndPrintQuickGuides";
import SearchUser from "./SearchUser/SearchUser";
import HDocUserAdministration from "./HDocUserAdministration/HDocUserAdministration";
import HDocUserDocAdministration from "./HDocUserDocAdministration/HDocUserDocAdministration";
import EDBUserView from "./EDBUserView/EDBUserView";
import "./App.css";
import "./common/css/common.css";

// 根组件：定义所有路由
const App: React.FC = () => {
  return (
    <div className="App">
      <Routes>
        {/* 登录页 */}
        <Route path="/login" element={<Login />} />
        {/* 主菜单（需登录） */}
        <Route
          path="/menu"
          element={
            <PrivateRoute>
              <Menu />
            </PrivateRoute>
          }
        >
          <Route path="generate-doc" element={<GenerateHomologationDoc />} />
          <Route
            path="generate-document/result"
            element={<GenerateDocumentResult />}
          />
          <Route
            path="homologation-variables"
            element={<HomologationVariables />}
          />
          <Route
            path="homologation-variables/result"
            element={<HomologationVariablesResultList />}
          />
          <Route
            path="existing-hdoc-vars"
            element={<ExistingHDocVariables />}
          />
          <Route
            path="existing-hdoc-vars/result"
            element={<ExistingHDocVariablesResultList />}
          />
          <Route
            path="upload-delete-template"
            element={<UploadDeleteTemplate />}
          />
          <Route path="hdoc-template-check" element={<HDocTemplateCheck />} />
          <Route path="modify-document" element={<ModifyDocument />} />
          <Route path="save-modifications" element={<SaveModifications />} />
          <Route
            path="vehicle-specification"
            element={<VehicleSpecification />}
          />
          <Route path="guide-user" element={<UserGuide />} />
          <Route path="ad-ca-change" element={<AdCaChange />} />
          <Route path="vin-plate" element={<VinPlate />} />
          <Route path="list-templates" element={<ListAvailableTemplates />} />
          <Route path="document-types" element={<DocumentTypes />} />
          <Route path="markets-in-hdoc" element={<MarketsInHDoc />} />
          <Route
            path="market-document-setting"
            element={<MarketDocumentSettingsList />}
          />
          <Route
            path="market-document-setting/result"
            element={<MarketDocumentSettingsResultList />}
          />
          <Route
            path="quick-guides"
            element={<DownloadAndPrintQuickGuides />}
          />
          <Route path="search-user" element={<SearchUser />} />
          <Route path="hdoc-user-admin" element={<HDocUserAdministration />} />
          <Route
            path="hdoc-user-doc-admin"
            element={<HDocUserDocAdministration />}
          />
          <Route path="edb-user-view" element={<EDBUserView />} />
          {/* 未匹配的子路由显示 404 提示 */}
          <Route
            path="*"
            element={
              <div style={{ padding: 20, color: '#333', fontSize: 20, fontWeight: 'bold' }}>
                Page not found.
              </div>
            }
          />
        </Route>
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  );
};

export default App;
