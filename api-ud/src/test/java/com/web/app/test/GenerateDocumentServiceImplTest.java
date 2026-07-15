package com.web.app.test;

import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.mapper.GenerateDocumentMapper;
import com.web.app.service.impl.GenerateDocumentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("GenerateDocumentServiceImpl Unit Tests")
class GenerateDocumentServiceImplTest {

    @Mock
    private GenerateDocumentMapper generateDocumentMapper;

    @InjectMocks
    private GenerateDocumentServiceImpl service;

    private GenerateDocumentRequest validRequest;
    private GenerateDocumentResponse mockResponse;

    @BeforeEach
    void setUp() {
        validRequest = new GenerateDocumentRequest();
        validRequest.setSerie("FH");
        validRequest.setChnr("12345");
        validRequest.setDoctype("HDOC");

        mockResponse = new GenerateDocumentResponse();
        mockResponse.setOrdernumber("ORD-001");
        mockResponse.setBuildWeek("2024-W01");
        mockResponse.setSpecWeek("2024-W01");
        mockResponse.setMarket("JP");
        mockResponse.setNoteNo("NOTE-001");
        mockResponse.setLoadIndex("LI-001");
        mockResponse.setModifyDocLink(true);
        GenerateDocumentResponse.ReplacingParam param = new GenerateDocumentResponse.ReplacingParam();
        param.setVariable("VAR001");
        mockResponse.setReplacingParameters(param);
    }

    @Nested
    @DisplayName("getGeneratedocument()")
    class GetGenerateDocument {

        @Test
        @DisplayName("Should return data when valid request and data exists")
        void shouldReturnDataWhenValidRequest() {
            when(generateDocumentMapper.findGenerateDocumentData("FH", "12345"))
                    .thenReturn(mockResponse);

            GenerateDocumentResponse result = service.getGeneratedocument(validRequest);

            assertNotNull(result);
            assertEquals("ORD-001", result.getOrdernumber());
            assertEquals("JP", result.getMarket());
            verify(generateDocumentMapper).findGenerateDocumentData("FH", "12345");
        }

        @Test
        @DisplayName("Should set modifyDocLink to false when null")
        void shouldSetModifyDocLinkFalseWhenNull() {
            mockResponse.setModifyDocLink(null);
            when(generateDocumentMapper.findGenerateDocumentData(anyString(), anyString()))
                    .thenReturn(mockResponse);

            GenerateDocumentResponse result = service.getGeneratedocument(validRequest);

            assertNotNull(result);
            assertFalse(result.getModifyDocLink());
        }

        @Test
        @DisplayName("Should create default replacingParameters when null")
        void shouldCreateDefaultReplacingParamWhenNull() {
            mockResponse.setReplacingParameters(null);
            when(generateDocumentMapper.findGenerateDocumentData(anyString(), anyString()))
                    .thenReturn(mockResponse);

            GenerateDocumentResponse result = service.getGeneratedocument(validRequest);

            assertNotNull(result);
            assertNotNull(result.getReplacingParameters());
            assertEquals("", result.getReplacingParameters().getVariable());
        }

        @Test
        @DisplayName("Should return null when no data found")
        void shouldReturnNullWhenNoData() {
            when(generateDocumentMapper.findGenerateDocumentData(anyString(), anyString()))
                    .thenReturn(null);

            GenerateDocumentResponse result = service.getGeneratedocument(validRequest);

            assertNull(result);
        }

        @Test
        @DisplayName("Should throw exception when serie is null")
        void shouldThrowWhenSerieNull() {
            validRequest.setSerie(null);

            assertThrows(IllegalArgumentException.class,
                    () -> service.getGeneratedocument(validRequest));
            verifyNoInteractions(generateDocumentMapper);
        }

        @Test
        @DisplayName("Should throw exception when serie is empty")
        void shouldThrowWhenSerieEmpty() {
            validRequest.setSerie("");

            assertThrows(IllegalArgumentException.class,
                    () -> service.getGeneratedocument(validRequest));
            verifyNoInteractions(generateDocumentMapper);
        }

        @Test
        @DisplayName("Should throw exception when chnr is null")
        void shouldThrowWhenChnrNull() {
            validRequest.setChnr(null);

            assertThrows(IllegalArgumentException.class,
                    () -> service.getGeneratedocument(validRequest));
            verifyNoInteractions(generateDocumentMapper);
        }

        @Test
        @DisplayName("Should throw exception when chnr is empty")
        void shouldThrowWhenChnrEmpty() {
            validRequest.setChnr("");

            assertThrows(IllegalArgumentException.class,
                    () -> service.getGeneratedocument(validRequest));
            verifyNoInteractions(generateDocumentMapper);
        }

        @Test
        @DisplayName("Should trim serie and chnr before query")
        void shouldTrimParameters() {
            validRequest.setSerie("  FH  ");
            validRequest.setChnr("  12345  ");
            when(generateDocumentMapper.findGenerateDocumentData("FH", "12345"))
                    .thenReturn(mockResponse);

            GenerateDocumentResponse result = service.getGeneratedocument(validRequest);

            assertNotNull(result);
            verify(generateDocumentMapper).findGenerateDocumentData("FH", "12345");
        }
    }
}
