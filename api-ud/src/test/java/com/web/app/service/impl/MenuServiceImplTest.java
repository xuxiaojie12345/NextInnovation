package com.web.app.service.impl;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.MenuItem;
import com.web.app.dto.MenuResponse;
import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.AuthenticationMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.CoreMatchers.notNullValue;
import static org.hamcrest.CoreMatchers.nullValue;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * MenuServiceImpl 单元测试
 * 严格对应【详细设计UD02.md（Menu 模块）】3.1 处理流程 / 3.2 校验详细规格表。
 * 测试用例采用 AAA（Arrange-Act-Assert）模式编写，各测试方法相互独立。
 *
 * @author GitHub Copilot
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MenuServiceImplTest {

  /** 被测试的服务实现类，由 Mockito 注入下方 Mock 对象 */
  @InjectMocks
  private MenuServiceImpl menuService;

  /** 数据访问层 Mock 对象 */
  @Mock
  private AuthenticationMapper authenticationMapper;

  /** 测试用有效 UserID */
  private static final String VALID_USERID = "admin";

  /** 菜单项总数（详细设计 2.1 控件 1〜12） */
  private static final int TOTAL_MENU_ITEM_COUNT = 12;

  /** 每个测试方法执行前的公共初始化 */
  @BeforeEach
  void setUp() {
    // 清空 Mock 调用记录，保证测试方法之间相互独立
    org.mockito.Mockito.reset(authenticationMapper);
  }

  /**
   * 构造用户信息实体
   *
   * @param userid   用户ID
   * @param username 用户名
   * @return 用户信息实体
   */
  private HdocUserInfor buildUser(String userid, String username) {
    HdocUserInfor user = new HdocUserInfor();
    user.setUserid(userid);
    user.setUsername(username);
    return user;
  }

  /**
   * 构造功能权限实体
   *
   * @param userid   用户ID
   * @param function 功能权限码
   * @return 功能权限实体
   */
  private HdocFunctionAuth buildFunctionAuth(String userid, String function) {
    HdocFunctionAuth auth = new HdocFunctionAuth();
    auth.setUserid(userid);
    auth.setFunction(function);
    return auth;
  }

  /* ===================== 正常场景（200） ===================== */

  /**
   * 校验 1：拥有全部权限的用户可获得全部菜单项
   */
  @Test
  @DisplayName("菜单查询成功：拥有全部权限的用户返回全部 12 个菜单项")
  void getMenuItems_AllPermissions_ReturnsAllItems() {
    // Arrange：用户存在且拥有全部功能权限
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "Administrator"));
    List<HdocFunctionAuth> authList = Arrays.asList(
        buildFunctionAuth(VALID_USERID, "MENU_GENERATE"),
        buildFunctionAuth(VALID_USERID, "RULE_ADMIN"),
        buildFunctionAuth(VALID_USERID, "MANAGE_VARIABLE_LIST"),
        buildFunctionAuth(VALID_USERID, "TEMPLATE_ADMIN"),
        buildFunctionAuth(VALID_USERID, "ADMIN"),
        buildFunctionAuth(VALID_USERID, "USER_ADMIN"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID)).thenReturn(authList);

    // Act：查询菜单项
    ApiResult<MenuResponse> result = menuService.getMenuItems(VALID_USERID);

    // Assert：返回 200 且包含全部菜单项
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getMessage(), is("success"));
    assertThat(result.getData(), is(notNullValue()));
    assertThat(result.getData().getUserid(), is(VALID_USERID));
    assertThat(result.getData().getItems().size(), is(TOTAL_MENU_ITEM_COUNT));
  }

  /**
   * 校验 2：无任何权限的用户仅获得无需权限的菜单项
   */
  @Test
  @DisplayName("菜单查询成功：无权限用户仅返回无需权限的菜单项")
  void getMenuItems_NoPermissions_ReturnsPublicItemsOnly() {
    // Arrange：用户存在但无功能权限
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "NormalUser"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID))
        .thenReturn(Collections.emptyList());

    // Act：查询菜单项
    ApiResult<MenuResponse> result = menuService.getMenuItems(VALID_USERID);

    // Assert：仅返回 function 为空的 2 个菜单项（Change Password / User Guide）
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    List<MenuItem> items = result.getData().getItems();
    assertThat(items.size(), is(2));
    items.forEach(item -> assertThat(item.getFunction(), is("")));
  }

  /**
   * 校验 3：部分权限的用户仅获得对应权限的菜单项
   */
  @Test
  @DisplayName("菜单查询成功：部分权限用户仅返回对应菜单项")
  void getMenuItems_PartialPermissions_ReturnsMatchedItems() {
    // Arrange：用户仅拥有 TEMPLATE_ADMIN 权限
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "TemplateAdmin"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID))
        .thenReturn(Collections.singletonList(
            buildFunctionAuth(VALID_USERID, "TEMPLATE_ADMIN")));

    // Act：查询菜单项
    ApiResult<MenuResponse> result = menuService.getMenuItems(VALID_USERID);

    // Assert：TEMPLATE_ADMIN 对应 2 项 + 无需权限的 2 项 = 4 项
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getData().getItems().size(), is(4));
  }

  /* ===================== 异常场景（401） ===================== */

  /**
   * 校验 4：userID 为空时返回 401，且不查询数据库
   */
  @Test
  @DisplayName("菜单查询失败：userID 为空时返回 401 且不访问数据库")
  void getMenuItems_EmptyUserid_Returns401() {
    // Act：传入空 userID
    ApiResult<MenuResponse> result = menuService.getMenuItems("");

    // Assert：返回 401，数据为空，且不调用 Mapper
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getData(), is(nullValue()));
    verify(authenticationMapper, never()).selectUserByUserid(anyString());
  }

  /**
   * 校验 5：userID 为 null 时返回 401
   */
  @Test
  @DisplayName("菜单查询失败：userID 为 null 时返回 401")
  void getMenuItems_NullUserid_Returns401() {
    // Act：传入 null
    ApiResult<MenuResponse> result = menuService.getMenuItems(null);

    // Assert：返回 401
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getData(), is(nullValue()));
  }

  /**
   * 校验 6：用户不存在时返回 401
   */
  @Test
  @DisplayName("菜单查询失败：用户不存在时返回 401")
  void getMenuItems_UserNotFound_Returns401() {
    // Arrange：查询结果为 null
    when(authenticationMapper.selectUserByUserid(VALID_USERID)).thenReturn(null);

    // Act：查询菜单项
    ApiResult<MenuResponse> result = menuService.getMenuItems(VALID_USERID);

    // Assert：返回 401，且不再查询权限
    assertThat(result.getCode(), is(ApiCode.INVALID_CREDENTIALS));
    assertThat(result.getData(), is(nullValue()));
    verify(authenticationMapper, never()).selectFunctionAuthByUserid(anyString());
  }

  /* ===================== 边界场景 ===================== */

  /**
   * 校验 7：userID 含首尾空格时执行 trim 后查询
   */
  @Test
  @DisplayName("菜单查询成功：userID 含首尾空格时 trim 后查询")
  void getMenuItems_TrimsUserid() {
    // Arrange：使用 trim 后的值命中桩
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "Administrator"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID))
        .thenReturn(Collections.emptyList());

    // Act：传入含空格的 userID
    ApiResult<MenuResponse> result = menuService.getMenuItems("  " + VALID_USERID + "  ");

    // Assert：以 trim 后的值调用 Mapper
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    verify(authenticationMapper, times(1)).selectUserByUserid(VALID_USERID);
  }

  /**
   * 校验 8：权限查询返回 null 时按无权限处理（不抛异常）
   */
  @Test
  @DisplayName("菜单查询成功：权限查询返回 null 时按无权限安全处理")
  void getMenuItems_NullAuthList_TreatedAsNoPermission() {
    // Arrange：用户存在但权限查询返回 null
    when(authenticationMapper.selectUserByUserid(VALID_USERID))
        .thenReturn(buildUser(VALID_USERID, "NormalUser"));
    when(authenticationMapper.selectFunctionAuthByUserid(VALID_USERID)).thenReturn(null);

    // Act：查询菜单项
    ApiResult<MenuResponse> result = menuService.getMenuItems(VALID_USERID);

    // Assert：正常返回，仅含无需权限的菜单项
    assertThat(result.getCode(), is(ApiCode.SUCCESS));
    assertThat(result.getData().getItems().size(), is(2));
  }
}
