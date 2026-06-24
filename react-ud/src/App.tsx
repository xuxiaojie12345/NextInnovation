import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import UD01 from "./20260603/01/UD01";
import UD03 from "./20260603/03/UD03";
import UD04 from "./20260603/04/UD04";
import UD05 from "./20260603/05/UD05";
import UD06 from "./20260603/06/UD06";
import UD07 from "./20260603/07/UD07";
import UD08 from "./20260603/08/UD08";
import UD09 from "./20260603/09/UD09";
import UD10 from "./20260603/10/UD10";
import UD11 from "./20260603/11/UD11";
import UD12 from "./20260603/12/UD12";
import UD13 from "./20260603/13/UD13";
import UD14 from "./20260603/14/UD14";
import UD15 from "./20260603/15/UD15";
import UD16 from "./20260603/16/UD16";
import UD25 from "./20260603/25/UD25";
import SidebarLayout from "./20260603/SidebarLayout";

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
