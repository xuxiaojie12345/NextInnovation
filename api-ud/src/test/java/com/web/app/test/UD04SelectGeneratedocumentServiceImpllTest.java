package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.UD04SelectGeneratedocumentRequest;
import com.web.app.domain.UD04SelectGeneratedocumentResponse;
import com.web.app.mapper.HdocGeneratedocumentMapper;
import com.web.app.service.impl.UD04SelectGeneratedocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD04SelectGeneratedocumentServiceImpl 单元测试
 *
 * 覆盖所有分支（100%覆盖率）:
 *
 * validateRequest 内部分支:
 * 1. chassisSeries == null
 * 2. chassisSeries.trim().isEmpty()
 * 3. chassisSeries.length() != 4
 * 4. chassisNo == null
 * 5. chassisNo.trim().isEmpty()
 * 6. chassisNo.length() > 10
 * 7. chassisSeries 含非法字符
 * 8. chassisNo 含非法字符
 * 9. 全部校验通过
 *
 * selectGeneratedocument 分支:
 * 10. Mapper返回null -> 404
 * 11. Mapper返回数据 -> 200
 * 12. Mapper抛出异常 -> 500
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD04SelectGeneratedocumentServiceImpl 单元测试")
class UD04SelectGeneratedocumentServiceImpllTest {

    @Mock
    private HdocGeneratedocumentMapper hdocGeneratedocumentMapper;

    @InjectMocks
    private UD04SelectGeneratedocumentServiceImpl service;

    private UD04SelectGeneratedocumentRequest validRequest;
    private UD04SelectGeneratedocumentResponse mockResponse;

    private static final String VALID_SERIE = "JPCT";
    private static final String VALID_CHNO = "013945";

    @BeforeEach
    void setUp() {
        reset(hdocGeneratedocumentMapper);

        validRequest = new UD04SelectGeneratedocumentRequest();
        validRequest.setChassisSeries(VALID_SERIE);
        validRequest.setChassisNo(VALID_CHNO);

        mockResponse = new UD04SelectGeneratedocumentResponse();
        mockResponse.setSerie(VALID_SERIE);
        mockResponse.setChnr(VALID_CHNO);
        mockResponse.setOrdernumber("ORD123456");
        mockResponse.setBuild("2016173");
        mockResponse.setSpec("2016174");
        mockResponse.setCustomerAdap("S1810111");
        mockResponse.setCountryOfOperation("IDO");
        mockResponse.setLoadIndex("120");
        mockResponse.setAct("Y");
        mockResponse.setVariable("AXLE_CONF3 555");
        mockResponse.setNewval("555");
        mockResponse.setTemplate("VIN_PLATE.rtf");
    }

    // ============================================================
    // validateRequest 参数校验分支测试
    // ============================================================

    @Test
    @DisplayName("参数校验-ChassisSeries为null-返回400")
    void testValidate_ChassisSeriesNull() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries(null);
        req.setChassisNo(VALID_CHNO);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisSeries为空字符串-返回400")
    void testValidate_ChassisSeriesEmpty() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries("");
        req.setChassisNo(VALID_CHNO);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisSeries长度不为4-返回400")
    void testValidate_ChassisSeriesLengthNot4() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries("JPC");
        req.setChassisNo(VALID_CHNO);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series must be 4 characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisNo为null-返回400")
    void testValidate_ChassisNoNull() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo(null);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisNo为空字符串-返回400")
    void testValidate_ChassisNoEmpty() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo("");

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no is required.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisNo超过10字符-返回400")
    void testValidate_ChassisNoExceedsMaxLength() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo("01234567890");

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no must not exceed 10 characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisSeries含非法字符-返回400")
    void testValidate_ChassisSeriesInvalidChars() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries("JP_T");
        req.setChassisNo(VALID_CHNO);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis series contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    @Test
    @DisplayName("参数校验-ChassisNo含非法字符-返回400")
    void testValidate_ChassisNoInvalidChars() {
        UD04SelectGeneratedocumentRequest req = new UD04SelectGeneratedocumentRequest();
        req.setChassisSeries(VALID_SERIE);
        req.setChassisNo("0139_5");

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(req);

        assertEquals(400, result.getCode().intValue());
        assertEquals("Chassis no contains invalid characters.", result.getMsg());
        verifyNoInteractions(hdocGeneratedocumentMapper);
    }

    // ============================================================
    // selectGeneratedocument 数据库查询分支测试
    // ============================================================

    @Test
    @DisplayName("查询成功-Mapper返回数据-返回200")
    void testSelectGeneratedocument_Success() {
        when(hdocGeneratedocumentMapper.selectGeneratedocument(VALID_SERIE, VALID_CHNO))
                .thenReturn(mockResponse);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(validRequest);

        assertEquals(200, result.getCode().intValue());
        assertNotNull(result.getData());
        assertEquals(VALID_SERIE, result.getData().getSerie());
        assertEquals(VALID_CHNO, result.getData().getChnr());
        assertEquals("ORD123456", result.getData().getOrdernumber());
        assertEquals("S1810111", result.getData().getCustomerAdap());

        verify(hdocGeneratedocumentMapper, times(1))
                .selectGeneratedocument(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("查询失败-Mapper返回null-返回404")
    void testSelectGeneratedocument_NotFound() {
        when(hdocGeneratedocumentMapper.selectGeneratedocument(VALID_SERIE, VALID_CHNO))
                .thenReturn(null);

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(validRequest);

        assertEquals(404, result.getCode().intValue());
        assertEquals("Chassis not found", result.getMsg());
        assertNull(result.getData());

        verify(hdocGeneratedocumentMapper, times(1))
                .selectGeneratedocument(VALID_SERIE, VALID_CHNO);
    }

    @Test
    @DisplayName("查询异常-Mapper抛出异常-返回500")
    void testSelectGeneratedocument_MapperThrowsException() {
        when(hdocGeneratedocumentMapper.selectGeneratedocument(VALID_SERIE, VALID_CHNO))
                .thenThrow(new RuntimeException("Database connection failed"));

        ApiResponse<UD04SelectGeneratedocumentResponse> result = service.selectGeneratedocument(validRequest);

        assertEquals(500, result.getCode().intValue());
        assertEquals("System error. Please contact administrator.", result.getMsg());
        assertNull(result.getData());

        verify(hdocGeneratedocumentMapper, times(1))
                .selectGeneratedocument(VALID_SERIE, VALID_CHNO);
    }
}
