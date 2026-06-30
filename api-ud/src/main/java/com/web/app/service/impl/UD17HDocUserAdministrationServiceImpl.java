package com.web.app.service.impl;

import com.web.app.dto.UD17HDocUserAdministrationRequest;
import com.web.app.dto.UD17HDocUserAdministrationResponse;
import com.web.app.mapper.UD17HDocUserAdministrationMapper;
import com.web.app.service.UD17HDocUserAdministrationService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * UD17 用户权限管理服务实现类
 *
 * 功能说明：实现用户权限查询、更新、删除的业务逻辑
 * 对应全体API設計プロンプト：UD17HDocUserAdministrationApi
 *
 * 变更履历：
 * - v3.0: userinfo判断表改为HDOC_USER_INFOR，updaterole改为先删后插，deleteuser改为独立DELETE
 *
 * @author GitHub Copilot
 * @version 3.0
 * @date 2026-06-29
 */
@Slf4j
@Service
public class UD17HDocUserAdministrationServiceImpl implements UD17HDocUserAdministrationService {

    @Autowired
    private UD17HDocUserAdministrationMapper ud17Mapper;

    // ==================== 常量 ====================
    private static final String REGISTER_PROCESS = "HDoc User Administration";
    private static final String UPDATE_PROCESS = "HDoc User Administration";

    /**
     * 将FUNCTION值（长名称）映射为MARKET_AUTH.TYPE的短代码
     * 对应全体API設計 SELECT查询中的CASE映射规则
     */
    private String mapFunctionToTypeCode(String function) {
        if (function == null)
            return null;
        switch (function) {
            case "USER":
                return "U";
            case "RULES":
                return "R";
            case "TEMPLATE":
                return "T";
            case "Document":
                return "D";
            case "User Administrator":
                return "A";
            case "ADAPTATION DOC":
                return "DOCMOD";
            case "market super user":
                return "MCSU";
            default:
                return function;
        }
    }

