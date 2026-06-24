package com.web.app.mapper;

import com.web.app.dto.UD09DeleteHdocuserdefinedrulesRequest;
import com.web.app.entity.HdocUserDefinedRules;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD09 删除用户定义规则数据访问层
 *
 * 功能说明：执行用户定义规则的搜索和批量删除操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD09DeleteHdocuserdefinedrulesMapper {

    /**
     * 根据动态条件搜索用户定义规则
     *
     * @param request 搜索请求参数（所有字段可为空）
     * @return 用户定义规则列表
     */
    List<HdocUserDefinedRules> searchUserDefinedRules(UD09DeleteHdocuserdefinedrulesRequest request);

    /**
     * 根据PC+NUM+MARKET查询规则数量
     *
     * @param pc     PC代码
     * @param num    序号
     * @param market 市场
     * @return 记录数
     */
    Integer countUserDefinedRule(@Param("pc") String pc,
            @Param("num") Integer num,
            @Param("market") String market);

    /**
     * 根据PC+NUM+MARKET删除规则
     *
     * @param pc     PC代码
     * @param num    序号
     * @param market 市场
     * @return 影响行数
     */
    Integer deleteUserDefinedRule(@Param("pc") String pc,
            @Param("num") Integer num,
            @Param("market") String market);
}
