/* eslint-disable react/jsx-pascal-case */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login/Login";
import TestMain from "./Test/Test";
import AppLayout from "./AppLayout";
import UD03_GenerateHomologationDocument from './UD03_Generate Homologation Document/UD03_GenerateHomologationDocument';
import UD04_GenerateDocument from './UD04_Generate document/UD04_GenerateDocument';
import UD05_ModifyDocument from './UD05_Modify Document/UD05_ModifyDocument';
import UD06_SaveModifications from './UD06_Save Modifications/UD06_SaveModifications';
import UD07_VehicleSpecification from './UD07_Vehicle Specification/UD07_VehicleSpecification';
import UD24_UDHDoc from './UD24_UD HDoc/UD24_UDHDoc';
import UD08_HomologationVariables from './UD08_Homologation Variables/UD08_HomologationVariables';
import UD09_HomologationVariablesResultList from './UD09_Homologation Variables Result List/UD09_HomologationVariablesResultList';
import UD25_EDBUserView from './UD25_EDB User View/UD25_EDBUserView';
import UD10_ExistingHDocVariables from './UD10_Existing HDoc Variables/UD10_ExistingHDocVariables';
import UD11_ExistingHDocVariablesResultList from './UD11_Existing HDoc Variables Result List/UD11_ExistingHDocVariablesResultList';
import UD12_UploadDeleteTemplate from './UD12_UploadDeleteTemplate/UD12_UploadDeleteTemplate';
import UD13_HDocTemplateCheck from './UD13_HDocTemplateCheck/UD13_HDocTemplateCheck';
import UD14_ListAvailableTemplates from './UD14_List available templates/UD14_ListAvailableTemplates';
import UD15_VinPlate from './UD15_Vin Plate/UD15_VinPlate';
import UD16_ADChange from './UD16_AD Change/UD16_ADChange';

function App() {
  return (
    <div className='App'>
      <Router>
        <Routes>
          {/* 登录页面 - 不使用布局 */}
          <Route path='/' element={<Login />} />
          
          {/* 测试页面 - 不使用布局 */}
          <Route path='/TestMain' element={<TestMain />} />
          
          {/* 使用AppLayout布局的路由组 */}
          <Route element={<AppLayout />}>
            {/* Menu页面本身 */}
            <Route path='/Menu' element={<div style={{ padding: '20px' }}><h2>欢迎使用系统</h2><p>请从左侧菜单选择功能</p></div>} />
            
            {/* UD03 生成同质化认证文件 */}
            <Route path='/UD03' element={<UD03_GenerateHomologationDocument />} />
            
            {/* UD04 生成文档结果展示 */}
            <Route path='/UD04' element={<UD04_GenerateDocument />} />
            
            {/* UD05 修改文档 */}
            <Route path='/UD05' element={<UD05_ModifyDocument />} />

            {/* UD06 Save Modifications */}
            <Route path='/UD06' element={<UD06_SaveModifications />} />

            {/* UD07 Vehicle Specification */}
            <Route path='/UD07' element={<UD07_VehicleSpecification />} />
            
            {/* UD08 认证变量规则管理 */}
            <Route path='/UD08' element={<UD08_HomologationVariables />} />
            
            {/* UD09 认证变量规则检索结果列表 */}
            <Route path='/UD09' element={<UD09_HomologationVariablesResultList />} />
            
            {/* UD10 Existing HDoc Variables */}
            <Route path='/UD10' element={<UD10_ExistingHDocVariables />} />
            
            {/* UD11 Existing HDoc Variables Result List */}
            <Route path='/UD11' element={<UD11_ExistingHDocVariablesResultList />} />

            {/* UD12 上传删除模板 */}
            <Route path='/UD12' element={<UD12_UploadDeleteTemplate />} />

            {/* UD13 HDoc模板检查 */}
            <Route path='/UD13' element={<UD13_HDocTemplateCheck />} />

            {/* UD14 可用模板列表 */}
            <Route path='/UD14' element={<UD14_ListAvailableTemplates />} />

            {/* UD15 VIN Plate */}
            <Route path='/UD15' element={<UD15_VinPlate />} />

            {/* UD16 AD Change */}
            <Route path='/UD16' element={<UD16_ADChange />} />
            
            {/* UD24 用户指南 */}
            <Route path='/UD24' element={<UD24_UDHDoc />} />
            
            {/* UD25 EDB User View */}
            <Route path='/UD25' element={<UD25_EDBUserView />} />
            
            {/* 未来可以添加更多路由 */}
            {/* <Route path='/UD10' element={<UD10Component />} /> */}
            {/* <Route path='/UD12' element={<UD12Component />} /> */}
            {/* <Route path='/UD14' element={<UD14Component />} /> */}
            {/* <Route path='/UD15' element={<UD15Component />} /> */}
            {/* <Route path='/UD16' element={<UD16Component />} /> */}
            {/* <Route path='/UD17' element={<UD17Component />} /> */}
            {/* <Route path='/UD18' element={<UD18Component />} /> */}
            {/* <Route path='/UD19' element={<UD19Component />} /> */}
            {/* <Route path='/UD20' element={<UD20Component />} /> */}
            {/* <Route path='/UD21' element={<UD21Component />} /> */}
            {/* <Route path='/UD22' element={<UD22Component />} /> */}
            {/* <Route path='/UD23' element={<UD23Component />} /> */}
          </Route>
        </Routes>
      </Router>
    </div>
  );
}

export default App;
