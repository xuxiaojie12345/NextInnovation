package com.web.app.mapper;

import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

/**
 * HDOC_MARKET_AUTH Mapper接口
 * 提供用户市场权限的查询与更新操作
 */
@Mapper
public interface HdocMarketAuthMapper {

    /**
     * 查询用户市场权限（关联功能权限）
     *
     * @param userid 用户ID
     * @return 权限列表
     */
    @Select("SELECT FUNCTIONAUTH.FUNCTION, MARKETAUTH.MARKET " +
            "FROM HDOC_FUNCTION_AUTH FUNCTIONAUTH " +
            "LEFT JOIN HDOC_MARKET_AUTH MARKETAUTH " +
            "ON FUNCTIONAUTH.USERID = MARKETAUTH.USERID " +
            "AND FUNCTIONAUTH.FUNCTION = MARKETAUTH.TYPE " +
            "WHERE FUNCTIONAUTH.USERID = #{userid}")
    List<Map<String, Object>> selectPermissionsByUserid(@Param("userid") String userid);

    /**
     * 更新用户市场权限
     *
     * @param userid  用户ID
     * @param market  市场
     * @param type    权限类型
     * @return 影响行数
     */
    @Update("UPDATE HDOC_MARKET_AUTH SET MARKET = #{market} WHERE USERID = #{userid} AND TYPE = #{type}")
    int updateMarket(@Param("userid") String userid, @Param("market") String market, @Param("type") String type);

    /**
     * 清空用户市场权限
     *
     * @param userid 用户ID
     * @return 影响行数
     */
    @Update("UPDATE HDOC_MARKET_AUTH SET MARKET = '' WHERE USERID = #{userid}")
    int clearMarket(@Param("userid") String userid);
}
