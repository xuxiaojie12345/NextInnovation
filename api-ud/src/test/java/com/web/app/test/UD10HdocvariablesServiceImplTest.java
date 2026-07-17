package com.web.app.test;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.mapper.UD10HdocvariablesMapper;
import com.web.app.service.impl.UD10HdocvariablesServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD10HdocvariablesServiceImpl 单元测试
 * 覆盖 UD10Add / UD10Update / UD10Delete 所有分支，达到 100% JaCoCo 覆盖率
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD10HdocvariablesServiceImpl 单元测试")
class UD10HdocvariablesServiceImplTest {

    @Mock
    private UD10HdocvariablesMapper ud10Mapper;

    @InjectMocks
    private UD10HdocvariablesServiceImpl service;

    // ====================================================================
    // validateVariable 公共校验分支（被所有3个方法调用）
    // ====================================================================

    // ====================================================================
    // UD10Add 测试
    // ====================================================================

    @Test
    @DisplayName("[Add] variable 为 null 时应返回400")
    void testAdd_VariableNull() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable(null);

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Add] variable 为空字符串时应返回400")
    void testAdd_VariableEmpty() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Add] variable 为空白字符串时应返回400")
    void testAdd_VariableBlank() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("   ");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Add] 变量已存在（count > 0）时应返回409")
    void testAdd_VariableAlreadyExists() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(1);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(409, response.getCode());
        assertEquals("Variant already exists. Please enter the correct content.", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, never()).insertVariable(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[Add] 添加成功且 createdByUser 不为空时应使用用户值")
    void testAdd_SuccessWithUser() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(0);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");
        request.setType("STRING");
        request.setDescription("测试变量");
        request.setCreatedByUser("admin");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMessage());
        assertNull(response.getData());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, times(1)).insertVariable(
                captor.capture(), captor.capture(), captor.capture(),
                captor.capture(), captor.capture(), captor.capture());

        // variable, type, description, userid, registerUser, updateUser
        assertEquals("VAR001", captor.getAllValues().get(0));
        assertEquals("STRING", captor.getAllValues().get(1));
        assertEquals("测试变量", captor.getAllValues().get(2));
        assertEquals("admin", captor.getAllValues().get(3)); // userid
        assertEquals("admin", captor.getAllValues().get(4)); // registerUser
        assertEquals("admin", captor.getAllValues().get(5)); // updateUser
    }

    @Test
    @DisplayName("[Add] count 为 null 时不应报错，应继续插入")
    void testAdd_CountNull() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(null);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");
        request.setCreatedByUser("admin");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMessage());
        // count != null 为 false → 短路 count > 0 → 继续插入
        verify(ud10Mapper, times(1)).insertVariable(any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("[Add] 添加成功且 createdByUser 为空时应使用 SYSTEM")
    void testAdd_SuccessWithSystemUser() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(0);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");
        request.setType("STRING");
        request.setDescription("测试变量");
        request.setCreatedByUser(null);

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMessage());
        assertNull(response.getData());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, times(1)).insertVariable(
                captor.capture(), captor.capture(), captor.capture(),
                captor.capture(), captor.capture(), captor.capture());

        assertEquals("SYSTEM", captor.getAllValues().get(3)); // userid
        assertEquals("SYSTEM", captor.getAllValues().get(4)); // registerUser
        assertEquals("SYSTEM", captor.getAllValues().get(5)); // updateUser
    }

    @Test
    @DisplayName("[Add] 添加成功且 createdByUser 为空字符串时应使用 SYSTEM")
    void testAdd_SuccessWithEmptyUser() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(0);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");
        request.setType("STRING");
        request.setDescription("测试变量");
        request.setCreatedByUser("");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(200, response.getCode());
        assertEquals("添加成功", response.getMessage());
        assertNull(response.getData());

        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, times(1)).insertVariable(
                captor.capture(), captor.capture(), captor.capture(),
                captor.capture(), captor.capture(), captor.capture());

        assertEquals("SYSTEM", captor.getAllValues().get(3));
        assertEquals("SYSTEM", captor.getAllValues().get(4));
        assertEquals("SYSTEM", captor.getAllValues().get(5));
    }

    @Test
    @DisplayName("[Add] 系统异常时应返回500")
    void testAdd_Exception() {
        when(ud10Mapper.countByVariable(anyString())).thenThrow(new RuntimeException("数据库异常"));

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Add(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
    }

    // ====================================================================
    // UD10Update 测试
    // ====================================================================

    @Test
    @DisplayName("[Update] variable 为 null 时应返回400")
    void testUpdate_VariableNull() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable(null);

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Update] variable 为空字符串时应返回400")
    void testUpdate_VariableEmpty() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("");

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Update] 变量不存在（count 为 null）时应返回404")
    void testUpdate_CountNull() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(null);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Variant does not exists. Please enter the correct content.", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, never()).updateVariable(any(), any(), any(), any());
    }

    @Test
    @DisplayName("[Update] 变量不存在（count 为 0）时应返回404")
    void testUpdate_CountZero() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(0);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(404, response.getCode());
        assertEquals("Variant does not exists. Please enter the correct content.", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, never()).updateVariable(any(), any(), any(), any());
    }

    @Test
    @DisplayName("[Update] 更新成功且 createdByUser 不为空时应使用用户值")
    void testUpdate_SuccessWithUser() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(1);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");
        request.setType("STRING");
        request.setDescription("更新描述");
        request.setCreatedByUser("admin");

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMessage());
        assertNull(response.getData());

        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, times(1)).updateVariable("VAR001", "STRING", "更新描述", "admin");
    }

    @Test
    @DisplayName("[Update] 更新成功且 createdByUser 为空时应使用 SYSTEM")
    void testUpdate_SuccessWithSystemUser() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(1);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");
        request.setType("STRING");
        request.setDescription("更新描述");
        request.setCreatedByUser(null);

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMessage());
        assertNull(response.getData());

        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, times(1)).updateVariable("VAR001", "STRING", "更新描述", "SYSTEM");
    }

    @Test
    @DisplayName("[Update] 系统异常时应返回500")
    void testUpdate_Exception() {
        when(ud10Mapper.countByVariable(anyString())).thenThrow(new RuntimeException("数据库异常"));

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Update(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
    }

    // ====================================================================
    // UD10Delete 测试
    // ====================================================================

    @Test
    @DisplayName("[Delete] variable 为 null 时应返回400")
    void testDelete_VariableNull() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable(null);

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Delete] variable 为空字符串时应返回400")
    void testDelete_VariableEmpty() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("");

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Delete] variable 为空白字符串时应返回400")
    void testDelete_VariableBlank() {
        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("   ");

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(400, response.getCode());
        assertEquals("变量名不能为空", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, never()).countByVariable(any());
    }

    @Test
    @DisplayName("[Delete] 变量不存在（count 为 null）时应返回404")
    void testDelete_CountNull() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(null);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(404, response.getCode());
        assertEquals("Variant does not exists. Please enter the correct content.", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, never()).deleteVariable(any());
    }

    @Test
    @DisplayName("[Delete] 变量不存在（count 为 0）时应返回404")
    void testDelete_CountZero() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(0);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(404, response.getCode());
        assertEquals("Variant does not exists. Please enter the correct content.", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, never()).deleteVariable(any());
    }

    @Test
    @DisplayName("[Delete] 删除成功时应返回200")
    void testDelete_Success() {
        when(ud10Mapper.countByVariable("VAR001")).thenReturn(1);

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(200, response.getCode());
        assertEquals("删除成功", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
        verify(ud10Mapper, times(1)).deleteVariable("VAR001");
    }

    @Test
    @DisplayName("[Delete] 系统异常时应返回500")
    void testDelete_Exception() {
        when(ud10Mapper.countByVariable(anyString())).thenThrow(new RuntimeException("数据库异常"));

        UD10HdocvariablesRequest request = new UD10HdocvariablesRequest();
        request.setVariable("VAR001");

        UD10HdocvariablesResponse response = service.UD10Delete(request);

        assertEquals(500, response.getCode());
        assertEquals("系统繁忙，请稍后重试", response.getMessage());
        assertNull(response.getData());
        verify(ud10Mapper, times(1)).countByVariable("VAR001");
    }
}
