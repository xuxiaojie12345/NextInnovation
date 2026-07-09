package com.web.app.test;

import com.web.app.dto.UD18HDocUserDocAdministrationRequest;
import com.web.app.dto.UD18HDocUserDocAdministrationResponse;
import com.web.app.entity.HdocDocumentList;
import com.web.app.entity.HdocUserDoc;
import com.web.app.mapper.HdocDocumentListMapper;
import com.web.app.mapper.UserDocumentPermissionMapper;
import com.web.app.service.impl.UD18HDocUserDocAdministrationServiceImpl;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * UD18HDocUserDocAdministrationServiceImpl 单元测试
 * 覆盖所有分支：null分支、empty分支、空白分支、正常分支
 * 分支覆盖率达到 100%
 */
@ExtendWith(MockitoExtension.class)
class UD18HDocUserDocAdministrationServiceImplTest {

    @Mock
    private HdocDocumentListMapper hdocDocumentListMapper;

    @Mock
    private UserDocumentPermissionMapper userDocumentPermissionMapper;

    @InjectMocks
    private UD18HDocUserDocAdministrationServiceImpl service;

    @Captor
    private ArgumentCaptor<HdocUserDoc> userDocCaptor;

    // =========================================================================
    // getDocumentList
    // =========================================================================

    @Test
    @DisplayName("getDocumentList - 正常返回200")
    void getDocumentList_success() {
        HdocDocumentList d1 = new HdocDocumentList();
        d1.setDoctype("VIN-PLATE");
        HdocDocumentList d2 = new HdocDocumentList();
        d2.setDoctype("COC");

        when(hdocDocumentListMapper.selectAllDocumentTypes()).thenReturn(Arrays.asList(d1, d2));

        UD18HDocUserDocAdministrationResponse response = service.getDocumentList();
        assertEquals(200, response.getCode());
        assertEquals("获取成功", response.getMsg());

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) response.getData();
        @SuppressWarnings("unchecked")
        List<HdocDocumentList> docs = (List<HdocDocumentList>) data.get("documents");
        assertEquals(2, docs.size());

