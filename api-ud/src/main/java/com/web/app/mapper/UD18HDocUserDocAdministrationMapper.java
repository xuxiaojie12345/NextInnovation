package com.web.app.mapper;

import com.web.app.entity.HdocUserDoc;
import com.web.app.entity.HdocUserInfor;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD18 用户文档权限管理数据访问层
 *
 * 功能说明：执行用户文档权限的查询、更新操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD18HDocUserDocAdministrationMapper {

    /**
     * 检查用户是否在机能权限表中存在
     *
     * @param userId 用户ID
     * @return 记录数
     */
    Integer countFunctionAuthByUserId(@Param("userId") String userId);

    /**
     * 根据用户ID查询用户基本信息
     *
     * @param userId 用户ID
     * @return 用户信息实体
     */
    HdocUserInfor selectUserInfor(@Param("userId") String userId);

    /**
     * 根据用户ID查询用户文档类型
     *
     * @param userId 用户ID
     * @return 用户文档实体
     */
    HdocUserDoc selectUserDocByUserId(@Param("userId") String userId);

    /**
     * 更新用户文档类型
     *
     * @param userId  用户ID
     * @param doctype 文档类型
     * @return 影响行数
     */
    Integer updateUserDoc(@Param("userId") String userId, @Param("doctype") String doctype);
}
