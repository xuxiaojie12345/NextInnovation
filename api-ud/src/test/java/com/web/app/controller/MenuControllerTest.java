package com.web.app.controller;

import com.web.app.dto.ApiCode;
import com.web.app.dto.ApiResult;
import com.web.app.dto.MenuItem;
import com.web.app.dto.MenuResponse;
import com.web.app.dto.MessageConstants;
import com.web.app.exception.GlobalExceptionHandler;
import com.web.app.service.MenuService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.Arrays;
import java.util.List;

import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.MatcherAssert.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * MenuController 单元测试
 * 验证 GET /api/menu/items/{userid} 的请求接收、HTTP 状态码与响应体结构
 * 与【详细设计UD02.md（Menu 模块）】的一致性。
 * 测试方法遵循 AAA（Arrange-Act-Assert）模式，各方法相互独立。
 *
 * @author GitHub Copilot
 */
@ExtendWith(MockitoExtension.class)
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class MenuControllerTest {

  /** MockMvc 对象，用于模拟 HTTP 请求 */
  private MockMvc mockMvc;

  /** 菜单服务 Mock 对象 */
  @Mock
  private MenuService menuService;

  /** 被测试的控制器，由 Mockito 注入上述 Mock 对象 */
  @InjectMocks
  private MenuController menuController;

  /** 测试用 UserID */
  private static final String VALID_USERID = "admin";

  /** 每个测试方法执行前的公共初始化：构建独立的 MockMvc 环境 */
  @BeforeEach
  void setUp() {
    org.mockito.Mockito.reset(menuService);
    mockMvc = MockMvcBuilders.standaloneSetup(menuController)
        // 注册全局异常处理器，验证 500 兜底逻辑
        .setControllerAdvice(new GlobalExceptionHandler())
        .setMessageConverters(new MappingJackson2HttpMessageConverter())
        .build();
  }

  /**
   * 构造菜单查询成功的响应体
   *
   * @return 成功响应体
   */
  private ApiResult<MenuResponse> buildSuccessResult() {
    List<MenuItem> items = Arrays.asList(
        new MenuItem("Generate", "Generate Doc", "/generate-document", "MENU_GENERATE"),
        new MenuItem("Documentation", "User Guide", "/user-guide", ""));
    MenuResponse response = new MenuResponse();
    response.setUserid(VALID_USERID);
    response.setItems(items);
    return ApiResult.success(response);
  }

  /**
   * 用例 1：菜单查询成功时返回 HTTP 200 与标准响应结构
   */
  @Test
  @DisplayName("接口测试：菜单查询成功返回 HTTP 200 与标准响应结构")
  void getMenuItems_success_returnsHttp200() throws Exception {
    // Arrange：Service 返回查询成功结果
    when(menuService.getMenuItems(anyString())).thenReturn(buildSuccessResult());

    // Act：发送 GET /api/menu/items/{userid}
    mockMvc.perform(get("/api/menu/items/{userid}", VALID_USERID))

        // Assert：HTTP 200，且响应体字段与详细设计保持一致
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.code", is(200)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SUCCESS)))
        .andExpect(jsonPath("$.data.userid", is(VALID_USERID)))
        .andExpect(jsonPath("$.data.items.length()", is(2)))
        .andExpect(jsonPath("$.data.items[0].label", is("Generate Doc")));
  }

  /**
   * 用例 2：用户不存在时返回 HTTP 401
   */
  @Test
  @DisplayName("接口测试：用户不存在返回 HTTP 401")
  void getMenuItems_userNotFound_returnsHttp401() throws Exception {
    // Arrange：Service 返回 401 失败结果
    when(menuService.getMenuItems(anyString()))
        .thenReturn(ApiResult.failure(ApiCode.INVALID_CREDENTIALS,
            MessageConstants.INVALID_CREDENTIALS));

    // Act & Assert：HTTP 401，data 为 null
    mockMvc.perform(get("/api/menu/items/{userid}", "nouser"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code", is(401)))
        .andExpect(jsonPath("$.data").doesNotExist());
  }

  /**
   * 用例 3：Service 抛出异常时由全局异常处理器返回 HTTP 500
   */
  @Test
  @DisplayName("接口测试：Service 异常时返回 HTTP 500 系统错误")
  void getMenuItems_serviceThrows_returnsHttp500() throws Exception {
    // Arrange：Service 抛出运行时异常
    when(menuService.getMenuItems(anyString()))
        .thenThrow(new RuntimeException("模拟系统异常"));

    // Act & Assert：HTTP 500 与系统错误消息
    mockMvc.perform(get("/api/menu/items/{userid}", VALID_USERID))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.code", is(500)))
        .andExpect(jsonPath("$.message", is(MessageConstants.SYSTEM_ERROR)));
  }

  /**
   * 用例 4：响应结构字段顺序为 code / data / message
   * （JSON 对象字段顺序不影响语义，此处验证三字段均存在）
   */
  @Test
  @DisplayName("接口测试：响应结构包含 code / data / message 三字段")
  void getMenuItems_responseStructureContainsAllFields() throws Exception {
    // Arrange
    when(menuService.getMenuItems(anyString())).thenReturn(buildSuccessResult());

    // Act
    String json = mockMvc.perform(get("/api/menu/items/{userid}", VALID_USERID))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    // Assert：三字段均出现
    assertThat(json.contains("\"code\""), is(true));
    assertThat(json.contains("\"data\""), is(true));
    assertThat(json.contains("\"message\""), is(true));
  }
}