        verify(hdocDocumentListMapper).selectAllDocumentTypes();
    }

    // =========================================================================
    // selectUserDoc
    // =========================================================================

    // -------------------------------------------------------
    // 分支: userid为null/empty/blank → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("selectUserDoc - userid为null → 400")
    void selectUserDoc_useridNull_returns400() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid(null);

        UD18HDocUserDocAdministrationResponse response = service.selectUserDoc(req);
        assertEquals(400, response.getCode());
        assertEquals("用户ID不能为空", response.getMsg());
        verifyNoInteractions(userDocumentPermissionMapper);
    }

    @Test
    @DisplayName("selectUserDoc - userid为空串 → 400")
    void selectUserDoc_useridEmpty_returns400() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("");

        UD18HDocUserDocAdministrationResponse response = service.selectUserDoc(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(userDocumentPermissionMapper);
    }

    @Test
    @DisplayName("selectUserDoc - userid为空格 → 400")
    void selectUserDoc_useridBlank_returns400() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("   ");

        UD18HDocUserDocAdministrationResponse response = service.selectUserDoc(req);
        assertEquals(400, response.getCode());
        verifyNoInteractions(userDocumentPermissionMapper);
    }

    // -------------------------------------------------------
    // 分支: foundUserId == null → 404
    // -------------------------------------------------------

    @Test
    @DisplayName("selectUserDoc - 用户不在FunctionAuth中 → 404")
    void selectUserDoc_userNotInFunctionAuth_returns404() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("unknown");

        when(userDocumentPermissionMapper.selectUserIdFromFunctionAuth("unknown")).thenReturn(null);

        UD18HDocUserDocAdministrationResponse response = service.selectUserDoc(req);
        assertEquals(404, response.getCode());
        assertEquals("We didn't recognize the userid you entered. Please try again.", response.getMsg());
        verify(userDocumentPermissionMapper, never()).selectUserDocDoctypes(anyString());
    }

    // -------------------------------------------------------
    // 分支: foundUserId存在, doctypes为null → 返回空列表
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectUserDoc - doctypes为null → 返回空列表")
    void selectUserDoc_doctypesNull_returnsEmptyList() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("testuser");

        when(userDocumentPermissionMapper.selectUserIdFromFunctionAuth("testuser")).thenReturn("testuser");
        when(userDocumentPermissionMapper.selectUserDocDoctypes("testuser")).thenReturn(null);

        UD18HDocUserDocAdministrationResponse response = service.selectUserDoc(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("testuser", data.get("userid"));
        assertEquals(List.of(), data.get("doctypes"));

        verify(userDocumentPermissionMapper).selectUserIdFromFunctionAuth("testuser");
        verify(userDocumentPermissionMapper).selectUserDocDoctypes("testuser");
    }

    // -------------------------------------------------------
    // 分支: doctypes有数据 → 正常返回
    // -------------------------------------------------------

    @SuppressWarnings("unchecked")
    @Test
    @DisplayName("selectUserDoc - doctypes有数据 → 正常返回")
    void selectUserDoc_withDoctypes() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("testuser");

        when(userDocumentPermissionMapper.selectUserIdFromFunctionAuth("testuser")).thenReturn("testuser");
        when(userDocumentPermissionMapper.selectUserDocDoctypes("testuser"))
                .thenReturn(Arrays.asList("VIN-PLATE", "COC"));

        UD18HDocUserDocAdministrationResponse response = service.selectUserDoc(req);
        assertEquals(200, response.getCode());

        Map<String, Object> data = (Map<String, Object>) response.getData();
        assertEquals("testuser", data.get("userid"));

        List<String> doctypes = (List<String>) data.get("doctypes");
        assertEquals(2, doctypes.size());
        assertEquals("VIN-PLATE", doctypes.get(0));
        assertEquals("COC", doctypes.get(1));
    }

    // =========================================================================
    // updateUserDoc
    // =========================================================================

    // -------------------------------------------------------
    // 分支: userid为null → 400
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDoc - userid为null → 400")
    void updateUserDoc_useridNull_returns400() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid(null);

        UD18HDocUserDocAdministrationResponse response = service.updateUserDoc(req);
        assertEquals(400, response.getCode());
        assertEquals("用户ID不能为空", response.getMsg());
        verifyNoInteractions(userDocumentPermissionMapper);
    }

    // -------------------------------------------------------
    // 分支: documents为null → 只删除不插入
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDoc - documents为null → 只删除不插入")
    void updateUserDoc_documentsNull_onlyDelete() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("testuser");
        req.setDocuments(null);

        UD18HDocUserDocAdministrationResponse response = service.updateUserDoc(req);
        assertEquals(200, response.getCode());
        assertEquals("更新成功", response.getMsg());

        verify(userDocumentPermissionMapper).deleteUserDoc("testuser");
        verify(userDocumentPermissionMapper, never()).insertUserDoc(any());
    }

    // -------------------------------------------------------
    // 分支: documents为空列表 → 只删除不插入
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDoc - documents为空 → 只删除不插入")
    void updateUserDoc_documentsEmpty_onlyDelete() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("testuser");
        req.setDocuments(Collections.emptyList());

        service.updateUserDoc(req);

        verify(userDocumentPermissionMapper).deleteUserDoc("testuser");
        verify(userDocumentPermissionMapper, never()).insertUserDoc(any());
    }

    // -------------------------------------------------------
    // 分支: 有documents → 删除后逐条插入
    // -------------------------------------------------------

    @Test
    @DisplayName("updateUserDoc - 有documents → 删除+逐条插入")
    void updateUserDoc_withDocuments_insertEach() {
        UD18HDocUserDocAdministrationRequest req = new UD18HDocUserDocAdministrationRequest();
        req.setUserid("testuser");

        Map<String, String> doc1 = new HashMap<>();
        doc1.put("doctype", "VIN-PLATE");
        Map<String, String> doc2 = new HashMap<>();
        doc2.put("doctype", "COC");

        req.setDocuments(Arrays.asList(doc1, doc2));

        UD18HDocUserDocAdministrationResponse response = service.updateUserDoc(req);
        assertEquals(200, response.getCode());

        verify(userDocumentPermissionMapper).deleteUserDoc("testuser");
        verify(userDocumentPermissionMapper, times(2)).insertUserDoc(userDocCaptor.capture());

        List<HdocUserDoc> captured = userDocCaptor.getAllValues();
        assertEquals("testuser", captured.get(0).getUserid());
        assertEquals("VIN-PLATE", captured.get(0).getDoctype());
        assertEquals("testuser", captured.get(0).getRegisterUser());

        assertEquals("testuser", captured.get(1).getUserid());
        assertEquals("COC", captured.get(1).getDoctype());
        assertEquals("testuser", captured.get(1).getRegisterUser());
    }
}
