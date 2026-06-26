package com.web.app.service;

import com.web.app.dto.HdocVariablesResponse;
import com.web.app.dto.CountResponse;
import com.web.app.dto.Ud11SearchRequest;
import java.util.List;

public interface UD11HdocvariablesService {
    List<HdocVariablesResponse> searchHdocVariables(Ud11SearchRequest request);
    CountResponse countHdocVariables(Ud11SearchRequest request);
}
