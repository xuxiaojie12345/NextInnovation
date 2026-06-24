package com.web.app.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * UD10 HDOC变量管理数据访问层
 *
 * 功能说明：执行HDOC变量的增删改操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD10HdocvariablesMapper {

    /**
     * 检查变量是否存在
     *
     * @param variable 变量名
     * @return 记录数
     */
    Integer countByVariable(@Param("variable") String variable);

    /**
     * 插入新变量
     *
     * @param variable     变量名
     * @param type         类型
     * @param description  描述
     * @param userid       用户ID
     * @param registerUser 注册用户
     * @param updateUser   更新用户
     * @return 影响行数
     */
    Integer insertVariable(@Param("variable") String variable,
            @Param("type") String type,
            @Param("description") String description,
            @Param("userid") String userid,
            @Param("registerUser") String registerUser,
            @Param("updateUser") String updateUser);

    /**
     * 更新变量
     *
     * @param variable    变量名
     * @param type        类型
     * @param description 描述
     * @param updateUser  更新用户
     * @return 影响行数
     */
    Integer updateVariable(@Param("variable") String variable,
            @Param("type") String type,
            @Param("description") String description,
            @Param("updateUser") String updateUser);

    /**
     * 删除变量
     *
     * @param variable 变量名
     * @return 影响行数
     */
    Integer deleteVariable(@Param("variable") String variable);
}
