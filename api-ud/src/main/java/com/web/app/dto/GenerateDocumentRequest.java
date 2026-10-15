package com.web.app.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;

/**
 * 生成认证文档条件请求数据传输对象
 * 对应【詳細設計UD03.md（Generate Homologation Document 模块）】2.1 控件 1〜3：
 * Chassis series（最大 5 位半角英字）、Chassis no（最大 10 位半角数字）、
 * Document type（下拉选择值）。
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenerateDocumentRequest implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** Chassis series（最大 5 位半角英字） */
  private String chassisSeries;

  /** Chassis no（最大 10 位半角数字） */
  private String chassisNo;

  /** Document type（HDOC_DOCUMENT_LIST.DOCTYPE 的取值） */
  private String documentType;

  /** 登录用户ID（Submit 时传递到后续画面，用于操作履历登记） */
  private String userid;
}
