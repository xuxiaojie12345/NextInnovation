package com.web.app.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.io.Serializable;
import java.util.Date;

/**
 * 文档类型实体
 * 对应数据库表 HDOC_DOCUMENT_LIST（react_ud_sql.txt 定义），
 * 供【詳細設計UD03.md】2.1 控件 3 的 Document type 下拉列表数据源使用。
 *
 * @author GitHub Copilot
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HdocDocumentList implements Serializable {

  /** 序列化版本号 */
  private static final long serialVersionUID = 1L;

  /** 文档类型（主键） */
  private String doctype;

  /** 文档类型描述 */
  private String description;

  /** 注册时间 */
  private Date registerDatetime;

  /** 注册用户 */
  private String registerUser;

  /** 注册程序 */
  private String registerProcess;

  /** 更新时间 */
  private Date updateDatetime;

  /** 更新用户 */
  private String updateUser;

  /** 更新程序 */
  private String updateProcess;
}
