package com.web.app.service.impl;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.MenuItem;
import com.web.app.dto.MenuResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.AuthenticationMapper;
import com.web.app.service.MenuService;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 菜单服务实现类
 * 【详细设计UD02.md（Menu 模块）】3.1 处理流程的实现：
 * 1. userID 非空校验
 * 2. 查询用户信息 → 判断用户是否存在
 * 3. 查询用户功能权限
 * 4. 依据权限过滤菜单项（无 function 定义的菜单项对所有用户可见）
 * 5. 构建 "Welcome, {userID}" 所需数据
 *
 * @author GitHub Copilot
 */
@Service
public class MenuServiceImpl implements MenuService {

  /** 日志对象 */
  private static final Logger logger = LogManager.getLogger(MenuServiceImpl.class);

  /** 数据访问对象（复用认证模块的用户查询能力） */
  @Resource
  private AuthenticationMapper authenticationMapper;

  /**
   * 菜单项定义一览
   * 严格对应【详细设计UD02.md】2.1 控件 1〜12 的 12 个 Link，
   * function 为空表示该菜单项无需功能权限即可访问。
   */
  private static final List<MenuItem> MENU_ITEMS = Arrays.asList(
      new MenuItem("Generate", "Generate Doc", "/generate-document", "MENU_GENERATE"),
      new MenuItem("Admin", "Update user defined variables (rules)",
          "/homologation-variables", "RULE_ADMIN"),
      new MenuItem("Admin", "Existing HDoc variables", "/variables", "MANAGE_VARIABLE_LIST"),
      new MenuItem("Admin", "Upload/Delete template",
          "/upload-delete-template", "TEMPLATE_ADMIN"),
      new MenuItem("Admin", "List available templates",
          "/list-available-templates", "TEMPLATE_ADMIN"),
      new MenuItem("Admin", "VPPS Vin plate", "/vin-plate", "ADMIN"),
      new MenuItem("Admin", "AD/CA Change", "/ad-change", "ADMIN"),
      new MenuItem("User Administration", "HDoc User Administration",
          "/user-administration", "USER_ADMIN"),
      new MenuItem("User Administration", "HDoc User Doc Administration",
          "/user-doc-administration", "USER_ADMIN"),
      new MenuItem("User Administration", "Search User", "/search-user", "USER_ADMIN"),
      new MenuItem("User Administration", "Change Password", "/change-password", ""),
      new MenuItem("Documentation", "User Guide", "/user-guide", ""));

  /**
   * 查询指定登录用户可访问的菜单项
   *
   * @param userid 登录用户ID
   * @return 统一格式的菜单项列表响应
   */
  @Override
  public ApiResult<MenuResponse> getMenuItems(String userid) {
    // 步骤 1：userID 空值校验（详细设计 3.2：无校验，但安全性要求需拦截未登录访问）
    if (!StringUtils.hasText(userid)) {
      logger.warn("菜单查询失败：userID 为空");
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS);
    }

    // 步骤 2：查询用户信息，判断用户是否存在
    HdocUserInfor user = authenticationMapper.selectUserByUserid(userid.trim());
    if (user == null) {
      logger.warn("菜单查询失败：用户不存在, userid = {}", userid);
      return ApiResult.failure(ApiCode.INVALID_CREDENTIALS, MessageConstants.INVALID_CREDENTIALS);
    }

    // 步骤 3：查询用户功能权限，构建权限集合
    Set<String> functions = loadFunctions(user.getUserid());

    // 步骤 4：依据权限过滤菜单项（function 为空表示无需权限，所有用户可见）
    List<MenuItem> accessibleItems = new ArrayList<>();
    for (MenuItem item : MENU_ITEMS) {
      if (!StringUtils.hasText(item.getFunction()) || functions.contains(item.getFunction())) {
        accessibleItems.add(item);
      }
    }

    // 步骤 5：构建响应数据（含 userID，供 Welcome Message 使用）
    MenuResponse response = new MenuResponse();
    response.setUserid(user.getUserid());
    response.setItems(accessibleItems);

    logger.info("菜单查询成功, userid = {}, 菜单项数 = {}", user.getUserid(), accessibleItems.size());
    return ApiResult.success(response);
  }

  /**
   * 查询用户功能权限集合
   *
   * @param userid 用户ID
   * @return 功能权限名集合；无数据时返回空集合
   */
  private Set<String> loadFunctions(String userid) {
    Set<String> functions = new HashSet<>();
    List<HdocFunctionAuth> authList = authenticationMapper.selectFunctionAuthByUserid(userid);
    if (authList != null) {
      for (HdocFunctionAuth auth : authList) {
        if (StringUtils.hasText(auth.getFunction())) {
          functions.add(auth.getFunction());
        }
      }
    }
    return functions;
  }
}
