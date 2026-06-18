package com.web.app.mapper;

import com.web.app.domain.Entity.MarketMaster;
import com.web.app.domain.Entity.UserInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

/**
 * UD03 / UD17 Mapper
 * 用于查询文档类型列表数据、用户信息、权限管理
 */
@Mapper
public interface HdocDocumentListMapper {
    
    /**
     * 查询所有文档类型
     * 
     * @return 文档类型列表
     */
    List<String> selectDoctypeList();

    // ==================== UD17 用户管理 ====================

    /**
     * 查询所有市场列表
     */
    List<MarketMaster> selectMarketList();

    /**
     * 根据UserId或UserName查询用户信息
     */
    UserInfo selectUserInfo(@Param("userid") String userid,
                            @Param("username") String username);

    /**
     * 查询用户功能权限
     */
    List<Map<String, String>> selectFunctionAuth(@Param("userid") String userid);

    /**
     * 查询用户市场权限
     */
    List<Map<String, String>> selectMarketAuth(@Param("userid") String userid);

    /**
     * 更新HDOC_MARKET_AUTH表
     */
    int updateMarketAuth(@Param("userid") String userid,
                         @Param("market") String market,
                         @Param("type") String type,
                         @Param("bu") String bu,
                         @Param("updateUser") String updateUser,
                         @Param("updateProcess") String updateProcess);

    /**
     * 更新HDOC_FUNCTION_AUTH表
     */
    int updateFunctionAuth(@Param("function") String function,
                           @Param("userid") String userid,
                           @Param("updateUser") String updateUser,
                           @Param("updateProcess") String updateProcess);

    /**
     * 删除HDOC_MARKET_AUTH表记录
     */
    int deleteMarketAuth(@Param("userid") String userid,
                         @Param("market") String market,
                         @Param("type") String type,
                         @Param("bu") String bu);

    /**
     * 删除HDOC_FUNCTION_AUTH表记录
     */
    int deleteFunctionAuth(@Param("function") String function,
                           @Param("userid") String userid);

    /**
     * 根据UserId查询用户是否存在
     */
    int countUserById(@Param("userid") String userid);
}
