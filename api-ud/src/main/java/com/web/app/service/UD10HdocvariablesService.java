package com.web.app.service;

import com.web.app.dto.Ud10VariableRequest;

public interface UD10HdocvariablesService {
    void updateVariable(Ud10VariableRequest request);
    void addVariable(Ud10VariableRequest request);
    void deleteVariable(Ud10VariableRequest request);
}
