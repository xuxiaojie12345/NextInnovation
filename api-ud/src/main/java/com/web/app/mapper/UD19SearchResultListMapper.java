package com.web.app.mapper;

import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.entity.MarketMaster;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * UD19 用户搜索结果列表数据访问层
 *
 * 功能说明：执行市场列表查询和用户搜索查询
 *
 * @author GitHub Copilot
 * @version 1.0
 * @date 2026-06-24
 */
@Mapper
public interface UD19SearchResultListMapper {

    /**
     * 查询所有市场
     *
     * @return 市场列表
     */
    List<MarketMaster> selectAllMarket();

    /**
     * 动态条件搜索用户
     *
     * @param userId   用户ID
     * @param username 用户名
     * @param market   市场
     * @param type     类型
     * @return 用户数据列表
     */
    List<UD19SearchResultListResponse.UserData> searchUsers(
            @Param("userId") String userId,
            @Param("username") String username,
            @Param("market") String market,
            @Param("type") String type);
}
