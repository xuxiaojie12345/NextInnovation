package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.List;

/**
 * 文档类型选项查询响应数据传输对象
 * 对应【詳細設計UD03.md（Generate Homologation Document 模块）】
 * 测试用例 3：Document type 下拉列表显示来自 HDOC_DOCUMENT_LIST.DOCTYPE 的选项列表。
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateDocumentResponse implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** Document type 下拉列表选项集合 */
  private List<DocumentTypeOption> documentTypes;
}
