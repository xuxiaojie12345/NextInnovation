package com.web.app.mapper;

import com.web.app.entity.HdocDocumentList;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD20 市场文档设置数据访问层
 *
 * 功能说明：执行文档列表的查询操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD20MarketDocumentSettingsMapper {

    /**
     * 动态条件查询文档列表
     *
     * @param doctype          文档类型
     * @param registerUser     注册用户
     * @param registerDatetime 注册时间
     * @return 文档列表
     */
    List<HdocDocumentList> selectDocumentList(
            @Param("doctype") String doctype,
            @Param("registerUser") String registerUser,
            @Param("registerDatetime") String registerDatetime);
}
