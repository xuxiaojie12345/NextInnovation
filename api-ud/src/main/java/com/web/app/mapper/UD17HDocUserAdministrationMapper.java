package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * UD17 用户权限管理数据访问层
 *
 * 功能说明：执行用户权限的查询、删除、插入操作
 * 对应全体API設計プロンプト：UD17HDocUserAdministrationApi
 *
 * @author GitHub Copilot
 * @version 3.0
 * @date 2026-06-29
 */
@Mapper
public interface UD17HDocUserAdministrationMapper {

    // ==================== userinfo 查询 ====================

    /**
     * 从HDOC_USER_INFOR表获取用户名称（同时判断用户是否存在）
     * 对应全体API設計 5.32 查询语句1
     *
     * @param userid 用户ID
     * @return 用户名（null表示用户不存在）
     */
    String selectUserNameByUserid(@Param("userid") String userid);

    /**
     * 关联查询功能权限和市场权限
     * 对应全体API設計 5.32 查询语句2
     *
     * @param userid 用户ID
     * @return 功能权限+市场权限列表 [{functionAuths, market, type}, ...]
     */
    List<Map<String, Object>> selectAuthListByUserid(@Param("userid") String userid);

    // ==================== updaterole 先删除 ====================

    /**
     * 删除HDOC_FUNCTION_AUTH表所有记录
     *
     * @param userid 用户ID
     */
    void deleteFunctionAuthByUserid(@Param("userid") String userid);

    /**
     * 删除HDOC_MARKET_AUTH表所有记录
     *
     * @param userid 用户ID
     */
    void deleteMarketAuthByUserid(@Param("userid") String userid);

    // ==================== updaterole 后插入 ====================

    /**
     * 插入HDOC_FUNCTION_AUTH表
     * 对应全体API設計 5.33
     *
     * @param userid          用户ID
     * @param function        机能权限
     * @param registerUser    登录用户
     * @param registerProcess 登录进程
     * @param updateUser      更新用户
     * @param updateProcess   更新进程
     */
    void insertFunctionAuth(@Param("userid") String userid, @Param("function") String function,
            @Param("registerUser") String registerUser, @Param("registerProcess") String registerProcess,
            @Param("updateUser") String updateUser, @Param("updateProcess") String updateProcess);

    /**
     * 插入HDOC_MARKET_AUTH表（TYPE = #{function}, BU固定为"BU"）
     * 对应全体API設計 5.34
     *
     * @param userid          用户ID
     * @param market          市场
     * @param function        功能权限（作为TYPE字段）
     * @param registerUser    登录用户
     * @param registerProcess 登录进程
     * @param updateUser      更新用户
     * @param updateProcess   更新进程
     */
    void insertMarketAuth(@Param("userid") String userid, @Param("market") String market,
            @Param("function") String function,
            @Param("registerUser") String registerUser, @Param("registerProcess") String registerProcess,
            @Param("updateUser") String updateUser, @Param("updateProcess") String updateProcess);

    // ==================== deleteuser 删除 ====================

    /**
     * 单独删除HDOC_FUNCTION_AUTH表记录
     * 对应全体API設計 5.35 删除语句1
     *
     * @param userid 用户ID
     */
    void deleteUserFunctionAuth(@Param("userid") String userid);

    /**
     * 单独删除HDOC_MARKET_AUTH表记录
     * 对应全体API設計 5.35 删除语句2
     *
     * @param userid 用户ID
     */
    void deleteUserMarketAuth(@Param("userid") String userid);
}
