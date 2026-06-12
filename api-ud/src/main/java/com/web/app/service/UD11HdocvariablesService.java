package com.web.app.service;

import com.web.app.dto.UD11SearchRequest;
import com.web.app.dto.UD11SearchResponse;

public interface UD11HdocvariablesService {
    UD11SearchResponse searchVariables(UD11SearchRequest request);
}
