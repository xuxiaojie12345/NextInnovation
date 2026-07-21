package com.web.app.test;

import com.web.app.domain.*;
import com.web.app.domain.entity.HdocUserDefinedRules;
import com.web.app.domain.entity.HdocVariable;
import com.web.app.domain.entity.MarketMaster;
import com.web.app.domain.entity.ProductClassMaster;
import com.web.app.mapper.UD08Mapper;
import com.web.app.service.impl.UD08ServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD08ServiceImpl 单元测试
 * 8个方法: selectProductClassMaster/selectMarketMaster/selectHdocVariables/UD08Add/UD08Update/UD08Delete/UD08Search/batchDelete
 */
class UD08ServiceImplTest {

    @Mock
    private UD08Mapper ud08Mapper;

    @InjectMocks
    private UD08ServiceImpl ud08Service;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Nested
    @DisplayName("selectProductClassMaster() 测试")
    class SelectProductClassMasterTest {

        @Test
        @DisplayName("返回产品分类列表")
        void testReturnsList() {
            ProductClassMaster pcm = new ProductClassMaster();
            pcm.setPc("PC1");
            when(ud08Mapper.selectAllProductClassMaster()).thenReturn(Collections.singletonList(pcm));

            List<ProductClassMaster> result = ud08Service.selectProductClassMaster();

            assertEquals(1, result.size());
            assertEquals("PC1", result.get(0).getPc());
        }

