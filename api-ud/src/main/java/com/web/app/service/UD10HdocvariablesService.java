package com.web.app.service;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;

public interface UD10HdocvariablesService {
    UD10HdocvariablesResponse addVariable(UD10HdocvariablesRequest request);
    UD10HdocvariablesResponse updateVariable(UD10HdocvariablesRequest request);
    UD10HdocvariablesResponse deleteVariable(UD10HdocvariablesRequest request);
}
