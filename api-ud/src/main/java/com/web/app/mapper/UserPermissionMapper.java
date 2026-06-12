package com.web.app.mapper;

import com.web.app.entity.HdocFunctionAuth;
import com.web.app.entity.HdocMarketAuth;
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
     * 查询用户功能权限和市场权限
     */
    List<Map<String, Object>> selectUserPermissions(@Param("userid") String userid);
    
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
