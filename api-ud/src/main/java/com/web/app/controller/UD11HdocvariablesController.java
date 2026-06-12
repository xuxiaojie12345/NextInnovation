package com.web.app.controller;

import com.web.app.dto.UD11SearchRequest;
import com.web.app.dto.UD11SearchResponse;
import com.web.app.service.UD11HdocvariablesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud11hdocvariables")
public class UD11HdocvariablesController {

    @Autowired
    private UD11HdocvariablesService ud11HdocvariablesService;

    @PostMapping("/search")
    public UD11SearchResponse search(@RequestBody UD11SearchRequest request) {
        return ud11HdocvariablesService.searchVariables(request);
    }
}
