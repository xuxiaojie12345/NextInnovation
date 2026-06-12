package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD16SelectHdocAdcaChangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ad-change")
public class UD16SelectHdocAdcaChangeController {

    @Autowired
    private UD16SelectHdocAdcaChangeService ud16SelectHdocAdcaChangeService;

    @PostMapping("/insert")
    public UD16ADChangeResponse insert(@RequestBody UD16ADChangeRequest request) {
        return ud16SelectHdocAdcaChangeService.insertADChange(request);
    }

    @PostMapping("/update")
    public UD16ADChangeResponse update(@RequestBody UD16ADChangeRequest request) {
        return ud16SelectHdocAdcaChangeService.deleteADChange(request);
    }
}
