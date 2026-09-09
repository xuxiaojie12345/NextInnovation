import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import Menu from "./Menu/Menu";
import GenerateDocument from "./GenerateDocument/GenerateDocument";
import ModifyDocument from "./ModifyDocument/ModifyDocument";
import Help from "./Help/Help";

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />
            {/* GenerateDoc Submit 迁移目标画面（内部設計 4.2）：完整的 GenerateDocument 画面 */}
            <Route path='/GenerateDocument' element={<GenerateDocument />} />
            {/* GenerateDocument 画面 [Modify Doc Link] 迁移目标画面 */}
            <Route path='/ModifyDocument' element={<ModifyDocument />} />
            {/* GenerateDoc Help 迁移目标画面（内部設計 4.4） */}
            <Route path='/Help' element={<Help />} />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;