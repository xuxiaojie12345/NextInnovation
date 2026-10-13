package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 菜单查询响应数据传输对象
 * 对应【详细设计UD02.md（Menu 模块）】的菜单项列表与欢迎信息。
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuResponse implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 登录用户ID（用于画面 Welcome Message 显示 "Welcome, {userID}"） */
  private String userid;

  /** 该用户可访问的菜单项列表 */
  private List<MenuItem> items;
}
