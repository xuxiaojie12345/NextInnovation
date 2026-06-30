package com.web.app.service;

import com.web.app.dto.DocListResponse;
import com.web.app.dto.DoctypeResponse;
import java.util.List;

public interface UD18HDocUserDocAdministrationService {
    boolean selectHdocFunctionAuth(String userId);
    List<DocListResponse> getHdocDocumentList();
    List<DoctypeResponse> selectHdocUserDoc(String userId);
    void deleteAllUserDocByUserId(String userId);
    void createHdocUserDoc(String userId, String doctype, String registerUser, String registerProcess);
}
