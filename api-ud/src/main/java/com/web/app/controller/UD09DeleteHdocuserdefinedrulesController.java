package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD09DeleteHdocuserdefinedrulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud09")
public class UD09DeleteHdocuserdefinedrulesController {

    @Autowired
    private UD09DeleteHdocuserdefinedrulesService ud09DeleteHdocuserdefinedrulesService;

    @PostMapping("/search")
    public UD09SearchResponse search(@RequestBody UD09SearchRequest request) {
        return ud09DeleteHdocuserdefinedrulesService.search(request);
    }

    @PostMapping("/delete-selected")
    public UD09DeleteResponse deleteSelected(@RequestBody UD09DeleteSelectedRequest request) {
        return ud09DeleteHdocuserdefinedrulesService.deleteSelected(request);
    }
}
