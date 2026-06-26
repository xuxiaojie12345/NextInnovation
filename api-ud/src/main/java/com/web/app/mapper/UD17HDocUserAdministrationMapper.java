package com.web.app.mapper;

import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD17 用户权限管理数据访问层
 *
 * 功能说明：执行用户机能权限和市场权限的查询、更新、删除操作
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD17HDocUserAdministrationMapper {

    /**
     * 根据用户ID查询机能权限和/or市场权限
     *
     * @param userid 用户ID
     * @return 机能权限列表
     */
    List<HdocFunctionAuth> selectFunctionAuthByUserid(@Param("userid") String userid);

    /**
     * 根据用户ID查询市场权限列表
     *
     * @param userid 用户ID
     * @return 市场权限列表
     */
    List<HdocMarketAuth> selectMarketAuthByUserid(@Param("userid") String userid);

    /**
     * 更新用户机能权限
     *
     * @param function 机能
     * @param userid   用户ID
     * @return 影响行数
     */
    Integer updateFunctionAuth(@Param("function") String function, @Param("userid") String userid);

    /**
     * 更新用户市场权限
     *
     * @param market 市场
     * @param type   类型
     * @param userid 用户ID
     * @return 影响行数
     */
    Integer updateMarketAuth(@Param("market") String market, @Param("type") String type,
            @Param("userid") String userid);

    /**
     * 删除用户的机能权限和市场权限（关联删除）
     *
     * @param userid 用户ID
     * @return 影响行数
     */
    Integer deleteUserAuth(@Param("userid") String userid);
}
