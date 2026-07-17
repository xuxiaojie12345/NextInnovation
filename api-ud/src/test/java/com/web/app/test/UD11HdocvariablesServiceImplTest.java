package com.web.app.test;

import com.web.app.dto.UD11HdocvariablesRequest;
import com.web.app.dto.UD11HdocvariablesResponse;
import com.web.app.dto.UD11HdocvariablesResponse.VariableData;
import com.web.app.mapper.UD11HdocvariablesMapper;
import com.web.app.service.impl.UD11HdocvariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD11HdocvariablesServiceImpl 单元测试
 * 覆盖 UD11Search 所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD11HdocvariablesServiceImpl 单元测试")
class UD11HdocvariablesServiceImplTest {

    @Mock
    private UD11HdocvariablesMapper ud11Mapper;

    @InjectMocks
    private UD11HdocvariablesServiceImpl service;

    @Test
    @DisplayName("resultList 为 null 时应返回404")
    void testSearch_ResultListNull() {
        when(ud11Mapper.searchVariables(any())).thenReturn(null);

        UD11HdocvariablesRequest request = new UD11HdocvariablesRequest();
        UD11HdocvariablesResponse response = service.UD11Search(request);

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud11Mapper, times(1)).searchVariables(request);
    }

    @Test
    @DisplayName("resultList 为空列表时应返回404")
    void testSearch_ResultListEmpty() {
        when(ud11Mapper.searchVariables(any())).thenReturn(Collections.emptyList());

        UD11HdocvariablesRequest request = new UD11HdocvariablesRequest();
        UD11HdocvariablesResponse response = service.UD11Search(request);

        assertEquals(404, response.getCode());
        assertEquals("数据不存在", response.getMsg());
        assertNull(response.getData());
        verify(ud11Mapper, times(1)).searchVariables(request);
    }

    @Test
    @DisplayName("查询成功时应返回200及数据列表（单条记录）")
    void testSearch_SuccessSingle() {
        VariableData data = new VariableData("VAR001", "STRING", "测试变量", "admin",
                LocalDateTime.of(2026, 6, 24, 10, 0, 0));
        when(ud11Mapper.searchVariables(any())).thenReturn(Collections.singletonList(data));

        UD11HdocvariablesRequest request = new UD11HdocvariablesRequest();
        UD11HdocvariablesResponse response = service.UD11Search(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals(1, response.getData().size());
        assertEquals("VAR001", response.getData().get(0).getVariable());
        assertEquals("STRING", response.getData().get(0).getType());
        assertEquals("测试变量", response.getData().get(0).getDescription());
        assertEquals("admin", response.getData().get(0).getRegisterUser());
        assertNotNull(response.getData().get(0).getRegisterDatetime());
        verify(ud11Mapper, times(1)).searchVariables(request);
    }

    @Test
    @DisplayName("查询成功时应返回200及数据列表（多条记录）")
    void testSearch_SuccessMultiple() {
        VariableData data1 = new VariableData("VAR001", "STRING", "变量1", "admin", null);
        VariableData data2 = new VariableData("VAR002", "INTEGER", "变量2", "user01", null);
        when(ud11Mapper.searchVariables(any())).thenReturn(Arrays.asList(data1, data2));

        UD11HdocvariablesRequest request = new UD11HdocvariablesRequest();
        UD11HdocvariablesResponse response = service.UD11Search(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());
        assertEquals(2, response.getData().size());
        assertEquals("VAR001", response.getData().get(0).getVariable());
        assertEquals("VAR002", response.getData().get(1).getVariable());
        verify(ud11Mapper, times(1)).searchVariables(request);
    }

    @Test
    @DisplayName("系统异常时应返回500")
    void testSearch_Exception() {
        when(ud11Mapper.searchVariables(any())).thenThrow(new RuntimeException("数据库异常"));

        UD11HdocvariablesRequest request = new UD11HdocvariablesRequest();
        UD11HdocvariablesResponse response = service.UD11Search(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMsg());
        assertNull(response.getData());
        verify(ud11Mapper, times(1)).searchVariables(request);
    }
}
