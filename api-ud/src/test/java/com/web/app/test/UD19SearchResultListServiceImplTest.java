package com.web.app.test;

import com.web.app.dto.UD19SearchResultListRequest;
import com.web.app.dto.UD19SearchResultListResponse;
import com.web.app.dto.UD19SearchResultListResponse.UserData;
import com.web.app.entity.MarketMaster;
import com.web.app.mapper.UD19SearchResultListMapper;
import com.web.app.service.impl.UD19SearchResultListServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD19SearchResultListServiceImpl 单元测试
 * 覆盖所有方法的所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD19SearchResultListServiceImpl 单元测试")
class UD19SearchResultListServiceImplTest {

    @Mock
    private UD19SearchResultListMapper ud19Mapper;

    @InjectMocks
    private UD19SearchResultListServiceImpl service;

    // ====================================================================
    // UD19SelectMarketMaster 测试
    // ====================================================================

    @Test
    @DisplayName("[SelectMarketMaster] list 不为 null 时应返回市场列表（含描述）")
    void testSelectMarketMaster_ListNotNull() {
        MarketMaster mm1 = new MarketMaster();
        mm1.setMarket("JP");
        mm1.setDescription("Japan");
        MarketMaster mm2 = new MarketMaster();
        mm2.setMarket("AUS");
        mm2.setDescription("Australia");
        when(ud19Mapper.selectAllMarket()).thenReturn(Arrays.asList(mm1, mm2));

        UD19SearchResultListResponse response = service.UD19SelectMarketMaster();

        assertEquals(200, response.getCode().intValue());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD19SearchResultListResponse.MarketData> dataList = (List<UD19SearchResultListResponse.MarketData>) response
                .getData();
        assertEquals(2, dataList.size());
        assertEquals("JP", dataList.get(0).getMarket());
        assertEquals("Japan", dataList.get(0).getDescription());
        assertEquals("AUS", dataList.get(1).getMarket());
        assertEquals("Australia", dataList.get(1).getDescription());
        verify(ud19Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarketMaster] list 为 null 时应返回空列表")
    void testSelectMarketMaster_ListNull() {
        when(ud19Mapper.selectAllMarket()).thenReturn(null);

        UD19SearchResultListResponse response = service.UD19SelectMarketMaster();

        assertEquals(200, response.getCode().intValue());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        @SuppressWarnings("unchecked")
        List<UD19SearchResultListResponse.MarketData> dataList = (List<UD19SearchResultListResponse.MarketData>) response
                .getData();
        assertTrue(dataList.isEmpty());
        verify(ud19Mapper, times(1)).selectAllMarket();
    }

    @Test
    @DisplayName("[SelectMarketMaster] 系统异常时应返回500")
    void testSelectMarketMaster_Exception() {
        when(ud19Mapper.selectAllMarket()).thenThrow(new RuntimeException("数据库异常"));

        UD19SearchResultListResponse response = service.UD19SelectMarketMaster();

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud19Mapper, times(1)).selectAllMarket();
    }

    // ====================================================================
    // UD19SearchHdoc 测试
    // ====================================================================

    @Test
    @DisplayName("[SearchHdoc] userList 为 null 时应返回404")
    void testSearchHdoc_UserListNull() {
        when(ud19Mapper.searchUsers(any(), any(), any(), any())).thenReturn(null);

        UD19SearchResultListRequest request = new UD19SearchResultListRequest();
        UD19SearchResultListResponse response = service.UD19SearchHdoc(request);

        assertEquals(404, response.getCode().intValue());
        assertEquals("未找到匹配的用户", response.getMsg());
        assertNull(response.getData());
        verify(ud19Mapper, times(1)).searchUsers(null, null, null, null);
    }

    @Test
    @DisplayName("[SearchHdoc] userList 为空列表时应返回404")
    void testSearchHdoc_UserListEmpty() {
        when(ud19Mapper.searchUsers(any(), any(), any(), any()))
                .thenReturn(Collections.emptyList());

        UD19SearchResultListRequest request = new UD19SearchResultListRequest();
        UD19SearchResultListResponse response = service.UD19SearchHdoc(request);

        assertEquals(404, response.getCode().intValue());
        assertEquals("未找到匹配的用户", response.getMsg());
        assertNull(response.getData());
        verify(ud19Mapper, times(1)).searchUsers(null, null, null, null);
    }

    @Test
    @DisplayName("[SearchHdoc] 查询成功时应返回200含 count 和 datatable")
    void testSearchHdoc_Success() {
        UserData user1 = new UserData("user001", "张三", "JP");
        UserData user2 = new UserData("user002", "李四", "AUS");
        when(ud19Mapper.searchUsers(any(), any(), any(), any()))
                .thenReturn(Arrays.asList(user1, user2));

        UD19SearchResultListRequest request = new UD19SearchResultListRequest();
        request.setUserId("user001");
        request.setUsername("张三");
        request.setMarket("JP");
        request.setType("USER");

        UD19SearchResultListResponse response = service.UD19SearchHdoc(request);

        assertEquals(200, response.getCode().intValue());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        UD19SearchResultListResponse.SearchResultData resultData = (UD19SearchResultListResponse.SearchResultData) response
                .getData();
        assertEquals(2, resultData.getCount().intValue());
        assertEquals(2, resultData.getDatatable().size());
        assertEquals("user001", resultData.getDatatable().get(0).getUserId());
        assertEquals("张三", resultData.getDatatable().get(0).getUsername());
        assertEquals("JP", resultData.getDatatable().get(0).getMarket());
        assertEquals("user002", resultData.getDatatable().get(1).getUserId());

        verify(ud19Mapper, times(1)).searchUsers("user001", "张三", "JP", "USER");
    }

    @Test
    @DisplayName("[SearchHdoc] 系统异常时应返回500")
    void testSearchHdoc_Exception() {
        when(ud19Mapper.searchUsers(any(), any(), any(), any()))
                .thenThrow(new RuntimeException("数据库异常"));

        UD19SearchResultListRequest request = new UD19SearchResultListRequest();
        UD19SearchResultListResponse response = service.UD19SearchHdoc(request);

        assertEquals(500, response.getCode().intValue());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud19Mapper, times(1)).searchUsers(null, null, null, null);
    }
}
