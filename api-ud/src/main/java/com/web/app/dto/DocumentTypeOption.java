package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * 文档类型选项数据传输对象
 * 对应【詳細設計UD03.md（Generate Homologation Document 模块）】2.1 控件 3：
 * Document type 下拉列表的数据源，取自 HDOC_DOCUMENT_LIST.DOCTYPE 与 DESCRIPTION。
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentTypeOption implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 文档类型（对应 HDOC_DOCUMENT_LIST.DOCTYPE，作为下拉选项 value） */
  private String doctype;

  /** 文档类型描述（对应 HDOC_DOCUMENT_LIST.DESCRIPTION，作为下拉选项显示文案） */
  private String description;
}
