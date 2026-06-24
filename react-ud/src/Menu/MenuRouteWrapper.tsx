import React from 'react';
import { useParams } from 'react-router-dom';
import GenerateHomologationDocument from '../Generate Homologation Document/GenerateHomologationDocument';
import GenerateDocument from '../Generate document/GenerateDocument';
import ModifyDocument from '../Modify Document/ModifyDocument';
import VehicleSpecification from '../Vehicle Specification/VehicleSpecification';
import HDocUserDocAdministration from '../HDoc User Doc Administration/HDocUserDocAdministration';
import SearchUser from '../Search User/SearchUser';
import UserGuide from '../User Guide/UserGuide';
import './Menu.css';

function MenuRouteWrapper(): JSX.Element {
  const { childRoute } = useParams<{ childRoute: string }>();

  const routeComponentMap: Record<string, React.ComponentType> = {
    'generate-document': GenerateHomologationDocument,
    'generate-document-result': GenerateDocument,
    'modify-document': ModifyDocument,
    'vda-vehicle-specification': VehicleSpecification,
    'vin-plate': VehicleSpecification,
    'hdoc-user-doc-admin': HDocUserDocAdministration,
    'search-user': SearchUser,
    'user-guide': UserGuide
  };

  const ActiveComponent = childRoute ? routeComponentMap[childRoute] : null;

  if (ActiveComponent) {
    return <ActiveComponent />;
  }

  return (
    <div className="menu-route-wrapper">
      <h3>{childRoute ? '页面尚未实现' : '请选择左侧菜单项'}</h3>
      <p>
        {childRoute
          ? `当前路由 ${childRoute} 尚未映射到真实子页面组件。请使用可用的菜单项，或创建对应页面组件。`
          : '请选择左侧菜单中的一项，右侧区域将显示对应选中页面。'}
      </p>
    </div>
  );
}

export default MenuRouteWrapper;
