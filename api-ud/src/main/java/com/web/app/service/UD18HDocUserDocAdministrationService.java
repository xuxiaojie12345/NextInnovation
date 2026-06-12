package com.web.app.service;

import com.web.app.dto.*;

public interface UD18HDocUserDocAdministrationService {
    UD18DocumentListResponse getDocumentList();
    UD18UserDocResponse selectUserDoc(UD18UserDocAdminRequest request);
    UD18UpdateUserDocResponse updateUserDoc(UD18UserDocAdminRequest request);
}
