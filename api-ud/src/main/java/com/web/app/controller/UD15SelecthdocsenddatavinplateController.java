package com.web.app.controller;

import com.web.app.dto.*;
import com.web.app.service.UD15SelecthdocsenddatavinplateService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/vin-plate")
public class UD15SelecthdocsenddatavinplateController {

    @Autowired
    private UD15SelecthdocsenddatavinplateService ud15SelecthdocsenddatavinplateService;

    @GetMapping("/view-info")
    public UD15ViewInfoResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.viewInfo(request);
    }

    @PostMapping("/set-regenerate")
    public UD15StatusUpdateResponse setRegenerate(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.setRegenerate(request);
    }

    @PostMapping("/set-ok")
    public UD15StatusUpdateResponse setOk(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.setOk(request);
    }

    @PostMapping("/change-to-advanced")
    public UD15StatusUpdateResponse changeToAdvanced(@RequestBody UD15SelecthdocsenddatavinplateRequest request) {
        return ud15SelecthdocsenddatavinplateService.changeToAdvanced(request);
    }
}
