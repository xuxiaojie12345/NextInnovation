/**
 * API 使用示例
 * 
 * 本文件展示如何在 React 组件中使用后端 API
 */

import React, { useState, useEffect } from 'react';
import { 
  authApi, 
  documentApi, 
  userApi, 
  hdocVariablesApi,
  adcaApi,
  vinPlateApi,
  marketDocumentApi 
} from '../services/api';

// ============================================
// 示例 1: 用户登录
// ============================================
export const LoginExample = () => {
  const [userid, setUserid] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await authApi.login(userid, password);
      
      if (result.code === 200) {
        alert('登录成功！');
        // 保存用户信息
        localStorage.setItem('currentUser', JSON.stringify(result.data));
        // 跳转到首页
        window.location.href = '/Menu';
      } else {
        alert(`登录失败: ${result.msg}`);
      }
    } catch (error) {
      alert('网络错误，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        value={userid} 
        onChange={(e) => setUserid(e.target.value)}
        placeholder="UserID"
      />
      <input 
        type="password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? '登录中...' : '登录'}
      </button>
    </div>
  );
};

// ============================================
// 示例 2: 获取文档类型列表
// ============================================
export const DocumentTypesExample = () => {
  const [documentTypes, setDocumentTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocumentTypes();
  }, []);

  const loadDocumentTypes = async () => {
    setLoading(true);
    try {
      const response = await documentApi.getDocumentTypes();
      if (response.code === 200) {
        setDocumentTypes(response.data.documentTypes);
      }
    } catch (error) {
      console.error('加载文档类型失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>文档类型列表</h3>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {documentTypes.map((doc: any, index: number) => (
            <li key={index}>{doc.doctype} - {doc.description}</li>
          ))}
        </ul>
      )}
      <button onClick={loadDocumentTypes}>刷新</button>
    </div>
  );
};

// ============================================
// 示例 3: 查询用户信息
// ============================================
export const UserInfoExample = () => {
  const [userid, setUserid] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const searchUser = async () => {
    if (!userid) {
      alert('请输入用户ID');
      return;
    }

    setLoading(true);
    try {
      const response = await userApi.getUserInfo(userid);
      if (response.code === 200) {
        setUserInfo(response.data);
      } else {
        alert(response.msg);
      }
    } catch (error) {
      alert('查询失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="text" 
        value={userid} 
        onChange={(e) => setUserid(e.target.value)}
        placeholder="输入用户ID"
      />
      <button onClick={searchUser} disabled={loading}>
        {loading ? '查询中...' : '查询'}
      </button>
      
      {userInfo && (
        <div>
          <h4>用户信息</h4>
          <pre>{JSON.stringify(userInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

// ============================================
// 示例 4: HDoc 变量搜索
// ============================================
export const VariablesSearchExample = () => {
  const [searchParams, setSearchParams] = useState({
    variable: '',
    type: '',
    description: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await hdocVariablesApi.searchVariables(searchParams);
      if (response.code === 200) {
        setResults(response.data.variables);
      }
    } catch (error) {
      console.error('搜索失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>HDoc 变量搜索</h3>
      <input 
        placeholder="变量名"
        value={searchParams.variable}
        onChange={(e) => setSearchParams({...searchParams, variable: e.target.value})}
      />
      <input 
        placeholder="类型"
        value={searchParams.type}
        onChange={(e) => setSearchParams({...searchParams, type: e.target.value})}
      />
      <button onClick={handleSearch} disabled={loading}>
        {loading ? '搜索中...' : '搜索'}
      </button>
      
      <table>
        <thead>
          <tr>
            <th>变量名</th>
            <th>类型</th>
            <th>描述</th>
          </tr>
        </thead>
        <tbody>
          {results.map((item: any, index: number) => (
            <tr key={index}>
              <td>{item.variable}</td>
              <td>{item.type}</td>
              <td>{item.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ============================================
// 示例 5: VIN Plate 操作
// ============================================
export const VinPlateExample = () => {
  const [chassisNumber, setChassisNumber] = useState('');
  const [vinInfo, setVinInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 查看信息
  const viewInfo = async () => {
    setLoading(true);
    try {
      const response = await vinPlateApi.viewInfo(chassisNumber);
      if (response.code === 200) {
        setVinInfo(response.data);
      } else {
        alert(response.msg);
      }
    } catch (error) {
      alert('查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 设置为完成
  const setOk = async () => {
    if (!chassisNumber) return;
    
    try {
      const response = await vinPlateApi.setOk(chassisNumber);
      if (response.code === 200) {
        alert('设置成功');
        viewInfo(); // 刷新信息
      }
    } catch (error) {
      alert('操作失败');
    }
  };

  return (
    <div>
      <h3>VIN Plate 管理</h3>
      <input 
        placeholder="底盘号"
        value={chassisNumber}
        onChange={(e) => setChassisNumber(e.target.value)}
      />
      <button onClick={viewInfo} disabled={loading}>查看信息</button>
      <button onClick={setOk}>设置为完成</button>
      
      {vinInfo && (
        <div>
          <h4>VIN Plate 信息</h4>
          <p>状态: {vinInfo.status}</p>
          <p>类型: {vinInfo.type}</p>
          <p>消息: {vinInfo.message}</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// 示例 6: ADCA 变更管理
// ============================================
export const AdcaChangeExample = () => {
  const [serieChnr, setSerieChnr] = useState('');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);

  // 查询
  const selectAdca = async () => {
    setLoading(true);
    try {
      const response = await adcaApi.selectAdcaChange(serieChnr, desc);
      if (response.code === 200) {
        alert('查询成功');
        console.log(response.data);
      } else {
        alert(response.msg);
      }
    } catch (error) {
      alert('查询失败');
    } finally {
      setLoading(false);
    }
  };

  // 新增
  const insertAdca = async () => {
    setLoading(true);
    try {
      const response = await adcaApi.insertAdcaChange({
        serie_chnr: serieChnr,
        desc: desc,
        reason: '测试原因',
        user: 'admin'
      });
      
      if (response.code === 200) {
        alert('新增成功');
      } else {
        alert(response.msg);
      }
    } catch (error) {
      alert('新增失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>ADCA 变更管理</h3>
      <input 
        placeholder="Serie-Chnr"
        value={serieChnr}
        onChange={(e) => setSerieChnr(e.target.value)}
      />
      <input 
        placeholder="描述"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
      />
      <button onClick={selectAdca} disabled={loading}>查询</button>
      <button onClick={insertAdca} disabled={loading}>新增</button>
    </div>
  );
};

// ============================================
// 示例 7: 市场文档设置
// ============================================
export const MarketDocumentExample = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await marketDocumentApi.getDocumentList();
      if (response.code === 200) {
        setDocuments(response.data.documents);
      }
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h3>市场文档设置</h3>
      {loading ? (
        <p>加载中...</p>
      ) : (
        <ul>
          {documents.map((doc: any, index: number) => (
            <li key={index}>
              {doc.doctype} - {doc.description}
              <br/>
              <small>
                用户: {doc.registerUser}, 
                时间: {doc.registerDatetime}
              </small>
            </li>
          ))}
        </ul>
      )}
      <button onClick={loadDocuments}>刷新</button>
    </div>
  );
};

export default {
  LoginExample,
  DocumentTypesExample,
  UserInfoExample,
  VariablesSearchExample,
  VinPlateExample,
  AdcaChangeExample,
  MarketDocumentExample
};
