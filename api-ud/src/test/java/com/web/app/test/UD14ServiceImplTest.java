package com.web.app.test;

import com.web.app.domain.ApiResponse;
import com.web.app.domain.Entity.MarketMaster;
import com.web.app.mapper.UD14Mapper;
import com.web.app.service.impl.UD14ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD14ServiceImpl 单元测试
 * 覆盖 getMarkets / getVariablesByMarket / formatFileSize の全分支
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UD14ServiceImpl 单元测试")
class UD14ServiceImplTest {

    @Mock
    private UD14Mapper ud14Mapper;

    @InjectMocks
    private UD14ServiceImpl service;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() throws Exception {
        reset(ud14Mapper);
        // uploadDir を一時ディレクトリに設定
        java.lang.reflect.Field field = UD14ServiceImpl.class.getDeclaredField("uploadDir");
        field.setAccessible(true);
        field.set(service, tempDir.toString());
    }

    // ========================================================================
    // getMarkets
    // ========================================================================
    @Nested
    @DisplayName("getMarkets")
    class GetMarketsTest {

        @Test
        @DisplayName("正常系-市場一覧取得成功")
        void testSuccess() {
            List<MarketMaster> mockList = new ArrayList<>();
            MarketMaster m1 = new MarketMaster(); m1.setMarket("JPN");
            MarketMaster m2 = new MarketMaster(); m2.setMarket("USA");
            mockList.add(m1);
            mockList.add(m2);

            when(ud14Mapper.selectMarketMaster()).thenReturn(mockList);

            ApiResponse<?> resp = service.getMarkets();
            assertEquals(200, resp.getCode().intValue());
            assertNotNull(resp.getData());
            verify(ud14Mapper, times(1)).selectMarketMaster();
        }

        @Test
        @DisplayName("異常系-mapper例外→500")
        void testMapperException() {
            when(ud14Mapper.selectMarketMaster()).thenThrow(new RuntimeException("DB error"));
            ApiResponse<?> resp = service.getMarkets();
            assertEquals(500, resp.getCode().intValue());
        }
    }

    // ========================================================================
    // getVariablesByMarket
    // ========================================================================
    @Nested
    @DisplayName("getVariablesByMarket")
    class GetVariablesByMarketTest {

        private final String validMarket = "JPN";

        @Test
        @DisplayName("marketがnull→400")
        void testMarketNull() {
            ApiResponse<?> resp = service.getVariablesByMarket(null);
            assertEquals(400, resp.getCode().intValue());
            verifyNoInteractions(ud14Mapper);
        }

        @Test
        @DisplayName("marketが空文字→400")
        void testMarketEmpty() {
            ApiResponse<?> resp = service.getVariablesByMarket("");
            assertEquals(400, resp.getCode().intValue());
            verifyNoInteractions(ud14Mapper);
        }

        @Test
        @DisplayName("marketが空白のみ→400")
        void testMarketBlank() {
            ApiResponse<?> resp = service.getVariablesByMarket("   ");
            assertEquals(400, resp.getCode().intValue());
            verifyNoInteractions(ud14Mapper);
        }

        @Test
        @DisplayName("市場ディレクトリが存在しない→空リスト200")
        void testMarketDirNotExists() {
            ApiResponse<?> resp = service.getVariablesByMarket("NONEXIST");
            assertEquals(200, resp.getCode().intValue());
            List<?> list = (List<?>) resp.getData();
            assertTrue(list.isEmpty());
            verifyNoInteractions(ud14Mapper);
        }

        @Test
        @DisplayName("市場ディレクトリが存在するが空→空リスト200")
        void testMarketDirEmpty() throws Exception {
            Files.createDirectories(tempDir.resolve(validMarket));

            ApiResponse<?> resp = service.getVariablesByMarket(validMarket);
            assertEquals(200, resp.getCode().intValue());
            List<?> list = (List<?>) resp.getData();
            assertTrue(list.isEmpty());
            verifyNoInteractions(ud14Mapper);
        }

        @Test
        @DisplayName("ファイル存在-mapperが変数を返す→usedに連結文字列200")
        void testFilesWithVariables() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve(validMarket));
            Files.createFile(marketDir.resolve("template1.rtf"));

            List<String> variables = new ArrayList<>();
            variables.add("VAR_A");
            variables.add("VAR_B");
            when(ud14Mapper.selectVariablesByVal(eq(validMarket), eq("JPN/template1.rtf")))
                    .thenReturn(variables);

            ApiResponse<?> resp = service.getVariablesByMarket(validMarket);
            assertEquals(200, resp.getCode().intValue());
            List<?> list = (List<?>) resp.getData();
            assertEquals(1, list.size());

            @SuppressWarnings("unchecked")
            Map<String, Object> fileInfo = (Map<String, Object>) list.get(0);
            assertEquals("template1.rtf", fileInfo.get("filename"));
            assertEquals("VAR_A VAR_B", fileInfo.get("used"));
            assertNotNull(fileInfo.get("lastMod"));
            assertNotNull(fileInfo.get("size"));

