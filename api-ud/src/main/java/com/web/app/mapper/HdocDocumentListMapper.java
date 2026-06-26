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
     * 删除用户所有FUNCTION_AUTH记录
     */
    int deleteAllFunctionAuth(@Param("userid") String userid);

    /**
     * 删除用户所有MARKET_AUTH记录
     */
    int deleteAllMarketAuth(@Param("userid") String userid);

    /**
     * 根据UserId查询用户是否存在
     */
    int countUserById(@Param("userid") String userid);

    // ==================== UD18 文档权限管理 ====================

    /**
     * 查询所有文档列表（只取DESCRIPTION）
     */
    List<Map<String, String>> selectDocumentList();

    /**
     * 查询用户文档权限
     */
    List<Map<String, String>> selectUserDocAuth(@Param("userid") String userid);

    /**
     * 删除用户指定文档权限
     */
    int deleteUserDocAuth(@Param("userid") String userid,
                          @Param("doctype") String doctype);

    /**
     * 删除用户所有文档权限
     */
    int deleteAllUserDocAuth(@Param("userid") String userid);

    /**
     * 插入用户文档权限
     */
    int insertUserDocAuth(@Param("userid") String userid,
                          @Param("doctype") String doctype,
                          @Param("registerUser") String registerUser,
                          @Param("registerProcess") String registerProcess,
                          @Param("updateUser") String updateUser,
                          @Param("updateProcess") String updateProcess);

    // ==================== UD19 用户搜索 ====================

    /**
     * 搜索用户（动态条件）
     */
    List<Map<String, Object>> searchUsers(@Param("userid") String userid,
                                          @Param("username") String username,
                                          @Param("functionCode") String functionCode,
                                          @Param("market") String market);

    // ==================== UD20 文档类型列表 ====================

    /**
     * 获取所有文档类型列表（含完整字段）
     * @return 文档类型列表（doctype, description, registerUser, registerDatetime）
     */
    List<Map<String, Object>> selectDocumentTypeList();

    // ==================== UD20-1 文档类型更新 ====================

    /**
     * 根据doctype统计记录数（判断是否存在）
     * @param doctype 文档类型
     * @return 记录数
     */
    int countByDoctype(@Param("doctype") String doctype);

    /**
     * 删除HDOC_DOCUMENT_LIST表记录
     * @param doctype 文档类型
     * @return 影响行数
     */
    int deleteHdocDocumentList(@Param("doctype") String doctype);

    /**
     * 插入HDOC_DOCUMENT_LIST表记录
     * @param doctype 文档类型
     * @param registerUser 注册用户
     * @param registerDatetime 注册日期
     * @param updateUser 更新用户
     * @param updateProcess 更新进程
     * @return 影响行数
     */
    int insertHdocDocumentList(@Param("doctype") String doctype,
                               @Param("registerUser") String registerUser,
                               @Param("registerDatetime") String registerDatetime,
                               @Param("updateUser") String updateUser,
                               @Param("updateProcess") String updateProcess);
}
