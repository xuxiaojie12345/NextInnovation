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
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
