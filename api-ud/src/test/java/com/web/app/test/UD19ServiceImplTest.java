package com.web.app.test;

import com.web.app.domain.UD19Request;
import com.web.app.mapper.UD19Mapper;
import com.web.app.service.impl.UD19ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD19ServiceImpl 单元测试
 * searchUser: switch 2种operation + ternary results
 */
class UD19ServiceImplTest {

    @Mock
    private UD19Mapper ud19Mapper;

    @InjectMocks
    private UD19ServiceImpl ud19Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("GET_MARKET_LIST 操作测试")
    class GetMarketListTest {

        @Test
        @DisplayName("返回市场列表和数量")
        void testGetMarketList() {
            Map<String, String> m1 = new LinkedHashMap<>();
            m1.put("market", "JPN");
            m1.put("description", "Japan");
            Map<String, String> m2 = new LinkedHashMap<>();
            m2.put("market", "USA");
            m2.put("description", "USA");

            when(ud19Mapper.selectAllMarkets()).thenReturn(Arrays.asList(m1, m2));

            Map<String, Object> result = ud19Service.searchUser(createRequest("GET_MARKET_LIST"));

            assertAll(
                    () -> assertNotNull(result),
                    () -> assertTrue(result.containsKey("markets")),
                    () -> assertEquals(2, result.get("count"))
            );
        }

        @Test
        @DisplayName("返回空市场列表")
        void testGetEmptyMarketList() {
            when(ud19Mapper.selectAllMarkets()).thenReturn(Collections.emptyList());

            Map<String, Object> result = ud19Service.searchUser(createRequest("GET_MARKET_LIST"));

            assertEquals(0, result.get("count"));
            assertTrue(((List<?>) result.get("markets")).isEmpty());
        }
    }

    @Nested
    @DisplayName("SEARCH_USER 操作测试")
    class SearchUserTest {

        @Test
        @DisplayName("搜索用户返回结果列表")
        void testSearchUserWithResults() {
            UD19Request request = createRequest("SEARCH_USER");
            request.setUserid("USER");
            request.setUser("John");
            request.setMarket("JPN");
            request.setType("Rule");

            Map<String, Object> user1 = new LinkedHashMap<>();
            user1.put("userid", "USER001");
            Map<String, Object> user2 = new LinkedHashMap<>();
            user2.put("userid", "USER002");

            when(ud19Mapper.searchUsers("USER", "John", "JPN", true, false))
                    .thenReturn(Arrays.asList(user1, user2));

            Map<String, Object> result = ud19Service.searchUser(request);

            assertAll(
                    () -> assertEquals(2, result.get("count")),
                    () -> assertEquals(2, ((List<?>) result.get("results")).size())
            );
        }

        @Test
        @DisplayName("搜索用户返回空结果")
        void testSearchUserNoResults() {
            UD19Request request = createRequest("SEARCH_USER");
            request.setType("Template");

            when(ud19Mapper.searchUsers(isNull(), isNull(), isNull(), eq(false), eq(true)))
                    .thenReturn(Collections.emptyList());

            Map<String, Object> result = ud19Service.searchUser(request);

            assertAll(
                    () -> assertEquals(0, result.get("count")),
                    () -> assertTrue(((List<?>) result.get("results")).isEmpty())
            );
        }

        @Test
        @DisplayName("搜索用户Mapper返回null时使用空列表")
        void testSearchUserNullResults() {
            UD19Request request = createRequest("SEARCH_USER");
            request.setType("Other");

            when(ud19Mapper.searchUsers(isNull(), isNull(), isNull(), eq(false), eq(false)))
                    .thenReturn(null);

            Map<String, Object> result = ud19Service.searchUser(request);

            assertAll(
                    () -> assertEquals(0, result.get("count")),
                    () -> assertNotNull(result.get("results")),
                    () -> assertTrue(((List<?>) result.get("results")).isEmpty())
            );
        }

        @Test
        @DisplayName("搜索用户 - type为Rule时isRule=true")
        void testSearchUserTypeRule() {
            UD19Request request = createRequest("SEARCH_USER");
            request.setType("Rule");

            when(ud19Mapper.searchUsers(isNull(), isNull(), isNull(), eq(true), eq(false)))
                    .thenReturn(Collections.emptyList());

            ud19Service.searchUser(request);

            verify(ud19Mapper, times(1)).searchUsers(isNull(), isNull(), isNull(), eq(true), eq(false));
        }

        @Test
        @DisplayName("搜索用户 - type为Template时isTemplate=true")
        void testSearchUserTypeTemplate() {
            UD19Request request = createRequest("SEARCH_USER");
            request.setType("Template");

            when(ud19Mapper.searchUsers(isNull(), isNull(), isNull(), eq(false), eq(true)))
                    .thenReturn(Collections.emptyList());

            ud19Service.searchUser(request);

            verify(ud19Mapper, times(1)).searchUsers(isNull(), isNull(), isNull(), eq(false), eq(true));
        }
    }

    @Nested
    @DisplayName("未知操作测试")
    class UnknownOperationTest {

        @Test
        @DisplayName("未知操作抛出异常")
        void testUnknownOperation() {
            UD19Request request = createRequest("UNKNOWN");

            assertThrows(IllegalArgumentException.class,
                    () -> ud19Service.searchUser(request));
        }
    }

    private UD19Request createRequest(String operation) {
        UD19Request request = new UD19Request();
        request.setOperation(operation);
        return request;
    }
}
