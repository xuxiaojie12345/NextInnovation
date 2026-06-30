package com.web.app.service;

import com.web.app.dto.DocListResponse;
import java.util.List;

public interface UD20GetDocumentListService {
    List<DocListResponse> selectHdocDocumentList(String doctype);
}
