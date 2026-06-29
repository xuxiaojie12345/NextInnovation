import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TestMain from './Test/Test';
import Login from './Login/Login';
import Menu from './Menu/Menu';
import UD12UploadDeletetemplate from './Admin/UD12UploadDeletetemplate/UD12UploadDeletetemplate';

function App() {
  return (
    <div className='App'>
      <Router>
        <div>
          <Routes>
            <Route path='/' element={<Login />} />
            <Route path='/Login' element={<Login />} />
            <Route path='/TestMain' element={<TestMain />} />
            <Route path='/Menu' element={<Menu />} />
            <Route
              path='/UD12UploadDeletetemplate'
              element={<UD12UploadDeletetemplate />}
            />
          </Routes>
        </div>
      </Router>
    </div>
  );
}

export default App;
