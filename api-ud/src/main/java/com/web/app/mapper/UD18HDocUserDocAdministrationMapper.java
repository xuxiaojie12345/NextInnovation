package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * UD18 用户文档权限管理数据访问层
 *
 * 功能说明：执行用户文档权限的查询、新增、删除操作
 * 对应全体API設計：UD18HDocUserDocAdministrationApi
 *
 * @author GitHub Copilot
 * @version 2.0
 * @date 2026-06-30
 */
@Mapper
public interface UD18HDocUserDocAdministrationMapper {

    /**
     * 5.36 - 检查用户是否在机能权限表中存在
     *
     * @param userId 用户ID
     * @return 记录数（>0表示存在）
     */
    Integer countFunctionAuthByUserId(@Param("userId") String userId);

    /**
     * 5.37 - 根据用户ID查询用户文档类型（doctype可选）
     *
     * @param userId  用户ID
     * @param doctype 文档类型（可为空，为空时返回所有）
     * @return 文档类型列表
     */
    List<Map<String, Object>> selectUserDocByUserId(@Param("userId") String userId, @Param("doctype") String doctype);

    /**
     * 5.38.1 - 插入用户文档权限
     *
     * @param userId          用户ID
     * @param doctype         文档类型
     * @param registerUser    登录用户
     * @param registerProcess 登录进程
     * @param updateUser      更新用户
     * @param updateProcess   更新进程
     * @return 影响行数
     */
    Integer insertUserDoc(@Param("userId") String userId, @Param("doctype") String doctype,
            @Param("registerUser") String registerUser, @Param("registerProcess") String registerProcess,
            @Param("updateUser") String updateUser, @Param("updateProcess") String updateProcess);

    /**
     * 5.38.2 - 删除用户文档权限
     *
     * @param userId  用户ID
     * @param doctype 文档类型
     * @return 影响行数
     */
    Integer deleteUserDoc(@Param("userId") String userId, @Param("doctype") String doctype);
}
