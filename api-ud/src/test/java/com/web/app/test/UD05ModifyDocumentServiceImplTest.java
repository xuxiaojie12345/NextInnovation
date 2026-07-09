package com.web.app.test;

import com.web.app.dto.UD05ModifyDocumentRequest;
import com.web.app.dto.UD05ModifyDocumentResponse;
import com.web.app.dto.UD05UpdateRequest;
import com.web.app.entity.HdocAdcaModification;
import com.web.app.mapper.HdocAdcaModificationMapper;
import com.web.app.service.impl.UD05ModifyDocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
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
 * UD05ModifyDocumentServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、空白分支、正常返回分支、异常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD05ModifyDocumentServiceImplTest {

    @Mock
    private HdocAdcaModificationMapper hdocAdcaModificationMapper;

    @InjectMocks
    private UD05ModifyDocumentServiceImpl service;

    private UD05ModifyDocumentRequest queryRequest;
    private UD05UpdateRequest updateRequest;

    @BeforeEach
    void setUp() {
        queryRequest = new UD05ModifyDocumentRequest();
        updateRequest = new UD05UpdateRequest();
    }

    // =========================================================================
    // selectVariableModification 方法
    // =========================================================================

    // -------------------------------------------------------
    // 分支: serie == null
    // 分支: serie.trim().isEmpty() (空字符串)
    // 分支: serie.trim().isEmpty() (纯空格)
    // 预期: code=400, msg="Serie不能为空", Mapper未被调用
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVariableModification - serie为null → 返回400")
    void select_serieNull_returns400() {
        queryRequest.setSerie(null);
        queryRequest.setChno("12345");

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(400, response.getCode());
        assertEquals("Serie不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectVariableModification - serie为空字符串 → 返回400")
    void select_serieEmpty_returns400() {
        queryRequest.setSerie("");
        queryRequest.setChno("12345");

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(400, response.getCode());
        assertEquals("Serie不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectVariableModification - serie为纯空格 → 返回400")
    void select_serieBlank_returns400() {
        queryRequest.setSerie("   ");
        queryRequest.setChno("12345");

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(400, response.getCode());
        assertEquals("Serie不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // -------------------------------------------------------
    // 分支: chno == null (serie有效时)
    // 分支: chno.trim().isEmpty() (空字符串)
    // 分支: chno.trim().isEmpty() (纯空格)
    // 预期: code=400, msg="Chno不能为空", Mapper未被调用
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVariableModification - chno为null → 返回400")
    void select_chnoNull_returns400() {
        queryRequest.setSerie("ABCD");
        queryRequest.setChno(null);

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(400, response.getCode());
        assertEquals("Chno不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectVariableModification - chno为空字符串 → 返回400")
    void select_chnoEmpty_returns400() {
        queryRequest.setSerie("ABCD");
        queryRequest.setChno("");

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(400, response.getCode());
        assertEquals("Chno不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("selectVariableModification - chno为纯空格 → 返回400")
    void select_chnoBlank_returns400() {
        queryRequest.setSerie("ABCD");
        queryRequest.setChno("   ");

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(400, response.getCode());
        assertEquals("Chno不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // -------------------------------------------------------
    // 分支: list == null (Mapper返回null)
    // 预期: code=200, data中使用mock数据
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVariableModification - Mapper返回null → 使用mock数据返回200")
    void select_listIsNull_usesMockData() {
        queryRequest.setSerie("ABCD");
        queryRequest.setChno("12345");

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345")).thenReturn(null);

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertNotNull(data.get("modifications"));
        assertEquals("ABCD12345", data.get("chassisNo"));
        assertEquals("AUS", data.get("market"));
        assertEquals("aus/UD_TEST.odt", data.get("templateFile"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mods = (List<Map<String, Object>>) data.get("modifications");
        assertEquals(2, mods.size());

        // 第一个mock item: modifiedValue = null
        assertEquals("VIN", mods.get(0).get("variable"));
        assertEquals("Vehicle Identification Number", mods.get(0).get("description"));
        assertEquals("JPCYZ50A2LT028321", mods.get(0).get("currentValue"));
        assertNull(mods.get(0).get("modifiedValue"));

        // 第二个mock item: modifiedValue = ""
        assertEquals("ENGINE_TYPE", mods.get(1).get("variable"));
        assertEquals("Engine Type Code", mods.get(1).get("description"));
        assertEquals("D13K", mods.get(1).get("currentValue"));
        assertEquals("", mods.get(1).get("modifiedValue"));

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: list.isEmpty() == true (Mapper返回空列表)
    // 预期: code=200, data中使用mock数据
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVariableModification - Mapper返回空列表 → 使用mock数据返回200")
    void select_listIsEmpty_usesMockData() {
        queryRequest.setSerie("ABCD");
        queryRequest.setChno("12345");

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345")).thenReturn(Collections.emptyList());

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("ABCD12345", data.get("chassisNo"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mods = (List<Map<String, Object>>) data.get("modifications");
        assertEquals(2, mods.size()); // mock数据2条

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }

    // -------------------------------------------------------
    // 分支: list有数据 → 遍历映射为前端格式 (newval → currentValue)
    // 预期: code=200, 数据映射正确
    // -------------------------------------------------------

    @Test
    @DisplayName("selectVariableModification - Mapper返回数据列表 → 映射后返回200")
    void select_listHasData_returnsMappedData() {
        queryRequest.setSerie("ABCD");
        queryRequest.setChno("12345");

        HdocAdcaModification mod1 = new HdocAdcaModification();
        mod1.setVariable("VIN");
        mod1.setDescription("Vehicle Identification Number");
        mod1.setNewval("JPCYZ50A2LT028321");

        HdocAdcaModification mod2 = new HdocAdcaModification();
        mod2.setVariable("ENGINE_TYPE");
        mod2.setDescription("Engine Type Code");
        mod2.setNewval("D13K");

        List<HdocAdcaModification> list = Arrays.asList(mod1, mod2);

        when(hdocAdcaModificationMapper.selectByCondition("ABCD", "12345")).thenReturn(list);

        UD05ModifyDocumentResponse response = service.selectVariableModification(queryRequest);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("ABCD12345", data.get("chassisNo"));
        assertEquals("AUS", data.get("market"));
        assertEquals("aus/UD_TEST.odt", data.get("templateFile"));

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> mods = (List<Map<String, Object>>) data.get("modifications");
        assertEquals(2, mods.size());

        // 验证字段映射: newval → currentValue
        assertEquals("VIN", mods.get(0).get("variable"));
        assertEquals("Vehicle Identification Number", mods.get(0).get("description"));
        assertEquals("JPCYZ50A2LT028321", mods.get(0).get("currentValue"));
        assertEquals("", mods.get(0).get("modifiedValue"));

        assertEquals("ENGINE_TYPE", mods.get(1).get("variable"));
        assertEquals("Engine Type Code", mods.get(1).get("description"));
        assertEquals("D13K", mods.get(1).get("currentValue"));
        assertEquals("", mods.get(1).get("modifiedValue"));

        verify(hdocAdcaModificationMapper).selectByCondition("ABCD", "12345");
    }

    // =========================================================================
    // updateHdocAdcaModification 方法
    // =========================================================================

    // -------------------------------------------------------
    // 分支: modifications == null
    // 分支: modifications.isEmpty()
    // 预期: code=400, msg="修改列表不能为空"
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - modifications为null → 返回400")
    void update_modificationsNull_returns400() {
        updateRequest.setChassisNo("ABCD12345");
        updateRequest.setModifications(null);

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(400, response.getCode());
        assertEquals("修改列表不能为空", response.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    @Test
    @DisplayName("updateHdocAdcaModification - modifications为空列表 → 返回400")
    void update_modificationsEmpty_returns400() {
        updateRequest.setChassisNo("ABCD12345");
        updateRequest.setModifications(Collections.emptyList());

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(400, response.getCode());
        assertEquals("修改列表不能为空", response.getMsg());
        verifyNoInteractions(hdocAdcaModificationMapper);
    }

    // -------------------------------------------------------
    // 分支: chassisNo.length() >= 4 → serie=substring(0,4), chno=substring(4)
    // 分支: 更新成功 (result > 0) → successCount增加
    // 预期: code=200, successCount=1
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - chassisNo长度>=4, 更新成功 → successCount=1")
    void update_chassisNoLongEnough_updateSuccess_incrementsCount() {
        updateRequest.setChassisNo("ABCD12345");
        UD05UpdateRequest.ModificationItem item = new UD05UpdateRequest.ModificationItem();
        item.setVariable("VIN");
        item.setModifiedValue("NEW_VALUE");
        updateRequest.setModifications(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VIN", "NEW_VALUE"))
                .thenReturn(1);

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("更新成功", data.get("msg"));
        assertEquals(1, data.get("successCount"));

        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VIN", "NEW_VALUE");
    }

    // -------------------------------------------------------
    // 分支: chassisNo.length() < 4 → serie=chassisNo, chno=""
    // 分支: 更新不成功 (result == 0) → successCount不变
    // 预期: code=200, successCount=0
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - chassisNo长度<4, 更新失败 → successCount=0")
    void update_chassisNoTooShort_updateFails_successCountZero() {
        updateRequest.setChassisNo("AB");
        UD05UpdateRequest.ModificationItem item = new UD05UpdateRequest.ModificationItem();
        item.setVariable("VIN");
        item.setModifiedValue("NEW_VALUE");
        updateRequest.setModifications(Collections.singletonList(item));

        // chassisNo.length()=2 < 4 → serie="AB", chno=""
        when(hdocAdcaModificationMapper.updateNewVal("AB", "", "VIN", "NEW_VALUE"))
                .thenReturn(0);

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());
        assertNotNull(response.getData());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("更新成功", data.get("msg"));
        assertEquals(0, data.get("successCount"));

        verify(hdocAdcaModificationMapper).updateNewVal("AB", "", "VIN", "NEW_VALUE");
    }

    // -------------------------------------------------------
    // 分支: chnasisNo.length()恰好等于4 → serie=substring(0,4), chno=""
    // 预期: code=200
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - chassisNo长度等于4 → chno为空串")
    void update_chassisNoLengthFour_chnoIsEmpty() {
        updateRequest.setChassisNo("ABCD");
        UD05UpdateRequest.ModificationItem item = new UD05UpdateRequest.ModificationItem();
        item.setVariable("ENGINE");
        item.setModifiedValue("NEW_ENGINE");
        updateRequest.setModifications(Collections.singletonList(item));

        // chassisNo.length()=4 >= 4 → serie="ABCD", chno=substring(4)=""
        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "", "ENGINE", "NEW_ENGINE"))
                .thenReturn(1);

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(1, data.get("successCount"));

        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "", "ENGINE", "NEW_ENGINE");
    }

    // -------------------------------------------------------
    // 分支: Exception抛出 → catch块处理, 继续下一条
    // 分支: 多条数据, 部分成功部分失败
    // 预期: code=200, successCount=2 (3条中2条成功)
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - 部分更新抛出异常 / 部分成功 → 继续处理剩余/累计成功数")
    void update_someItemsThrowException_someSucceed_partialSuccess() {
        updateRequest.setChassisNo("ABCD12345");

        // 第一条: 抛出异常
        UD05UpdateRequest.ModificationItem item1 = new UD05UpdateRequest.ModificationItem();
        item1.setVariable("VAR1");
        item1.setModifiedValue("VAL1");

        // 第二条: 成功
        UD05UpdateRequest.ModificationItem item2 = new UD05UpdateRequest.ModificationItem();
        item2.setVariable("VAR2");
        item2.setModifiedValue("VAL2");

        // 第三条: 成功
        UD05UpdateRequest.ModificationItem item3 = new UD05UpdateRequest.ModificationItem();
        item3.setVariable("VAR3");
        item3.setModifiedValue("VAL3");

        updateRequest.setModifications(Arrays.asList(item1, item2, item3));

        // item1: 抛出异常
        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR1", "VAL1"))
                .thenThrow(new RuntimeException("DB error"));
        // item2: 成功
        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR2", "VAL2"))
                .thenReturn(1);
        // item3: 成功
        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR3", "VAL3"))
                .thenReturn(1);

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("更新成功", data.get("msg"));
        assertEquals(2, data.get("successCount"));

        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR1", "VAL1");
        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR2", "VAL2");
        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR3", "VAL3");
    }

    // -------------------------------------------------------
    // 分支: 全部抛出异常 → successCount=0
    // 预期: code=200, successCount=0
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - 全部项目抛出异常 → successCount=0")
    void update_allItemsThrowException_successCountZero() {
        updateRequest.setChassisNo("ABCD12345");

        UD05UpdateRequest.ModificationItem item = new UD05UpdateRequest.ModificationItem();
        item.setVariable("VAR1");
        item.setModifiedValue("VAL1");
        updateRequest.setModifications(Collections.singletonList(item));

        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR1", "VAL1"))
                .thenThrow(new RuntimeException("DB error"));

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("更新成功", data.get("msg"));
        assertEquals(0, data.get("successCount"));

        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR1", "VAL1");
    }

    // -------------------------------------------------------
    // 分支: 多条数据, 全部成功
    // 预期: code=200, successCount=3
    // -------------------------------------------------------

    @Test
    @DisplayName("updateHdocAdcaModification - 多条数据全部成功 → successCount=3")
    void update_allItemsSucceed_fullSuccess() {
        updateRequest.setChassisNo("ABCD12345");

        UD05UpdateRequest.ModificationItem item1 = new UD05UpdateRequest.ModificationItem();
        item1.setVariable("VAR1");
        item1.setModifiedValue("VAL1");

        UD05UpdateRequest.ModificationItem item2 = new UD05UpdateRequest.ModificationItem();
        item2.setVariable("VAR2");
        item2.setModifiedValue("VAL2");

        UD05UpdateRequest.ModificationItem item3 = new UD05UpdateRequest.ModificationItem();
        item3.setVariable("VAR3");
        item3.setModifiedValue("VAL3");

        updateRequest.setModifications(Arrays.asList(item1, item2, item3));

        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR1", "VAL1")).thenReturn(1);
        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR2", "VAL2")).thenReturn(1);
        when(hdocAdcaModificationMapper.updateNewVal("ABCD", "12345", "VAR3", "VAL3")).thenReturn(1);

        UD05ModifyDocumentResponse response = service.updateHdocAdcaModification(updateRequest);

        assertEquals(200, response.getCode());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals(3, data.get("successCount"));

        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR1", "VAL1");
        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR2", "VAL2");
        verify(hdocAdcaModificationMapper).updateNewVal("ABCD", "12345", "VAR3", "VAL3");
    }
}
