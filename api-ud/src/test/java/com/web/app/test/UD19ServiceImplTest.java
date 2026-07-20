package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.HdocDocumentList;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.service.impl.UD19ServiceImpl;
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
 * UD19ServiceImpl 单元测试
 * 覆盖所有分支路径，达到100%分支覆盖率
 */
@ExtendWith(MockitoExtension.class)
class UD19ServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @InjectMocks
    private UD19ServiceImpl service;

    private HdocDocumentList createRequest(String userId, String searchUser, String market, String searchType) {
        HdocDocumentList r = new HdocDocumentList();
        r.setUserId(userId);
        r.setSearchUser(searchUser);
        r.setMarket(market);
        r.setSearchType(searchType);
        return r;
    }

    // ============================================================
    // getMarketList()
    // ============================================================

    @Test
    @DisplayName("getMarketList - 正常返回")
    void getMarketList_Success_ShouldReturnList() {
        MarketMaster m = new MarketMaster();
        m.setMarket("JP");
        when(hdocDocumentListMapper.selectMarketList()).thenReturn(Arrays.asList(m));

        ApiResponse<?> result = service.getMarketList();

        assertEquals(200, result.getCode());
        assertEquals("获取市场列表成功", result.getMsg());
    }

    @Test
    @DisplayName("getMarketList - Mapper返回null，应返回404")
    void getMarketList_Null_ShouldReturn404() {
        when(hdocDocumentListMapper.selectMarketList()).thenReturn(null);

        ApiResponse<?> result = service.getMarketList();

        assertEquals(404, result.getCode());
    }

    @Test
    @DisplayName("getMarketList - Mapper返回空列表，应返回404")
    void getMarketList_Empty_ShouldReturn404() {
        when(hdocDocumentListMapper.selectMarketList()).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.getMarketList();

        assertEquals(404, result.getCode());
    }

    @Test
    @DisplayName("getMarketList - 异常，应返回500")
    void getMarketList_Exception_ShouldReturn500() {
        when(hdocDocumentListMapper.selectMarketList()).thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.getMarketList();

        assertEquals(500, result.getCode());
    }

    // ============================================================
    // searchHdoc() — 参数校验
    // ============================================================

    @Test
    @DisplayName("searchHdoc - userid为null，应正常处理（转为空字符串）")
    void searchHdoc_UserIdNull_ShouldTreatAsEmpty() {
        HdocDocumentList r = createRequest(null, null, null, null);
        when(hdocDocumentListMapper.searchUsers(null, null, null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, null, null);
    }

    @Test
    @DisplayName("searchHdoc - userid超过10字符，应返回400")
    void searchHdoc_UserIdTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest(new String(new char[11]).replace('\0', 'U'), null, null, null);

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(400, result.getCode());
        assertEquals("Userid长度不能超过10字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    @Test
    @DisplayName("searchHdoc - searchUser超过32字符，应返回400")
    void searchHdoc_SearchUserTooLong_ShouldReturn400() {
        HdocDocumentList r = createRequest("user", new String(new char[33]).replace('\0', 'N'), null, null);

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(400, result.getCode());
        assertEquals("User长度不能超过32字符", result.getMsg());
        verifyNoInteractions(hdocDocumentListMapper);
    }

    // ============================================================
    // searchHdoc() — 搜索类型分支：userid和searchUser均为空
    // ============================================================

    @Test
    @DisplayName("searchHdoc - 两者为空且searchType=RULE，functionCode=RULES")
    void searchHdoc_BothEmptyTypeRule_ShouldSearchWithRules() {
        HdocDocumentList r = createRequest("", "", null, "RULE");
        when(hdocDocumentListMapper.searchUsers(null, null, "RULES", null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, "RULES", null);
    }

    @Test
    @DisplayName("searchHdoc - 两者为空且searchType=TEMPLATE，functionCode=TEMPLATE")
    void searchHdoc_BothEmptyTypeTemplate_ShouldSearchWithTemplate() {
        HdocDocumentList r = createRequest("", "", null, "TEMPLATE");
        when(hdocDocumentListMapper.searchUsers(null, null, "TEMPLATE", null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, "TEMPLATE", null);
    }

    @Test
    @DisplayName("searchHdoc - 两者为空且searchType=其他（NOT_SET），functionCode为null")
    void searchHdoc_BothEmptyTypeOther_ShouldSearchWithNullFunction() {
        HdocDocumentList r = createRequest("", "", null, "OTHER");
        when(hdocDocumentListMapper.searchUsers(null, null, null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, null, null);
    }

    @Test
    @DisplayName("searchHdoc - 两者为空且searchType=null（NOT_SET），functionCode为null")
    void searchHdoc_BothEmptyTypeNull_ShouldSearchWithNullFunction() {
        HdocDocumentList r = createRequest("", "", null, null);
        when(hdocDocumentListMapper.searchUsers(null, null, null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, null, null);
    }

    // ============================================================
    // searchHdoc() — 按userId搜索
    // ============================================================

    @Test
    @DisplayName("searchHdoc - 按userId搜索且searchType=RULE，functionCode=RULES")
    void searchHdoc_ByUserIdTypeRule_ShouldSearchWithRules() {
        HdocDocumentList r = createRequest("testuser", "", null, "RULE");
        when(hdocDocumentListMapper.searchUsers("testuser", null, "RULES", null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers("testuser", null, "RULES", null);
    }

    @Test
    @DisplayName("searchHdoc - 按userId搜索且searchType=TEMPLATE，functionCode=TEMPLATE")
    void searchHdoc_ByUserIdTypeTemplate_ShouldSearchWithTemplate() {
        HdocDocumentList r = createRequest("testuser", "", null, "TEMPLATE");
        when(hdocDocumentListMapper.searchUsers("testuser", null, "TEMPLATE", null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers("testuser", null, "TEMPLATE", null);
    }

    @Test
    @DisplayName("searchHdoc - 按userId搜索且searchType=其他，functionCode为null")
    void searchHdoc_ByUserIdTypeOther_ShouldSearchWithNullFunction() {
        HdocDocumentList r = createRequest("testuser", "", null, "OTHER");
        when(hdocDocumentListMapper.searchUsers("testuser", null, null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers("testuser", null, null, null);
    }

    @Test
    @DisplayName("searchHdoc - 按userId搜索且searchType为null，functionCode为null")
    void searchHdoc_ByUserIdTypeNull_ShouldSearchWithNullFunction() {
        HdocDocumentList r = createRequest("testuser", "", null, null);
        when(hdocDocumentListMapper.searchUsers("testuser", null, null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
    }

    // ============================================================
    // searchHdoc() — 按userName搜索
    // ============================================================

    @Test
    @DisplayName("searchHdoc - 按userName搜索，应使用queryUsername")
    void searchHdoc_ByUserName_ShouldSearchByUsername() {
        HdocDocumentList r = createRequest("", "TestUser", null, null);
        when(hdocDocumentListMapper.searchUsers(null, "TestUser", null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, "TestUser", null, null);
    }

    // ============================================================
    // searchHdoc() — market参数
    // ============================================================

    @Test
    @DisplayName("searchHdoc - market有值，应传给Mapper")
    void searchHdoc_MarketProvided_ShouldPassToMapper() {
        HdocDocumentList r = createRequest("", "", "JP", null);
        when(hdocDocumentListMapper.searchUsers(null, null, null, "JP")).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, null, "JP");
    }

    @Test
    @DisplayName("searchHdoc - market为null，应传null给Mapper")
    void searchHdoc_MarketNull_ShouldPassNull() {
        HdocDocumentList r = createRequest("", "", null, null);
        when(hdocDocumentListMapper.searchUsers(null, null, null, null)).thenReturn(new ArrayList<>());

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        verify(hdocDocumentListMapper, times(1)).searchUsers(null, null, null, null);
    }

    // ============================================================
    // searchHdoc() — 结果处理
    // ============================================================

    @Test
    @DisplayName("searchHdoc - rawResults为null，应返回空列表")
    void searchHdoc_RawResultsNull_ShouldReturnEmptyList() {
        HdocDocumentList r = createRequest("", "", null, null);
        when(hdocDocumentListMapper.searchUsers(null, null, null, null)).thenReturn(null);

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        assertNotNull(result.getData());
        assertEquals(0, ((Map<?, ?>) result.getData()).get("count"));
        assertTrue(((List<?>) ((Map<?, ?>) result.getData()).get("users")).isEmpty());
    }

    @Test
    @DisplayName("searchHdoc - rawResults非空，应构建用户列表且market为null时用空串替代")
    void searchHdoc_RawResultsNotEmpty_ShouldBuildUserList() {
        HdocDocumentList r = createRequest("", "", null, null);
        Map<String, Object> row1 = new HashMap<>();
        row1.put("userid", "user1");
        row1.put("user", "User One");
        row1.put("market", "JP");
        Map<String, Object> row2 = new HashMap<>();
        row2.put("userid", "user2");
        row2.put("user", "User Two");
        row2.put("market", null); // market为null，应用空串
        when(hdocDocumentListMapper.searchUsers(null, null, null, null))
                .thenReturn(Arrays.asList(row1, row2));

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(200, result.getCode());
        assertEquals("success", result.getMsg());
        assertNotNull(result.getData());
        Map<?, ?> data = (Map<?, ?>) result.getData();
        assertEquals(2, data.get("count"));
        List<?> users = (List<?>) data.get("users");
        assertEquals(2, users.size());
        Map<?, ?> u1 = (Map<?, ?>) users.get(0);
        assertEquals("user1", u1.get("userid"));
        assertEquals("User One", u1.get("user"));
        assertEquals("JP", u1.get("market"));
        Map<?, ?> u2 = (Map<?, ?>) users.get(1);
        assertEquals("user2", u2.get("userid"));
        assertEquals("User Two", u2.get("user"));
        assertEquals("", u2.get("market"));
    }

    @Test
    @DisplayName("searchHdoc - Mapper异常，应返回500")
    void searchHdoc_MapperThrowsException_ShouldReturn500() {
        HdocDocumentList r = createRequest("", "", null, null);
        when(hdocDocumentListMapper.searchUsers(null, null, null, null))
                .thenThrow(new RuntimeException("DB error"));

        ApiResponse<?> result = service.searchHdoc(r);

        assertEquals(500, result.getCode());
        assertEquals("系统内部错误，请联系管理员", result.getMsg());
    }
}