    @Override
    public UD17HDocUserAdministrationResponse userInfo(UD17HDocUserAdministrationRequest request) {
        log.info("开始UD17查询用户权限信息, userid: {}", request.getUserid());
        try {
            if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
                return UD17HDocUserAdministrationResponse.error("400", "用户ID不能为空");
            }

            String userid = request.getUserid().trim();

            // 步骤1: 先根据UserID查询用户HDOC_USER_INFOR表中是否存在
            // 对应全体API設計 4.1 - "先根据UserID查询用户HDOC_USER_INFOR表中是否存在"
            String userName = ud17Mapper.selectUserNameByUserid(userid);
            if (userName == null) {
                log.warn("UD17查询用户权限信息 - 用户不存在, userid: {}", userid);
                return UD17HDocUserAdministrationResponse.error("404", "用户不存在");
            }

            // 步骤2: 从HDOC_MARKET_AUTH获取市场权限信息（含type代码）
            // 对应全体API設計 5.32 查询语句2
            List<Map<String, Object>> authMapList = ud17Mapper.selectAuthListByUserid(userid);

            // 构建authList响应 - 格式：{ market, type, BU }
            List<UD17HDocUserAdministrationResponse.AuthItem> authList = new ArrayList<>();
            if (authMapList != null) {
                for (Map<String, Object> authMap : authMapList) {
                    String market = (String) authMap.get("market");
                    String type = (String) authMap.get("type");
                    String bu = (String) authMap.get("bu");
                    authList.add(new UD17HDocUserAdministrationResponse.AuthItem(market, type, bu));
                }
            }

            log.info("UD17查询用户权限信息成功, userName: {}", userName);
            return UD17HDocUserAdministrationResponse.success(userid, userName, authList);
        } catch (Exception e) {
            log.error("UD17查询用户权限信息失败", e);
            return UD17HDocUserAdministrationResponse.error("500", "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD17HDocUserAdministrationResponse updateRole(UD17HDocUserAdministrationRequest request) {
        log.info("开始UD17更新用户角色权限, userid: {}", request.getUserid());
        try {
            if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
                return UD17HDocUserAdministrationResponse.error("400", "用户ID不能为空");
            }

            String userid = request.getUserid().trim();

            // 检查用户是否存在于HDOC_USER_INFOR表
            String userName = ud17Mapper.selectUserNameByUserid(userid);
            if (userName == null) {
                log.warn("UD17更新用户角色权限 - 用户不存在, userid: {}", userid);
                return UD17HDocUserAdministrationResponse.error("404", "用户不存在");
            }

            // 对应全体API設計 4.2: 先删除HDOC_FUNCTION_AUTH和HDOC_MARKET_AUTH表中对应的数据
            ud17Mapper.deleteFunctionAuthByUserid(userid);
            ud17Mapper.deleteMarketAuthByUserid(userid);

            // 然后再插入新数据
            // 对应全体API設計 5.33, 5.34
            // functionAuths格式：[{ function: "Standard User", market: "-EU" }, ...]
            List<UD17HDocUserAdministrationRequest.FunctionAuthItem> authList = request.getFunctionAuths();
            log.info("UD17 functionAuths列表大小: {}", authList != null ? authList.size() : "null");
            if (authList != null && !authList.isEmpty()) {
                String registerUser = userid;
                String updateUser = userid;

                // 用于记录已插入HDOC_FUNCTION_AUTH的FUNCTION值，避免主键重复
                // 例如Manage Variable List和Market Super User都映射为"market super user"
                Set<String> insertedFunctions = new HashSet<>();

                int index = 0;
                for (UD17HDocUserAdministrationRequest.FunctionAuthItem item : authList) {
                    log.info("UD17插入第{}项: function={}, market={}",
                            ++index, item.getFunction(), item.getMarket());

                    // 插入机能权限 - 对应 5.33（跳过重复FUNCTION避免主键冲突）
                    if (!insertedFunctions.contains(item.getFunction())) {
                        ud17Mapper.insertFunctionAuth(
                                userid, item.getFunction(),
                                registerUser, REGISTER_PROCESS,
                                updateUser, UPDATE_PROCESS);
                        insertedFunctions.add(item.getFunction());
                        log.info("UD17 insertFunctionAuth成功: function={}", item.getFunction());
                    } else {
                        log.info("UD17 FUNCTION重复跳过insertFunctionAuth: function={}", item.getFunction());
                    }

                    // 插入市场权限 - 对应 5.34（market为空时不插入）
                    // HDOC_MARKET_AUTH.TYPE列长度有限，需将FUNCTION长名映射为短代码
                    if (item.getMarket() != null && !item.getMarket().isEmpty()) {
                        String typeCode = mapFunctionToTypeCode(item.getFunction());
                        ud17Mapper.insertMarketAuth(
                                userid, item.getMarket(), typeCode,
                                registerUser, REGISTER_PROCESS,
                                updateUser, UPDATE_PROCESS);
                        log.info("UD17 insertMarketAuth成功: market={}, function={}, typeCode={}",
                                item.getMarket(), item.getFunction(), typeCode);
                    } else {
                        log.info("UD17 market为空跳过insertMarketAuth: function={}", item.getFunction());
                    }
                }
            } else {
                log.warn("UD17 functionAuths为空，未执行任何插入操作");
            }

            log.info("UD17更新用户角色权限成功");
            return UD17HDocUserAdministrationResponse.updateSuccess("用户权限更新成功");
        } catch (Exception e) {
            log.error("UD17更新用户角色权限失败", e);
            return UD17HDocUserAdministrationResponse.error("500", "系统繁忙，请稍后重试");
        }
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public UD17HDocUserAdministrationResponse deleteUser(UD17HDocUserAdministrationRequest request) {
        log.info("开始UD17删除用户权限, userid: {}", request.getUserid());
        try {
            if (request.getUserid() == null || request.getUserid().trim().isEmpty()) {
                return UD17HDocUserAdministrationResponse.error("400", "用户ID不能为空");
            }

            String userid = request.getUserid().trim();

            // 检查用户是否存在于HDOC_USER_INFOR表
            String userName = ud17Mapper.selectUserNameByUserid(userid);
            if (userName == null) {
                log.warn("UD17删除用户权限 - 用户不存在, userid: {}", userid);
                return UD17HDocUserAdministrationResponse.error("404", "用户不存在");
            }

            // 对应全体API設計 5.35: 分别删除两个表的记录
            ud17Mapper.deleteUserFunctionAuth(userid);
            ud17Mapper.deleteUserMarketAuth(userid);

            log.info("UD17删除用户权限成功");
            return UD17HDocUserAdministrationResponse.updateSuccess("用户权限删除成功");
        } catch (Exception e) {
            log.error("UD17删除用户权限失败", e);
            return UD17HDocUserAdministrationResponse.error("500", "系统繁忙，请稍后重试");
        }
    }
}
