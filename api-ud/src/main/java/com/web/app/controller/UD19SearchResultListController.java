package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD19SearchResultListService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search-result-list")
public class UD19SearchResultListController {

    @Autowired
    private UD19SearchResultListService ud19SearchResultListService;

    @PostMapping("/search")
    public UD19SearchResponse search(@RequestBody UD19SearchRequest request) {
        return ud19SearchResultListService.searchHdoc(request);
    }
}
