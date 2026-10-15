package com.web.app.mapper;

import com.web.app.entity.HdocDocumentList;

import java.util.List;

/**
 * 生成认证文档数据访问接口
 * 对应【詳細設計UD03.md（Generate Homologation Document 模块）】4. 接口定义
 * 与测试用例 3 的 Document type 下拉列表数据源。
 *
 * @author GitHub Copilot
 */
public interface GenerateDocumentMapper {

  /**
   * 查询文档类型下拉列表
   * SQL：SELECT DOCTYPE, DESCRIPTION FROM HDOC_DOCUMENT_LIST ORDER BY DOCTYPE
   * 对应【全体APIのプロンプト.txt】5.1 UD03SelectHdocdocumentlistApi 的查询语句。
   *
   * @return 文档类型列表；无数据时返回空列表
   */
  List<HdocDocumentList> selectHdocDocumentList();
}
