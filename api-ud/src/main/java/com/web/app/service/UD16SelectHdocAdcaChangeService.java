package com.web.app.service;

import com.web.app.dto.*;

public interface UD16SelectHdocAdcaChangeService {
    UD16ADChangeResponse insertADChange(UD16ADChangeRequest request);
    UD16ADChangeResponse deleteADChange(UD16ADChangeRequest request);
}
