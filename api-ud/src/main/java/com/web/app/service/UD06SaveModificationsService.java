package com.web.app.service;

import com.web.app.dto.SaveModificationsResponse;
import java.util.List;

public interface UD06SaveModificationsService {
    List<SaveModificationsResponse> selectHdocAdcaModification(String serie, String chno);
}
