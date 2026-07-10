package com.web.app.dto;

import lombok.Data;

/** User Guide 帮助链接 DTO */
@Data
public class UserGuideLink {
  /** 显示文本 */
  private String label;

  /** 内部路由路径 */
  private String path;

  /** 外部 URL */
  private String externalUrl;

  /** 是否可用 */
  private boolean enabled = true;

  /** 不可用时显示的 Tooltip */
  private String tooltip;
}
