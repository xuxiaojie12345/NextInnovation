package com.web.app.service;

import com.web.app.dto.*;

public interface UD17HDocUserAdministrationService {
    UD17UserInfoResponse getUserInfo(UD17UserAdminRequest request);
    UD17UserAdminResponse updateRole(UD17UserAdminRequest request);
    UD17UserAdminResponse deleteRole(UD17UserAdminRequest request);
}
