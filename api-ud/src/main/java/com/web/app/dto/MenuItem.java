package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * 菜单项数据传输对象
 * 对应【详细设计UD02.md（Menu 模块）】2.1 画面参数定义中的控件 1〜12。
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MenuItem implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 分组名（Generate / Admin / User Administration / Documentation） */
  private String group;

  /** 项目显示名（控件 項目名） */
  private String label;

  /** 迁移目标路由路径 */
  private String path;

  /** 所需功能权限码（用于前端表示制御，为空表示无需权限） */
  private String function;
}