            verify(ud14Mapper, times(1)).selectVariablesByVal(validMarket, "JPN/template1.rtf");
        }

        @Test
        @DisplayName("ファイル存在-mapperが空リスト→usedは空文字200")
        void testFilesWithEmptyVariables() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve(validMarket));
            Files.createFile(marketDir.resolve("template1.rtf"));

            when(ud14Mapper.selectVariablesByVal(eq(validMarket), eq("JPN/template1.rtf")))
                    .thenReturn(new ArrayList<>());

            ApiResponse<?> resp = service.getVariablesByMarket(validMarket);
            assertEquals(200, resp.getCode().intValue());
            List<?> list = (List<?>) resp.getData();
            assertEquals(1, list.size());

            @SuppressWarnings("unchecked")
            Map<String, Object> fileInfo = (Map<String, Object>) list.get(0);
            assertEquals("", fileInfo.get("used"));

            verify(ud14Mapper, times(1)).selectVariablesByVal(validMarket, "JPN/template1.rtf");
        }

        @Test
        @DisplayName("ファイル存在-mapperがnull→usedは空文字200")
        void testFilesWithNullVariables() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve(validMarket));
            Files.createFile(marketDir.resolve("template1.rtf"));

            when(ud14Mapper.selectVariablesByVal(eq(validMarket), eq("JPN/template1.rtf")))
                    .thenReturn(null);

            ApiResponse<?> resp = service.getVariablesByMarket(validMarket);
            assertEquals(200, resp.getCode().intValue());
            List<?> list = (List<?>) resp.getData();
            assertEquals(1, list.size());

            @SuppressWarnings("unchecked")
            Map<String, Object> fileInfo = (Map<String, Object>) list.get(0);
            assertEquals("", fileInfo.get("used"));

            verify(ud14Mapper, times(1)).selectVariablesByVal(validMarket, "JPN/template1.rtf");
        }

        @Test
        @DisplayName("複数ファイル-mapperがファイルごとに呼ばれる200")
        void testMultipleFiles() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve(validMarket));
            Files.createFile(marketDir.resolve("a.rtf"));
            Files.createFile(marketDir.resolve("b.rtf"));
            Files.createFile(marketDir.resolve("c.rtf"));

            when(ud14Mapper.selectVariablesByVal(eq(validMarket), anyString()))
                    .thenReturn(new ArrayList<>());

            ApiResponse<?> resp = service.getVariablesByMarket(validMarket);
            assertEquals(200, resp.getCode().intValue());
            List<?> list = (List<?>) resp.getData();
            assertEquals(3, list.size());

            verify(ud14Mapper, times(3)).selectVariablesByVal(eq(validMarket), anyString());
        }

        @Test
        @DisplayName("異常系-例外→500")
        void testException() {
            // uploadDirをnullにしてNullPointerException → catch補足
            try {
                java.lang.reflect.Field field = UD14ServiceImpl.class.getDeclaredField("uploadDir");
                field.setAccessible(true);
                field.set(service, null);
            } catch (Exception ignored) {
            }

            ApiResponse<?> resp = service.getVariablesByMarket(validMarket);
            assertEquals(500, resp.getCode().intValue());
        }
    }

    // ========================================================================
    // formatFileSize（privateメソッドはgetVariablesByMarket経由で検証）
    // ========================================================================
    @Nested
    @DisplayName("formatFileSize（getVariablesByMarket経由）")
    class FormatFileSizeTest {

        @Test
        @DisplayName("1B未満→'X B'")
        void testBytes() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve("SIZE"));
            // 1バイトのファイルを作成
            Files.write(marketDir.resolve("small.txt"), new byte[]{65});

            ApiResponse<?> resp = service.getVariablesByMarket("SIZE");
            List<?> list = (List<?>) resp.getData();
            @SuppressWarnings("unchecked")
            Map<String, Object> info = (Map<String, Object>) list.get(0);
            String size = (String) info.get("size");
            assertTrue(size.endsWith(" B"));
        }

        @Test
        @DisplayName("1KB~1MB未満→'X.X KB'")
        void testKB() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve("SIZEKB"));
            // 約10KBのファイルを作成
            byte[] content = new byte[10 * 1024];
            Files.write(marketDir.resolve("medium.txt"), content);

            ApiResponse<?> resp = service.getVariablesByMarket("SIZEKB");
            List<?> list = (List<?>) resp.getData();
            @SuppressWarnings("unchecked")
            Map<String, Object> info = (Map<String, Object>) list.get(0);
            String size = (String) info.get("size");
            assertTrue(size.endsWith(" KB"), "Expected KB format but got: " + size);
        }

        @Test
        @DisplayName("1MB以上→'X.X MB'")
        void testMB() throws Exception {
            Path marketDir = Files.createDirectories(tempDir.resolve("SIZEMB"));
            // 約2MBのファイルを作成
            byte[] content = new byte[2 * 1024 * 1024];
            Files.write(marketDir.resolve("large.txt"), content);

            ApiResponse<?> resp = service.getVariablesByMarket("SIZEMB");
            List<?> list = (List<?>) resp.getData();
            @SuppressWarnings("unchecked")
            Map<String, Object> info = (Map<String, Object>) list.get(0);
            String size = (String) info.get("size");
            assertTrue(size.endsWith(" MB"), "Expected MB format but got: " + size);
        }
    }
}
