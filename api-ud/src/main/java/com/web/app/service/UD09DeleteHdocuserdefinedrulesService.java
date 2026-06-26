package com.web.app.service;

import com.web.app.dto.*;
import java.util.List;

public interface UD09DeleteHdocuserdefinedrulesService {
    List<Ud09SearchResponse> searchHdocUserDefinedRules(Ud09SearchRequest request);
    void deleteSelected(Ud09SearchRequest request);
    int countHdocUserDefinedRules(Ud09SearchRequest request);
}
