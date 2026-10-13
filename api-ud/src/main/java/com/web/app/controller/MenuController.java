package com.web.app.controller;

import com.web.app.dto.ApiResult;
import com.web.app.dto.MenuResponse;
import com.web.app.service.MenuService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;

/**
 * 菜单控制器
 * 对应【详细设计UD02.md（Menu 模块）】：
 * Menu 画面本身不发起业务请求（详细设计 4. 接口定义：无），
 * 但为确保「未登录/无权限用户不得访问菜单」的安全性要求，
 * 由本控制器提供菜单项与权限查询接口，供前端路由守卫与表示制御使用。
 *
 * @author GitHub Copilot
 */
@Api(tags = "菜单管理")
@RestController
@RequestMapping("/api/menu")
@CrossOrigin(origins = "*")
public class MenuController {

  /** 菜单服务 */
  @Resource
  private MenuService menuService;

  /**
   * 查询指定登录用户可访问的菜单项
   * 前端 Menu 画面加载时调用，根据返回结果控制各 Link 的表示与访问权限。
   *
   * @param userid 登录用户ID（路径参数）
   * @return 统一格式的菜单项列表响应；用户不存在时为 401/404
   */
  @ApiOperation("查询用户可访问的菜单项")
  @GetMapping("/items/{userid}")
  public ResponseEntity<ApiResult<MenuResponse>> getMenuItems(
      @PathVariable("userid") String userid) {
    ApiResult<MenuResponse> result = menuService.getMenuItems(userid);
    // 业务状态码与 HTTP 状态码保持一致，便于前端 axios 统一捕获 401 / 404 / 500
    return ResponseEntity.status(result.getCode()).body(result);
  }
}
