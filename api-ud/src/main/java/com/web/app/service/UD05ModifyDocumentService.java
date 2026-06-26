package com.web.app.service;

import com.web.app.dto.ModifyDocumentResponse;
import com.web.app.dto.SaveModificationsResponse;
import java.util.List;

public interface UD05ModifyDocumentService {
    List<ModifyDocumentResponse> selectHdocAdcaModification(String serie, String chno);
    void updateHdocAdcaModification(String serie, String chno, String newval, String description, String updateUser, String updateProcess);
}
