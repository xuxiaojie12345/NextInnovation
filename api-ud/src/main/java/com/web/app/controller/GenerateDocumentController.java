package com.web.app.controller;

import com.web.app.constant.MessageConstants;
import com.web.app.dto.ApiResponse;
import com.web.app.dto.GenerateDocumentRequest;
import com.web.app.dto.GenerateDocumentResponse;
import com.web.app.service.GenerateDocumentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class GenerateDocumentController extends BaseController {

  @Autowired
  private GenerateDocumentService generateDocumentService;

  @PostMapping("/generatedocument")
  public ResponseEntity<ApiResponse<GenerateDocumentResponse>> getGenerateDocument(
      @RequestBody GenerateDocumentRequest request) {
    try {
      if (isParamMissing(request.getSerie()) || isParamMissing(request.getChnr())) {
        return badRequest(MessageConstants.INVALID_CHASSIS_INFO);
      }

      GenerateDocumentResponse data = generateDocumentService.getGeneratedocument(request);

      if (data != null) {
        return ok(data);
      } else {
        return notFound(MessageConstants.CHASSIS_NOT_FOUND);
      }
    } catch (IllegalArgumentException e) {
      return badRequest(e.getMessage());
    } catch (Exception e) {
      return systemError();
    }
  }
}
