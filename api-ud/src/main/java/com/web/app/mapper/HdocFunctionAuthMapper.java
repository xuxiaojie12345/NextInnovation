package com.web.app.mapper;

import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * HDOC_FUNCTION_AUTH Mapper接口
 * 提供用户功能权限的查询与更新操作
 */
@Mapper
public interface HdocFunctionAuthMapper {

    /**
     * 查询用户功能权限
     *
     * @param userid 用户ID
     * @return 功能权限列表
     */
    @Select("SELECT FUNCTION FROM HDOC_FUNCTION_AUTH WHERE USERID = #{userid}")
    List<Map<String, Object>> selectByUserid(@Param("userid") String userid);

    /**
     * 更新用户功能权限
     *
     * @param userid    用户ID
     * @param function  功能
     * @return 影响行数
     */
    @Update("UPDATE HDOC_FUNCTION_AUTH SET FUNCTION = #{function} WHERE USERID = #{userid}")
    int updateFunction(@Param("userid") String userid, @Param("function") String function);

    /**
     * 清空用户功能权限
     *
     * @param userid 用户ID
     * @return 影响行数
     */
    @Update("UPDATE HDOC_FUNCTION_AUTH SET FUNCTION = '' WHERE USERID = #{userid}")
    int clearFunction(@Param("userid") String userid);
}
