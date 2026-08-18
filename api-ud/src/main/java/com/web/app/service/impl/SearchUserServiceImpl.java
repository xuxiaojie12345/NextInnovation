package com.web.app.service.impl;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Pattern;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.web.app.dto.MarketListResponse;
import com.web.app.dto.SearchUserRequest;
import com.web.app.dto.SearchUserResponse;
import com.web.app.dto.SearchUserResponse.UserSearchResult;
import com.web.app.entity.HdocUserInfor;
import com.web.app.mapper.MarketMapper;
import com.web.app.mapper.SearchUserMapper;
import com.web.app.service.SearchUserService;

/**
 * SearchUser 业务逻辑实现
 * 对应后端提示词 4. 处理流程（4.4～4.8）
 */
@Service
public class SearchUserServiceImpl implements SearchUserService {

    private static final Logger logger = LogManager.getLogger(SearchUserServiceImpl.class);

    /** 半角英数字校验正则（对应设计书 2.1 许容文字） */
    private static final Pattern ALPHANUMERIC_PATTERN = Pattern.compile("^[a-zA-Z0-9]*$");

    /** Userid 最大长度（设计书画面项目 No.1） */
    private static final int USERID_MAX_LENGTH = 10;

    /** User 最大长度（设计书画面项目 No.2） */
    private static final int USER_MAX_LENGTH = 32;

    /** 权限类型：Not set（检索全部用户，取消 function 条件） */
    private static final String FUNCTION_NOT_SET = "NOT_SET";

    /** 权限类型：Rule（Rule Admin 权限，取值以 HDOC_FUNCTION_AUTH.FUNCTION 实际存储为准） */
    private static final String FUNCTION_RULE_DB = "RULE_ADMIN";

    /** 权限类型：Template（Template Admin 权限，取值以 HDOC_FUNCTION_AUTH.FUNCTION 实际存储为准） */
    private static final String FUNCTION_TEMPLATE_DB = "TEMPLATE_ADMIN";

    @Autowired
    private SearchUserMapper searchUserMapper;

    @Autowired
    private MarketMapper marketMapper;

    @Override
    public SearchUserResponse searchUser(SearchUserRequest request) {
        // ---------- 4.4 请求参数合法性校验（长度、格式） ----------
        validateRequest(request);

        // 前置处理：去除首尾空格
        String serid = trimToEmpty(request.getSerid());
        String user = trimToEmpty(request.getUser());
        String market = trimToEmpty(request.getMarket());
        String function = mapFunctionValue(trimToEmpty(request.getFunction()));

        List<UserSearchResult> results;
        boolean hasMarketOrFunction = !market.isEmpty() || !function.isEmpty();

        if (!hasMarketOrFunction && (!serid.isEmpty() || !user.isEmpty())) {
            // ---------- 检索场景 (1)(2)：Userid / User 检索 ----------
            // 流程：先取得用户信息（等价 AuthenticationApi 数据源），
            //       再通过 SQL 5.2 从用户 market 权限表取得 Market
            results = searchByUserKey(serid, user);
        } else {
            // ---------- 检索场景 (3)(4)(5)：Not set / Rule / Template ----------
            // 通过 SQL 5.3 动态条件检索：
            //   - market 为空时取消 market 条件
            //   - function 为空或 NOT_SET 时取消 function 条件（检索全部用户）
            SearchUserRequest condition = new SearchUserRequest();
            condition.setSerid(serid);
            condition.setUser(user);
            condition.setMarket(market);
            condition.setFunction(function);
            results = searchUserMapper.selectUsersByCondition(condition);
        }

        // ---------- 4.7 生成 Token（包含检索数据件数、访问DB是否成功等） ----------
        String token = generateToken(results.size());

        // ---------- 4.8 构建检索结果响应体 ----------
        SearchUserResponse response = new SearchUserResponse();
        response.setToken(token);
        response.setCount(results.size());
        response.setUsers(results);
        logger.info("SearchUserApi 检索完成, 检索件数={}", results.size());
        return response;
    }

    @Override
    public MarketListResponse getMarketList() {
        // 画面初期表示时调用，对应 SQL 5.1：SELECT MARKET FROM MARKET_MASTER
        MarketListResponse response = new MarketListResponse();
        response.setMarkets(marketMapper.selectMarketList());
        return response;
    }

    /**
     * 检索场景 (1)(2)：按 Userid / User 检索
     * (1) Userid 检索：从 AuthenticationApi（hdoc_user_infor）取得用户名，
     *     再从ユーザmarket権限テーブル（HDOC_MARKET_AUTH）取得 Market
     * (2) User 检索：先从 AuthenticationApi 取得 Userid，再取得 Market
     */
    private List<UserSearchResult> searchByUserKey(String serid, String user) {
        List<UserSearchResult> results = new ArrayList<>();
        List<HdocUserInfor> users = new ArrayList<>();

        if (!serid.isEmpty()) {
            // (1) Userid 检索：精确匹配用户ID
            HdocUserInfor userInfo = searchUserMapper.selectUserByUserid(serid);
            if (userInfo != null) {
                users.add(userInfo);
            }
        } else {
            // (2) User 检索：先根据用户名取得 Userid
            users = searchUserMapper.selectUsersByUsername(user);
        }

        // 根据 Userid 通过 SQL 5.2 取得用户的 Market（多个 Market 以逗号拼接）
        for (HdocUserInfor userInfo : users) {
            List<String> markets = searchUserMapper.selectMarketsByUserid(userInfo.getUserid());
            UserSearchResult item = new UserSearchResult();
            item.setUserid(userInfo.getUserid());
            item.setUser(userInfo.getUsername());
            item.setMarket(String.join(",", markets));
            results.add(item);
        }
        return results;
    }

    /**
     * 请求参数校验（对应后端提示词 4.4、设计书 3.2 校验规格 No.1～No.4）
     * 校验失败时抛出 IllegalArgumentException，由控制器层统一捕获返回错误
     */
    private void validateRequest(SearchUserRequest request) {
        String serid = trimToEmpty(request.getSerid());
        String user = trimToEmpty(request.getUser());

        if (!ALPHANUMERIC_PATTERN.matcher(serid).matches()) {
            throw new IllegalArgumentException("Userid 仅允许半角英数字。");
        }
        if (serid.length() > USERID_MAX_LENGTH) {
            throw new IllegalArgumentException("Userid 最大长度为 10 字符。");
        }
        if (!ALPHANUMERIC_PATTERN.matcher(user).matches()) {
            throw new IllegalArgumentException("User 仅允许半角英数字。");
        }
        if (user.length() > USER_MAX_LENGTH) {
            throw new IllegalArgumentException("User 最大长度为 32 字符。");
        }
    }

    /**
     * 权限类型取值映射（画面值 → DB 存储值）
     * Not set → 空串（SQL 5.3 中取消 function 条件）
     */
    private String mapFunctionValue(String function) {
        if (FUNCTION_NOT_SET.equals(function)) {
            return "";
        }
        if ("RULE".equals(function)) {
            return FUNCTION_RULE_DB;
        }
        if ("TEMPLATE".equals(function)) {
            return FUNCTION_TEMPLATE_DB;
        }
        return function;
    }

    /**
     * 生成 Token（后端提示词 4.7：包含检索数据件数、访问DB是否成功等）
     */
    private String generateToken(int count) {
        return UUID.randomUUID().toString().replace("-", "") + "-" + count;
    }

    private String trimToEmpty(String value) {
        return value == null ? "" : value.trim();
    }
}
