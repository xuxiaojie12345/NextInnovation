package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.DocumentTypeListResponse;
import com.web.app.service.DocumentListService;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class DocumentListController extends BaseController {

  @Autowired
  private DocumentListService documentListService;

  @GetMapping("/document/types")
  public ResponseEntity<ApiResponse<List<DocumentTypeListResponse>>> getDocumentTypes() {
    try {
      List<DocumentTypeListResponse> list = documentListService.getHdocdocumentlist();
      return ok(list);
    } catch (Exception e) {
      return systemError();
    }
  }
}
