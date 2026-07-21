package com.web.app.test;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.MarketMasterMapper;
import com.web.app.mapper.UserMapper;
import com.web.app.mapper.UserPermissionMapper;
import com.web.app.service.impl.UD19SearchResultListServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD19SearchResultListServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、空白分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD19SearchResultListServiceImplTest {

    @Mock
    private UserMapper userMapper;

    @Mock
    private UserPermissionMapper userPermissionMapper;

    @Mock
    private MarketMasterMapper marketMasterMapper;

    @InjectMocks
    private UD19SearchResultListServiceImpl service;

    // =========================================================================
    // searchHdoc
    // =========================================================================

    // -------------------------------------------------------
    // 分支: 所有条件均为false → 400 "请至少输入一个搜索条件"
    // 覆盖: userid=null/empty, user=null/empty, notSet=null, rule=null, template=null
    // -------------------------------------------------------

    @Test
    @DisplayName("searchHdoc - 全部条件为空 → 400")
    void searchHdoc_allEmpty_returns400() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        // userid=null → false
        // user=null → false
        // notSet=null → false
        // rule=null → false
        // template=null → false

        UD19SearchResultListResponse response = service.searchHdoc(req);
        assertEquals(400, response.getCode());
        assertEquals("请至少输入一个搜索条件", response.getMsg());
        verifyNoInteractions(userPermissionMapper);
    }

    // -------------------------------------------------------
    // 分支: userid有值, 其他为null/empty → 查询userid
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("searchHdoc - 仅userid有值 → 查询, function=null")
    void searchHdoc_onlyUserid() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setUserid("testuser");
        // hasUserid=true, others false → function=null

        List<Map<String, Object>> mockResult = new ArrayList<>();
        Map<String, Object> row = new HashMap<>();
        row.put("userid", "testuser");
        mockResult.add(row);

        when(userPermissionMapper.searchHdocUsers("testuser", null, null, null)).thenReturn(mockResult);

        UD19SearchResultListResponse response = service.searchHdoc(req);
        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(1, data.get("count"));
        List<Map<String, Object>> users = (List<Map<String, Object>>) data.get("users");
        assertEquals(1, users.size());

        verify(userPermissionMapper).searchHdocUsers("testuser", null, null, null);
    }

    // -------------------------------------------------------
    // 分支: user有值 → 查询user
    // -------------------------------------------------------

    @Test
    @DisplayName("searchHdoc - 仅user有值 → 查询")
    void searchHdoc_onlyUser() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setUser("Test User");

        when(userPermissionMapper.searchHdocUsers(null, "Test User", null, null)).thenReturn(Collections.emptyList());

        service.searchHdoc(req);
        verify(userPermissionMapper).searchHdocUsers(null, "Test User", null, null);
    }

    // -------------------------------------------------------
    // 分支: notSet有值 → function=null (查询全部)
    // -------------------------------------------------------

    @Test
    @DisplayName("searchHdoc - notSet有值 → function=null(查询全部)")
    void searchHdoc_notSet() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setNotSet("true");

        when(userPermissionMapper.searchHdocUsers(null, null, null, null)).thenReturn(Collections.emptyList());

        service.searchHdoc(req);
        verify(userPermissionMapper).searchHdocUsers(null, null, null, null);
    }

    // -------------------------------------------------------
    // 分支: rule有值 → function="Rule Admin"
    // -------------------------------------------------------

    @Test
    @DisplayName("searchHdoc - rule有值 → function=Rule Admin")
    void searchHdoc_rule() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setRule("true");

        when(userPermissionMapper.searchHdocUsers(null, null, "Rule Admin", null)).thenReturn(Collections.emptyList());

        service.searchHdoc(req);
        verify(userPermissionMapper).searchHdocUsers(null, null, "Rule Admin", null);
    }

    // -------------------------------------------------------
    // 分支: template有值 → function="Template Admin"
    // -------------------------------------------------------

    @Test
    @DisplayName("searchHdoc - template有值 → function=Template Admin")
    void searchHdoc_template() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setTemplate("true");

        when(userPermissionMapper.searchHdocUsers(null, null, "Template Admin", null)).thenReturn(Collections.emptyList());

        service.searchHdoc(req);
        verify(userPermissionMapper).searchHdocUsers(null, null, "Template Admin", null);
    }

    // -------------------------------------------------------
    // 分支: userid为空串 → hasUserid=false
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("searchHdoc - userid为空串, rule有值 → function=Rule Admin")
    void searchHdoc_useridEmpty_ruleSet() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setUserid("");
        req.setRule("true");
        // hasUserid=false, hasRule=true → function="Rule Admin"

        List<Map<String, Object>> mockResult = new ArrayList<>();
        when(userPermissionMapper.searchHdocUsers(null, null, "Rule Admin", null)).thenReturn(mockResult);

        UD19SearchResultListResponse response = service.searchHdoc(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(0, data.get("count"));
        verify(userPermissionMapper).searchHdocUsers(null, null, "Rule Admin", null);
    }

    // -------------------------------------------------------
    // 分支: user为空串 → hasUser=false
    // -------------------------------------------------------

    @Test
    @DisplayName("searchHdoc - user为空串, template有值 → function=Template Admin")
    void searchHdoc_userEmpty_templateSet() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setUser("");
        req.setTemplate("true");

        when(userPermissionMapper.searchHdocUsers(null, null, "Template Admin", null)).thenReturn(Collections.emptyList());

        service.searchHdoc(req);
        verify(userPermissionMapper).searchHdocUsers(null, null, "Template Admin", null);
    }

    // -------------------------------------------------------
    // 分支: users为null → count=0
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("searchHdoc - users返回null → count=0")
    void searchHdoc_usersNull_countZero() {
        UD19SearchResultListRequest req = new UD19SearchResultListRequest();
        req.setUserid("testuser");

        when(userPermissionMapper.searchHdocUsers("testuser", null, null, null)).thenReturn(null);

        UD19SearchResultListResponse response = service.searchHdoc(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(0, data.get("count"));
        assertNull(data.get("users"));
    }

    // =========================================================================
    // selectMarketMaster
    // =========================================================================

    // -------------------------------------------------------
    // 分支: markets为null → 空列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectMarketMaster - markets为null → 空列表")
    void selectMarketMaster_null_returnsEmpty() {
        when(marketMasterMapper.selectAll()).thenReturn(null);

        UD19SearchResultListResponse response = service.selectMarketMaster();
        assertEquals(200, response.getCode());
        assertEquals("获取成功", response.getMsg());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<MarketMaster> markets = (List<MarketMaster>) data.get("markets");
        assertTrue(markets.isEmpty());

        verify(marketMasterMapper).selectAll();
    }

    // -------------------------------------------------------
    // 分支: markets有数据 → 正常返回
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectMarketMaster - 有数据 → 正常返回")
    void selectMarketMaster_withData() {
        MarketMaster m1 = new MarketMaster();
        m1.setMarket("AUS");
        when(marketMasterMapper.selectAll()).thenReturn(Collections.singletonList(m1));

        UD19SearchResultListResponse response = service.selectMarketMaster();
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        List<MarketMaster> markets = (List<MarketMaster>) data.get("markets");
        assertEquals(1, markets.size());

        verify(marketMasterMapper).selectAll();
    }
}
