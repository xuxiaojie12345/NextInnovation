package com.web.app.controller;

import com.web.app.dto.UD10HdocvariablesRequest;
import com.web.app.dto.UD10HdocvariablesResponse;
import com.web.app.service.UD10HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud10hdocvariables")
public class UD10HdocvariablesController {

    @Autowired
    private UD10HdocvariablesService ud10HdocvariablesService;

    @PostMapping("/add")
    public UD10HdocvariablesResponse add(@RequestBody UD10HdocvariablesRequest request) {
        return ud10HdocvariablesService.addVariable(request);
    }

    @PostMapping("/update")
    public UD10HdocvariablesResponse update(@RequestBody UD10HdocvariablesRequest request) {
        return ud10HdocvariablesService.updateVariable(request);
    }

    @PostMapping("/delete")
    public UD10HdocvariablesResponse delete(@RequestBody UD10HdocvariablesRequest request) {
        return ud10HdocvariablesService.deleteVariable(request);
    }
}
