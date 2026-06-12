package com.web.app.controller;

import com.web.app.dto.DoctypeListResponse;
import com.web.app.service.UD03SelectHdocdocumentlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/UD03")
public class UD03SelectHdocdocumentlistController {

    @Autowired
    private UD03SelectHdocdocumentlistService ud03SelectHdocdocumentlistService;

    @GetMapping("/select-hdoc-document-list")
    public DoctypeListResponse getDoctypeList() {
        return ud03SelectHdocdocumentlistService.getDoctypeList();
    }
}
