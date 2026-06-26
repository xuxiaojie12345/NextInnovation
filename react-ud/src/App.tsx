import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import TestMain from "./Test/Test";
import UD01 from "./Login/UD01";
import UD03 from "./GenerateHomologationDocument​/UD03";
import UD04 from "./GenerateDocument/UD04";
import UD05 from "./ModifyDocument/UD05";
import UD06 from "./SaveModifications/UD06";
import UD07 from "./VehicleSpecification/UD07";
import UD08 from "./HomologationVariables/UD08";
import UD09 from "./HomologationVariablesResultList/UD09";
import UD10 from "./ExistingHDocVariables/UD10";
import UD11 from "./ExistingHDocVariablesResult List/UD11";
import UD12 from "./Upload&DeleteTemplate/UD12";
import UD13 from "./HDocTemplateCheck/UD13";
import UD14 from "./ListAvailableTemplates/UD14";
import UD15 from "./VinPlate/UD15";
import UD16 from "./ADChange/UD16";
import UD17 from "./HDocUserAdministration/UD17";
import UD18 from "./HDocUserDocAdministration/UD18";
import UD19 from "./SearchUser/UD19";
import UD20 from "./MarketDocumentSettingsList/UD20";
import UD20_1 from "./MarketDocumentSettingsList/UD20_1";
import UD21 from "./MarketsInHdoc/UD21";
import UD22 from "./DocumentTypes/UD22";
import UD23 from "./DownloadandPrintQuickGuides/UD23";
import UD24 from "./UserGuide/UD24";
import UD25 from "./EDBUserView/UD25";
import SidebarLayout from "./SidebarLayout";

function App() {
  return (
    <div className="App">
      <Router>
        <div>
          <Routes>
            <Route path="/" element={<Navigate to="/UD01" replace />} />
            <Route path="/TestMain" element={<TestMain />} />
            <Route path="/UD01" element={<UD01 />} />

            {/* UD02菜单作为侧边栏，其他页面作为子路由 */}
            <Route path="/UD02" element={<SidebarLayout />}>
              <Route index element={<></>} />
            </Route>
            <Route path="/UD03" element={<SidebarLayout />}>
              <Route index element={<UD03 />} />
            </Route>
            <Route path="/UD04" element={<SidebarLayout />}>
              <Route index element={<UD04 />} />
            </Route>
            <Route path="/UD05" element={<SidebarLayout />}>
              <Route index element={<UD05 />} />
            </Route>
            <Route path="/UD06" element={<SidebarLayout />}>
              <Route index element={<UD06 />} />
            </Route>
            <Route path="/UD07" element={<SidebarLayout />}>
              <Route index element={<UD07 />} />
            </Route>
            <Route path="/UD08" element={<SidebarLayout />}>
              <Route index element={<UD08 />} />
            </Route>
            <Route path="/UD09" element={<SidebarLayout />}>
              <Route index element={<UD09 />} />
            </Route>
            <Route path="/UD10" element={<SidebarLayout />}>
              <Route index element={<UD10 />} />
            </Route>
            <Route path="/UD11" element={<SidebarLayout />}>
              <Route index element={<UD11 />} />
            </Route>
            <Route path="/UD12" element={<SidebarLayout />}>
              <Route index element={<UD12 />} />
            </Route>
            <Route path="/UD13" element={<SidebarLayout />}>
              <Route index element={<UD13 />} />
            </Route>
            <Route path="/UD14" element={<SidebarLayout />}>
              <Route index element={<UD14 />} />
            </Route>
            <Route path="/UD15" element={<SidebarLayout />}>
              <Route index element={<UD15 />} />
            </Route>
            <Route path="/UD16" element={<SidebarLayout />}>
              <Route index element={<UD16 />} />
            </Route>
            <Route path="/UD17" element={<SidebarLayout />}>
              <Route index element={<UD17 />} />
            </Route>
            <Route path="/UD18" element={<SidebarLayout />}>
              <Route index element={<UD18 />} />
            </Route>
            <Route path="/UD19" element={<SidebarLayout />}>
              <Route index element={<UD19 />} />
            </Route>
            <Route path="/UD20" element={<SidebarLayout />}>
              <Route index element={<UD20 />} />
            </Route>
            <Route path="/UD20-1" element={<SidebarLayout />}>
              <Route index element={<UD20_1 />} />
            </Route>
            <Route path="/UD21" element={<SidebarLayout />}>
              <Route index element={<UD21 />} />
            </Route>
            <Route path="/UD22" element={<SidebarLayout />}>
              <Route index element={<UD22 />} />
            </Route>
            <Route path="/UD23" element={<SidebarLayout />}>
              <Route index element={<UD23 />} />
            </Route>
            <Route path="/UD24" element={<SidebarLayout />}>
              <Route index element={<UD24 />} />
            </Route>
            <Route path="/UD25" element={<SidebarLayout />}>
              <Route index element={<UD25 />} />
            </Route>
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
