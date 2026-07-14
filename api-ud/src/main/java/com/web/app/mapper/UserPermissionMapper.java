package com.web.app.mapper;

import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
import com.web.app.entity.MarketMaster;
import com.web.app.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;
import java.util.Map;

/**
 * 用户权限Mapper接口
 */
@Mapper
public interface UserPermissionMapper {
    
    /**
     * 检查用户是否存在
     */
    int countByUserId(@Param("userid") String userid);
    
    /**
     * 查询用户信息
     */
    User selectUserInfo(@Param("userid") String userid);
    
    /**
     * 查询市场列表（MARKET_MASTER）
     */
    List<MarketMaster> selectMarketList();
    
    /**
     * 查询用户功能权限
     */
    List<HdocFunctionAuth> selectFunctionAuthByUserId(@Param("userid") String userid);
    
    /**
     * 查询用户市场权限（根据功能权限过滤）
     */
    List<HdocMarketAuth> selectMarketAuthByUserId(@Param("userid") String userid);
    
    /**
     * 查询用户功能权限和市场权限（原有兼容方法）
     */
    List<Map<String, Object>> selectUserPermissions(@Param("userid") String userid);

    /**
     * UD19搜索：根据条件查询用户及市场信息
     */
    List<Map<String, Object>> searchHdocUsers(@Param("userid") String userid,
                                               @Param("user") String user,
                                               @Param("function") String function,
                                               @Param("markets") java.util.List<String> markets);
    
    /**
     * 删除用户功能权限
     */
    int deleteFunctionAuthByUser(@Param("userid") String userid);
    
    /**
     * 删除用户市场权限
     */
    int deleteMarketAuthByUser(@Param("userid") String userid);
    
    /**
     * 插入功能权限
     */
    int insertFunctionAuth(@Param("function") String function, 
                           @Param("userid") String userid, 
                           @Param("updateUser") String updateUser);
    
    /**
     * 插入市场权限
     */
    int insertMarketAuth(@Param("userid") String userid,
                         @Param("market") String market,
                         @Param("type") String type,
                         @Param("updateUser") String updateUser);
    
    /**
     * 更新用户功能权限
     */
    int updateFunctionAuth(@Param("userid") String userid, @Param("permissions") String permissions);
    
    /**
     * 更新用户市场权限
     */
    int updateMarketAuth(@Param("userid") String userid, @Param("market") String market, @Param("permissions") String permissions);
    
    /**
     * 清空用户功能权限
     */
    int clearFunctionAuth(@Param("userid") String userid);
    
    /**
     * 清空用户市场权限
     */
    int clearMarketAuth(@Param("userid") String userid);
}
