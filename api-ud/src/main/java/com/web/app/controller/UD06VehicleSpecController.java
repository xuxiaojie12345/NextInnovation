package com.web.app.controller;

import com.web.app.dto.UD06ModificationDetailRequest;
import com.web.app.dto.UD06ModificationDetailResponse;
import com.web.app.service.UD06VehicleSpecService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ud06")
public class UD06VehicleSpecController {

    @Autowired
    private UD06VehicleSpecService ud06VehicleSpecService;

    @GetMapping("/select-modification-details")
    public UD06ModificationDetailResponse selectModificationDetails(UD06ModificationDetailRequest request) {
        return ud06VehicleSpecService.selectModificationDetails(request);
    }
}
