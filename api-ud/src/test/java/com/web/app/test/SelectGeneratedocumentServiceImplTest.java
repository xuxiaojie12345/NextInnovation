package com.web.app.test;

import com.web.app.dto.SelectGeneratedocumentRequest;
import com.web.app.dto.SelectGeneratedocumentResponse;
import com.web.app.entity.GeneratedocumentQueryResult;
import com.web.app.mapper.UD04GeneratedocumentMapper;
import com.web.app.service.impl.SelectGeneratedocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
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
 * SelectGeneratedocumentServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、异常分支、正常返回分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class SelectGeneratedocumentServiceImplTest {

    @Mock
    private UD04GeneratedocumentMapper ud04Mapper;

    @InjectMocks
    private SelectGeneratedocumentServiceImpl service;

    private SelectGeneratedocumentRequest request;

    @BeforeEach
    void setUp() {
        request = new SelectGeneratedocumentRequest();
    }

    // =========================================================
    // 分支: request.getChassisNo() == null
    // 分支: request.getChassisNo().trim().isEmpty()
    // 预期: code=400, msg="底盘编号不能为空"
    // =========================================================

    @Test
    @DisplayName("chassisNo为null → 返回400")
    void chassisNoNull_returns400() {
        request.setChassisNo(null);

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(400, response.getCode());
        assertEquals("底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(ud04Mapper);
    }

    @Test
    @DisplayName("chassisNo为空字符串 → 返回400")
    void chassisNoEmpty_returns400() {
        request.setChassisNo("");

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(400, response.getCode());
        assertEquals("底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(ud04Mapper);
    }

    @Test
    @DisplayName("chassisNo为纯空格 → 返回400")
    void chassisNoBlank_returns400() {
        request.setChassisNo("   ");

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(400, response.getCode());
        assertEquals("底盘编号不能为空", response.getMsg());
        assertNull(response.getData());
        verifyNoInteractions(ud04Mapper);
    }

    // =========================================================
    // 分支: Exception抛出 → queryResults = null → 404
    // =========================================================

    @Test
    @DisplayName("Mapper抛出异常 → 返回404")
    void mapperThrowsException_returns404() {
        request.setChassisSeries("SERIES");
        request.setChassisNo("12345");
        request.setDocumentType("VIN");

        when(ud04Mapper.selectGeneratedocument("SERIES", "12345", "VIN"))
                .thenThrow(new RuntimeException("DB error"));

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(404, response.getCode());
        assertEquals("Chassis no is not exists", response.getMsg());
        assertNull(response.getData());
        verify(ud04Mapper).selectGeneratedocument("SERIES", "12345", "VIN");
    }

    // =========================================================
    // 分支: queryResults.isEmpty() == true → 404
    // =========================================================

    @Test
    @DisplayName("Mapper返回空列表 → 返回404")
    void queryResultsEmpty_returns404() {
        request.setChassisSeries("SERIES");
        request.setChassisNo("12345");

        when(ud04Mapper.selectGeneratedocument("SERIES", "12345", "")).thenReturn(Collections.emptyList());

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(404, response.getCode());
        assertEquals("Chassis no is not exists", response.getMsg());
        assertNull(response.getData());
        verify(ud04Mapper).selectGeneratedocument("SERIES", "12345", "");
    }

    // =========================================================
    // 分支: chassisSeries/documentType 为 null（走三元表达式false分支）
    // 分支: sNoteNO == null → 不解析S-Notes
    // 分支: act != "Y" → adChangeEnabled=false
    // 分支: variable == null → 不加入replacedParams
    // 分支: nullToEmpty(value) 中 value == null → 返回空串
    // =========================================================

    @Test
    @DisplayName("成功-无S-Notes/无AD Change/无变量/chassisSeries及documentType为null")
    void success_noSNotes_noAdChange_noVariables() {
        request.setChassisNo("12345");
        // chassisSeries = null → ternary false → ""
        // documentType = null → ternary false → ""

        GeneratedocumentQueryResult row = new GeneratedocumentQueryResult();
        row.setOrdernumber(null);        // nullToEmpty → ""
        row.setBuild(null);              // nullToEmpty → ""
        row.setSpec(null);               // nullToEmpty → ""
        row.setMarket(null);             // nullToEmpty → ""
        row.setLoadIndex(null);          // nullToEmpty → ""
        row.setSNoteNO(null);            // sNoteNO == null → 不解析
        row.setAct("N");                 // "Y".equals("N") → false
        row.setVariable(null);           // variable == null → 不加入

        when(ud04Mapper.selectGeneratedocument("", "12345", "")).thenReturn(Collections.singletonList(row));

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());
        assertNotNull(response.getData());

        SelectGeneratedocumentResponse.SelectGeneratedocumentData data = response.getData();
        assertEquals("null_12345", data.getChassisNo());
        assertEquals("", data.getOrdernumber());
        assertEquals("", data.getBuildWeek());
        assertEquals("", data.getSpecWeek());
        assertEquals("", data.getMarket());
        assertEquals("", data.getFrontLoadIndex());
        assertTrue(data.getSNotes().isEmpty());
        assertFalse(data.getAdChangeEnabled());
        assertEquals("", data.getAdChangeMessage());
        assertTrue(data.getReplacedParams().isEmpty());
        assertEquals("/download/vinplate/null_12345.rtf", data.getGeneratedFileUrl());
        assertEquals("4.2.1", data.getHdocVersion());

        verify(ud04Mapper).selectGeneratedocument("", "12345", "");
    }

    // =========================================================
    // 分支: sNoteNO != null && !trim().isEmpty() → 解析S-Notes (split)
    // 分支: act == "Y" → adChangeEnabled=true, message设置
    // 分支: variable != null && !isEmpty() && 不重复 → 加入replacedParams
    // 分支: nullToEmpty(value) 中 value != null → 返回原值
    // =========================================================

    @Test
    @DisplayName("成功-有S-Notes/有AD Change/有变量/chassisSeries及documentType非null")
    void success_withSNotes_withAdChange_withVariables() {
        request.setChassisSeries("SERIES");
        request.setChassisNo("12345");
        request.setDocumentType("VIN");

        GeneratedocumentQueryResult row = new GeneratedocumentQueryResult();
        row.setOrdernumber("ORD123");
        row.setBuild("2026-30");
        row.setSpec("2026-28");
        row.setMarket("-EU");
        row.setLoadIndex("92");
        row.setSNoteNO("SN001 SN002");   // split → ["SN001", "SN002"]
        row.setAct("Y");                 // "Y".equals("Y") → true
        row.setVariable("VAR1");         // 加入replacedParams

        when(ud04Mapper.selectGeneratedocument("SERIES", "12345", "VIN"))
                .thenReturn(Collections.singletonList(row));

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(200, response.getCode());
        assertEquals("查询成功", response.getMsg());

        SelectGeneratedocumentResponse.SelectGeneratedocumentData data = response.getData();
        assertEquals("SERIES_12345", data.getChassisNo());
        assertEquals("ORD123", data.getOrdernumber());
        assertEquals("2026-30", data.getBuildWeek());
        assertEquals("2026-28", data.getSpecWeek());
        assertEquals("-EU", data.getMarket());
        assertEquals("92", data.getFrontLoadIndex());
        assertEquals(2, data.getSNotes().size());
        assertEquals("SN001", data.getSNotes().get(0));
        assertEquals("SN002", data.getSNotes().get(1));
        assertEquals("The S-Notes above can affect homologation documents.", data.getSNoteMessage());
        assertTrue(data.getAdChangeEnabled());
        assertEquals("After def change detected. Document need to be modified.", data.getAdChangeMessage());
        assertEquals(1, data.getReplacedParams().size());
        assertEquals("VAR1", data.getReplacedParams().get(0));

        verify(ud04Mapper).selectGeneratedocument("SERIES", "12345", "VIN");
    }

    // =========================================================
    // 分支: sNoteNO != null && !trim().isEmpty() → false (空字符串)
    // 分支: variable 重复 → replacedParams.contains()为true → 不加入
    // 分支: variable.isEmpty() → 不加入
    // =========================================================

    @Test
    @DisplayName("成功-S-Notes为空串/有重复变量/有空白变量")
    void success_sNotesEmpty_duplicateVariables() {
        request.setChassisSeries("SERIES");
        request.setChassisNo("12345");

        GeneratedocumentQueryResult row1 = new GeneratedocumentQueryResult();
        row1.setSNoteNO("");             // !trim().isEmpty() → false
        row1.setAct("N");
        row1.setVariable("VAR1");

        GeneratedocumentQueryResult row2 = new GeneratedocumentQueryResult();
        row2.setSNoteNO("");
        row2.setAct("N");
        row2.setVariable("VAR1");        // 重复 → 不加入

        GeneratedocumentQueryResult row3 = new GeneratedocumentQueryResult();
        row3.setSNoteNO("");
        row3.setAct("N");
        row3.setVariable("");            // isEmpty() → 不加入

        List<GeneratedocumentQueryResult> results = Arrays.asList(row1, row2, row3);
        when(ud04Mapper.selectGeneratedocument("SERIES", "12345", ""))
                .thenReturn(results);

        SelectGeneratedocumentResponse response = service.selectGeneratedocument(request);

        assertEquals(200, response.getCode());
        SelectGeneratedocumentResponse.SelectGeneratedocumentData data = response.getData();
        assertEquals(1, data.getReplacedParams().size());
        assertEquals("VAR1", data.getReplacedParams().get(0));
        assertTrue(data.getSNotes().isEmpty());

        verify(ud04Mapper).selectGeneratedocument("SERIES", "12345", "");
    }
}
