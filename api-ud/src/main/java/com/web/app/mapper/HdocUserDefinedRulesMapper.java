package com.web.app.mapper;

import com.web.app.domain.HdocUserDefinedRules;
import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * HDOC_USER_DEFINED_RULES Mapper接口
 * 提供用户定义规则（认证参数）的CRUD操作
 */
@Mapper
public interface HdocUserDefinedRulesMapper {

    /**
     * 根据主键查询记录数（存在性检查）
     *
     * @param pc     产品类别
     * @param num    编号
     * @param market 市场
     * @return 记录数
     */
    @Select("SELECT COUNT(1) FROM HDOC_USER_DEFINED_RULES WHERE PC = #{pc} AND NUM = #{num} AND MARKET = #{market}")
    int countByPrimaryKey(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);

    /**
     * 动态条件查询用户定义规则
     *
     * @param params 查询参数（支持pc, num, market, variable, val, vs, vs2, comments等条件）
     * @return 规则记录列表
     */
    List<Map<String, Object>> selectByConditions(Map<String, Object> params);

    /**
     * 新增用户定义规则
     *
     * @param rules 规则实体
     * @return 影响行数
     */
    int insertUserDefinedRule(HdocUserDefinedRules rules);

    /**
     * 根据主键更新用户定义规则
     *
     * @param rules 规则实体（包含更新字段）
     * @return 影响行数
     */
    int updateByPrimaryKey(HdocUserDefinedRules rules);

    /**
     * 根据主键删除用户定义规则
     *
     * @param pc     产品类别
     * @param num    编号
     * @param market 市场
     * @return 影响行数
     */
    @Delete("DELETE FROM HDOC_USER_DEFINED_RULES WHERE PC = #{pc} AND NUM = #{num} AND MARKET = #{market}")
    int deleteByPrimaryKey(@Param("pc") String pc, @Param("num") String num, @Param("market") String market);

    /**
     * 根据市场查询规则列表
     *
     * @param market 市场
     * @return 规则列表
     */
    @Select("SELECT VARIABLE FROM HDOC_USER_DEFINED_RULES WHERE MARKET = #{market}")
    List<Map<String, Object>> selectByMarket(@Param("market") String market);
}
