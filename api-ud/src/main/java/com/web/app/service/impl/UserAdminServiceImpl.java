package com.web.app.service.impl;

import com.web.app.dto.response.*;
import com.web.app.dto.request.*;
import com.web.app.entity.*;
import com.web.app.exception.BusinessException;
import com.web.app.mapper.*;
import com.web.app.service.UserAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class UserAdminServiceImpl implements UserAdminService {

    // 权限名(角色) -> 唯一角色码（HDOC_FUNCTION_AUTH.FUNCTION）。业务上只能选中一个角色。
    private static final Map<String, String> ROLE_CODE = new LinkedHashMap<>();
    // 需要关联 Market（HDOC_MARKET_AUTH）的角色
    private static final Set<String> MARKET_ROLES = new HashSet<>();
    static {
        ROLE_CODE.put("standardUser", "hdoc_user_standard");
        ROLE_CODE.put("ruleAdmin", "hdoc_user_rule");
        ROLE_CODE.put("templateAdmin", "hdoc_user_template");
        ROLE_CODE.put("documentAuthAdmin", "hdoc_user_docadmin");
        ROLE_CODE.put("userAdmin", "hdoc_user_admin");
        ROLE_CODE.put("adaptationUser", "hdoc_user_adaptation");
        ROLE_CODE.put("manageVariableList", "hdoc_user_varlist");
        ROLE_CODE.put("marketSuperUser", "hdoc_user_super");
        MARKET_ROLES.add("ruleAdmin");
        MARKET_ROLES.add("templateAdmin");
        MARKET_ROLES.add("documentAuthAdmin");
        MARKET_ROLES.add("marketSuperUser");
    }

    @Autowired
    private HdocUserInfoMapper userInfoMapper;
    @Autowired
    private HdocFunctionAuthMapper hdocFunctionAuthMapper;
    @Autowired
    private HdocMarketAuthMapper hdocMarketAuthMapper;
    @Autowired
    private HdocUserDocMapper hdocUserDocMapper;

    @Override
    public UserInfoResponse getUserInfo(String userId) {
        HdocUserInfo user = userInfoMapper.selectByUserId(userId);
        if (user == null) {
            throw new BusinessException(404, "We didn't recognize the userid you entered. Please try again.");
        }
        List<HdocFunctionAuth> auths = hdocFunctionAuthMapper.selectByUserId(userId);
        Set<String> myCodes = auths.stream().map(HdocFunctionAuth::getFunction).collect(Collectors.toSet());
        // 读取该用户的 MARKET_AUTH（TYPE 为角色名）
        Map<String, String> marketByRole = new HashMap<>();
        for (HdocMarketAuth ma : hdocMarketAuthMapper.selectByUserId(userId)) {
            if (ma.getType() != null) {
                marketByRole.put(ma.getType(), ma.getMarket());
            }
        }
        String role = String.join(",", myCodes);
        UserInfoResponse resp = new UserInfoResponse();
        resp.setUserId(user.getUserid());
        resp.setUserName(user.getUsername());
        resp.setRole(role);
        resp.setEmail(user.getEmail());
        resp.setResponsible(user.getResponsible());
        resp.setUserPosition(user.getUserposition());

        Map<String, PermissionEntry> perms = new LinkedHashMap<>();
        for (String key : ROLE_CODE.keySet()) {
            String code = ROLE_CODE.get(key);
            // 唯一角色码：命中即 enabled（业务上只能选中一个，最多命中一个）
            boolean enabled = myCodes.contains(code);
            String mkt = marketByRole.get(key);
            perms.put(key, new PermissionEntry(enabled, mkt != null ? mkt : null));
        }
        resp.setPermissions(perms);
        return resp;
    }

    @Override
    @Transactional
    public void updateUserRole(String userId, Map<String, PermissionEntry> permissions) {
        if (permissions == null) {
            return;
        }
        // 1) 清空旧的 FUNCTION_AUTH 与 MARKET_AUTH
        hdocFunctionAuthMapper.deleteByUserId(userId);
        hdocMarketAuthMapper.deleteByUserId(userId);

        // 2) 仅收集启用的角色（业务上只能选中一个，通常至多一个）
        List<HdocFunctionAuth> auths = new ArrayList<>();
        List<HdocMarketAuth> markets = new ArrayList<>();
        for (Map.Entry<String, PermissionEntry> e : permissions.entrySet()) {
            if (e.getValue() == null || !e.getValue().isEnabled()) {
                continue;
            }
            String code = ROLE_CODE.get(e.getKey());
            if (code == null) {
                continue;
            }
            HdocFunctionAuth a = new HdocFunctionAuth();
            a.setUserid(userId);
            a.setFunction(code);
            auths.add(a);
            // 关联 market 的角色：写入 HDOC_MARKET_AUTH（TYPE=角色名, BU=BU1）
            if (MARKET_ROLES.contains(e.getKey()) && e.getValue().getMarket() != null
                    && !e.getValue().getMarket().trim().isEmpty()) {
                HdocMarketAuth ma = new HdocMarketAuth();
                ma.setUserid(userId);
                ma.setMarket(e.getValue().getMarket().trim());
                ma.setType(e.getKey());
                ma.setBu("BU1");
                markets.add(ma);
            }
        }

        // 3) 写 FUNCTION_AUTH / MARKET_AUTH
        if (!auths.isEmpty()) {
            hdocFunctionAuthMapper.insertBatch(auths);
        }
        if (!markets.isEmpty()) {
            hdocMarketAuthMapper.insertBatch(markets);
        }
    }

    @Override
    @Transactional
    public void deleteUserRole(String userId) {
        // 用户必须存在（Saviynt），否则无法删除角色
        HdocUserInfo user = userInfoMapper.selectByUserId(userId);
        if (user == null) {
            throw new BusinessException(404, "We didn't recognize the userid you entered. Please try again.");
        }
        hdocFunctionAuthMapper.deleteByUserId(userId);
        hdocMarketAuthMapper.deleteByUserId(userId);
    }

    @Override
    public HdocFunctionAuthResponse checkFunctionAuth(String userId) {
        int count = hdocFunctionAuthMapper.countByUserId(userId);
        HdocFunctionAuthResponse resp = new HdocFunctionAuthResponse();
        resp.setExists(count > 0);
        resp.setUserId(userId);
        return resp;
    }

    @Override
    public HdocUserDocResponse getUserDoc(String userId) {
        // 用户必须存在（Saviynt），否则无法查看文档权限
        HdocUserInfo user = userInfoMapper.selectByUserId(userId);
        if (user == null) {
            throw new BusinessException(404, "We didn't recognize the userid you entered. Please try again.");
        }
        List<HdocUserDoc> list = hdocUserDocMapper.selectByUserId(userId);
        List<String> doctypes = list.stream().map(HdocUserDoc::getDoctype).collect(Collectors.toList());
        HdocUserDocResponse resp = new HdocUserDocResponse();
        resp.setUserId(userId);
        resp.setUserName(user.getUsername());
        resp.setDoctypes(doctypes);
        return resp;
    }

    @Override
    @Transactional
    public void deleteUserDoc(String userId) {
        // 用户必须存在（Saviynt），否则无法删除文档权限
        HdocUserInfo user = userInfoMapper.selectByUserId(userId);
        if (user == null) {
            throw new BusinessException(404, "We didn't recognize the userid you entered. Please try again.");
        }
        hdocUserDocMapper.deleteByUserId(userId);
    }

    @Override
    @Transactional
    public void createUserDoc(String userId, List<String> doctypes) {
        // 用户必须存在（Saviynt），否则无法分配文档权限
        HdocUserInfo user = userInfoMapper.selectByUserId(userId);
        if (user == null) {
            throw new BusinessException(404, "We didn't recognize the userid you entered. Please try again.");
        }
        List<HdocUserDoc> list = doctypes.stream().map(d -> {
            HdocUserDoc doc = new HdocUserDoc();
            doc.setUserid(userId);
            doc.setDoctype(d);
            return doc;
        }).collect(Collectors.toList());
        if (!list.isEmpty()) {
            hdocUserDocMapper.insertBatch(list);
        }
    }

    @Override
    public SearchResultResponse<UserSearchRecord> searchHdocUsers(UD19SearchHdocRequest request) {
        List<HdocUserInfo> users = userInfoMapper.selectByCondition(
            request.getUserId(), request.getUserName(), request.getMarket());
        List<UserSearchRecord> records = users.stream().map(u -> {
            UserSearchRecord rec = new UserSearchRecord();
            rec.setUserId(u.getUserid());
            rec.setUserName(u.getUsername());
            rec.setMarket(u.getMarket());
            rec.setTotalCount(users.size());
            return rec;
        }).collect(Collectors.toList());
        return new SearchResultResponse<>(records.size(), records);
    }
}
