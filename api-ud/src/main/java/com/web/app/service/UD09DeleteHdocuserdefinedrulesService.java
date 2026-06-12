package com.web.app.service;

import com.web.app.dto.UD09SearchRequest;
import com.web.app.dto.UD09DeleteSelectedRequest;
import com.web.app.dto.UD09SearchResponse;
import com.web.app.dto.UD09DeleteResponse;

public interface UD09DeleteHdocuserdefinedrulesService {
    UD09SearchResponse search(UD09SearchRequest request);
    UD09DeleteResponse deleteSelected(UD09DeleteSelectedRequest request);
}
