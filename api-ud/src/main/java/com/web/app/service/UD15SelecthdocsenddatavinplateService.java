package com.web.app.service;

import com.web.app.dto.*;

public interface UD15SelecthdocsenddatavinplateService {
    UD15ViewInfoResponse viewInfo(UD15SelecthdocsenddatavinplateRequest request);
    UD15StatusUpdateResponse setRegenerate(UD15SelecthdocsenddatavinplateRequest request);
    UD15StatusUpdateResponse setOk(UD15SelecthdocsenddatavinplateRequest request);
    UD15StatusUpdateResponse changeToAdvanced(UD15SelecthdocsenddatavinplateRequest request);
}
