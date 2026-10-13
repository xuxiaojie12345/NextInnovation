package com.web.app.service;

import com.web.app.dto.ApiResult;
import com.web.app.dto.MenuResponse;

/**
 * 菜单服务接口
 * 对应【详细设计UD02.md（Menu 模块）】的业务逻辑层定义。
 *
 * @author GitHub Copilot
 */
public interface MenuService {

  /**
   * 查询指定登录用户可访问的菜单项
   * 业务逻辑：
   * 1. userID 非空校验
   * 2. 查询用户是否存在（不存在返回 401）
   * 3. 查询用户功能权限
   * 4. 依据权限过滤菜单项并构建响应
   *
   * @param userid 登录用户ID
   * @return 统一格式的菜单项列表响应
   */
  ApiResult<MenuResponse> getMenuItems(String userid);
}
