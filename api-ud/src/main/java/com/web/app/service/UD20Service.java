package com.web.app.service;

import java.util.List;
import java.util.Map;

/**

 * UD20Service

 */

public interface UD20Service {
    List<Map<String, Object>> getDocumentList(String documentType, String documentTypeOp, String user, String userOp, String date, String dateOp);
}