        @Test
        @DisplayName("返回空列表")
        void testReturnsEmpty() {
            when(ud08Mapper.selectAllProductClassMaster()).thenReturn(Collections.emptyList());

            List<ProductClassMaster> result = ud08Service.selectProductClassMaster();

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("selectMarketMaster() 测试")
    class SelectMarketMasterTest {

        @Test
        @DisplayName("返回市场列表")
        void testReturnsList() {
            MarketMaster mm = new MarketMaster();
            mm.setMarket("JPN");
            when(ud08Mapper.selectAllMarketMaster()).thenReturn(Collections.singletonList(mm));

            List<MarketMaster> result = ud08Service.selectMarketMaster();

            assertEquals(1, result.size());
            assertEquals("JPN", result.get(0).getMarket());
        }
    }

    @Nested
    @DisplayName("selectHdocVariables() 测试")
    class SelectHdocVariablesTest {

        @Test
        @DisplayName("返回变量列表")
        void testReturnsList() {
            HdocVariable hv = new HdocVariable();
            hv.setVariable("VAR1");
            when(ud08Mapper.selectAllHdocVariables()).thenReturn(Collections.singletonList(hv));

            List<HdocVariable> result = ud08Service.selectHdocVariables();

            assertEquals(1, result.size());
            assertEquals("VAR1", result.get(0).getVariable());
        }
    }

    @Nested
    @DisplayName("UD08Add() 方法测试")
    class UD08AddTest {

        @Test
        @DisplayName("添加成功 - 主键不冲突且非TEMPLATE-变量 - 返回null")
        void testAddSuccess() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");
            request.setValue("VAL1");
            request.setUpdateUser("USER1");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(0);

            String result = ud08Service.UD08Add(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).insert(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("添加失败 - 主键冲突 - 返回错误消息")
        void testAddPrimaryKeyConflict() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(1);

            String result = ud08Service.UD08Add(request);

            assertEquals("Primary key conflict, Please enter the correct content", result);
            verify(ud08Mapper, never()).insert(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("添加失败 - TEMPLATE-变量后缀不存在 - 返回错误消息")
        void testAddTemplateVariableNotFound() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("TEMPLATE-NONEXIST");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(0);
            when(ud08Mapper.countByVariable("NONEXIST")).thenReturn(0);

            String result = ud08Service.UD08Add(request);

            assertEquals("Variant does not exist, Please enter the correct content", result);
            verify(ud08Mapper, never()).insert(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("添加成功 - TEMPLATE-变量后缀存在 - 返回null")
        void testAddTemplateVariableExists() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("TEMPLATE-EXIST_VAR");
            request.setUpdateUser("USER1");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(0);
            when(ud08Mapper.countByVariable("EXIST_VAR")).thenReturn(1);

            String result = ud08Service.UD08Add(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).insert(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("添加时variable为null跳过TEMPLATE-检查")
        void testAddWithNullVariable() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable(null);
            request.setUpdateUser("USER1");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(0);

            String result = ud08Service.UD08Add(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).insert(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("添加时TEMPLATE-后缀为空串跳过变量检查")
        void testAddWithEmptyTemplateSuffix() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("TEMPLATE-");
            request.setUpdateUser("USER1");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(0);

            String result = ud08Service.UD08Add(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).insert(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("添加时updateUser为null时三元表达式走null分支")
        void testAddWithNullUpdateUser() {
            UD08AddRequest request = new UD08AddRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");

            when(ud08Mapper.countByPrimaryKey("PC1", "100", "JPN")).thenReturn(0);

            String result = ud08Service.UD08Add(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).insert(any(HdocUserDefinedRules.class));
        }
    }

    @Nested
    @DisplayName("UD08Update() 方法测试")
    class UD08UpdateTest {

        @Test
        @DisplayName("更新成功 - 记录存在且有更新字段")
        void testUpdateSuccess() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新失败 - 记录不存在")
        void testUpdateNotFound() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(null);

            String result = ud08Service.UD08Update(request);

            assertEquals("Data does not exist, Please enter the correct content", result);
            verify(ud08Mapper, never()).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("更新失败 - 无更新字段")
        void testUpdateNoFields() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            // 所有字段均为null

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertEquals("No fields to update, Please enter the correct content", result);
            verify(ud08Mapper, never()).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("覆盖分支 - variable=null, value=null, vs=non-null")
        void testUpdateBranchVsNotNull() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVs("VS_VAL");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            assertNull(ud08Service.UD08Update(request));
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("覆盖分支 - vs=null, vs2=non-null")
        void testUpdateBranchVs2NotNull() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVs2("VS2_VAL");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            assertNull(ud08Service.UD08Update(request));
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("覆盖分支 - vs2=null, addDate=non-null")
        void testUpdateBranchAddDateNotNull() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setAddDate("2024-01-01");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            assertNull(ud08Service.UD08Update(request));
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("覆盖分支 - addDate=null, updateUser=non-null")
        void testUpdateBranchUpdateUserNotNull() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            assertNull(ud08Service.UD08Update(request));
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("更新时TEMPLATE-变量检查失败")
        void testUpdateTemplateVariableNotFound() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("TEMPLATE-NONEXIST");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);
            when(ud08Mapper.countByVariable("NONEXIST")).thenReturn(0);

            String result = ud08Service.UD08Update(request);

            assertEquals("Variant does not exist, Please enter the correct content", result);
            verify(ud08Mapper, never()).updateByPrimaryKey(any());
        }

        @Test
        @DisplayName("更新时updateDatetime短格式自动补全")
        void testUpdateWithShortDatetime() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");
            request.setUpdateDatetime("2024-01-15");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时updateDatetime无效格式使用系统时间")
        void testUpdateWithInvalidDatetime() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");
            request.setUpdateDatetime("bad-date");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时updateDatetime为空串使用系统时间")
        void testUpdateWithEmptyDatetime() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");
            request.setUpdateDatetime("");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时TEMPLATE-后缀为空串跳过变量检查")
        void testUpdateWithEmptyTemplateSuffix() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("TEMPLATE-");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时TEMPLATE-变量后缀存在则通过校验")
        void testUpdateTemplateVariableExists() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("TEMPLATE-EXIST_VAR");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);
            when(ud08Mapper.countByVariable("EXIST_VAR")).thenReturn(1);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时variable为null但value有值时通过无字段检查")
        void testUpdateWithNullVariableButValueSet() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable(null);
            request.setValue("SOME_VALUE");
            request.setUpdateUser("USER1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时仅comments非空短路径到L107")
        void testUpdateWithOnlyCommentsSet() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable(null);
            request.setValue(null);
            request.setVs(null);
            request.setVs2(null);
            request.setComments("SOME_COMMENT");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时仅deleteDate非空短路径到L108")
        void testUpdateWithOnlyDeleteDateSet() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable(null);
            request.setValue(null);
            request.setVs(null);
            request.setVs2(null);
            request.setComments(null);
            request.setAddDate(null);
            request.setDeleteDate("2024-06-15");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时仅updateDatetime非空短路径到L109")
        void testUpdateWithOnlyUpdateDatetimeSet() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable(null);
            request.setValue(null);
            request.setVs(null);
            request.setVs2(null);
            request.setComments(null);
            request.setAddDate(null);
            request.setDeleteDate(null);
            request.setUpdateUser(null);
            request.setUpdateDatetime("2024-06-15 10:00:00");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }

        @Test
        @DisplayName("更新时updateUser为null三元走null分支")
        void testUpdateWithNullUpdateUser() {
            UD08UpdateRequest request = new UD08UpdateRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");
            request.setVariable("VAR1");

            HdocUserDefinedRules existing = new HdocUserDefinedRules();
            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(existing);

            String result = ud08Service.UD08Update(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).updateByPrimaryKey(any(HdocUserDefinedRules.class));
        }
    }

    @Nested
    @DisplayName("UD08Delete() 方法测试")
    class UD08DeleteTest {

        @Test
        @DisplayName("删除成功 - 记录存在")
        void testDeleteSuccess() {
            UD08DeleteRequest request = new UD08DeleteRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(new HdocUserDefinedRules());

            String result = ud08Service.UD08Delete(request);

            assertNull(result);
            verify(ud08Mapper, times(1)).deleteByPrimaryKey("PC1", "100", "JPN");
        }

        @Test
        @DisplayName("删除失败 - 记录不存在")
        void testDeleteNotFound() {
            UD08DeleteRequest request = new UD08DeleteRequest();
            request.setProductClass("PC1");
            request.setNumber("100");
            request.setMarket("JPN");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(null);

            String result = ud08Service.UD08Delete(request);

            assertEquals("Data does not exist, Please enter the correct content", result);
            verify(ud08Mapper, never()).deleteByPrimaryKey(anyString(), anyString(), anyString());
        }
    }

    @Nested
    @DisplayName("UD08Search() 方法测试")
    class UD08SearchTest {

        @Test
        @DisplayName("搜索返回结果列表")
        void testSearch() {
            UD08SearchRequest request = new UD08SearchRequest();
            HdocUserDefinedRules rule = new HdocUserDefinedRules();
            rule.setPc("PC1");
            when(ud08Mapper.searchUserDefinedRules(request)).thenReturn(Collections.singletonList(rule));

            List<HdocUserDefinedRules> result = ud08Service.UD08Search(request);

            assertEquals(1, result.size());
            assertEquals("PC1", result.get(0).getPc());
        }

        @Test
        @DisplayName("搜索返回空列表")
        void testSearchEmpty() {
            UD08SearchRequest request = new UD08SearchRequest();
            when(ud08Mapper.searchUserDefinedRules(request)).thenReturn(Collections.emptyList());

            List<HdocUserDefinedRules> result = ud08Service.UD08Search(request);

            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("batchDelete() 方法测试")
    class BatchDeleteTest {

        @Test
        @DisplayName("全部删除成功")
        void testBatchDeleteAllSuccess() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");
            UD09BatchDeleteRequest req2 = new UD09BatchDeleteRequest();
            req2.setProductClass("PC2");
            req2.setNumber("200");
            req2.setMarket("USA");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN"))
                    .thenReturn(new HdocUserDefinedRules());
            when(ud08Mapper.selectByPrimaryKey("PC2", "200", "USA"))
                    .thenReturn(new HdocUserDefinedRules());

            UD09BatchDeleteResponse result = ud08Service.batchDelete(Arrays.asList(req1, req2));

            assertAll(
                    () -> assertEquals(2, result.getDeletedCount()),
                    () -> assertEquals(0, result.getFailedCount()),
                    () -> assertEquals("2 records deleted successfully.", result.getMessage())
            );
            verify(ud08Mapper, times(2)).batchDeleteByPrimaryKey(anyString(), anyString(), anyString());
        }

        @Test
        @DisplayName("部分删除失败 - 记录不存在")
        void testBatchDeletePartialFailure() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");
            UD09BatchDeleteRequest req2 = new UD09BatchDeleteRequest();
            req2.setProductClass("PC2");
            req2.setNumber("200");
            req2.setMarket("USA");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN"))
                    .thenReturn(new HdocUserDefinedRules());
            when(ud08Mapper.selectByPrimaryKey("PC2", "200", "USA"))
                    .thenReturn(null);

            UD09BatchDeleteResponse result = ud08Service.batchDelete(Arrays.asList(req1, req2));

            assertAll(
                    () -> assertEquals(1, result.getDeletedCount()),
                    () -> assertEquals(1, result.getFailedCount()),
                    () -> assertTrue(result.getMessage().contains("records deleted"))
            );
        }

        @Test
        @DisplayName("全部删除失败 - 所有记录不存在")
        void testBatchDeleteAllFailed() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN")).thenReturn(null);

            UD09BatchDeleteResponse result = ud08Service.batchDelete(Collections.singletonList(req1));

            assertAll(
                    () -> assertEquals(0, result.getDeletedCount()),
                    () -> assertEquals(1, result.getFailedCount()),
                    () -> assertEquals("Failed to delete records. Please try again.", result.getMessage())
            );
        }

        @Test
        @DisplayName("批量删除空列表")
        void testBatchDeleteEmptyList() {
            UD09BatchDeleteResponse result = ud08Service.batchDelete(Collections.emptyList());

            assertAll(
                    () -> assertEquals(0, result.getDeletedCount()),
                    () -> assertEquals(0, result.getFailedCount()),
                    () -> assertEquals("0 records deleted successfully.", result.getMessage())
            );
        }

        @Test
        @DisplayName("批量删除时Mapper抛出异常")
        void testBatchDeleteWithException() {
            UD09BatchDeleteRequest req1 = new UD09BatchDeleteRequest();
            req1.setProductClass("PC1");
            req1.setNumber("100");
            req1.setMarket("JPN");

            when(ud08Mapper.selectByPrimaryKey("PC1", "100", "JPN"))
                    .thenThrow(new RuntimeException("DB error"));

            UD09BatchDeleteResponse result = ud08Service.batchDelete(Collections.singletonList(req1));

            assertAll(
                    () -> assertEquals(0, result.getDeletedCount()),
                    () -> assertEquals(1, result.getFailedCount())
            );
        }
    }
}
