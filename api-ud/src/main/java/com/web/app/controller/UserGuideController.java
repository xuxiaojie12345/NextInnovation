package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.UserGuideLink;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class UserGuideController {

  /** 获取 User Guide 帮助链接列表（基于权限过滤） GET /api/v1/hdoc/user-guide/links */
  @GetMapping("/user-guide/links")
  public ResponseEntity<ApiResponse<List<UserGuideLink>>> getHelpLinks() {
    try {
      List<UserGuideLink> links = getDefaultHelpLinks();
      return ResponseEntity.ok(ApiResponse.success(links));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(ApiResponse.error(500, "无法加载帮助菜单，请稍后重试"));
    }
  }

  private List<UserGuideLink> getDefaultHelpLinks() {
    List<UserGuideLink> links = new ArrayList<>();

    links.add(createLink("HDoc Quick Guide", "/menu/guide-user/quick-guide", null, true));
    links.add(createLink("List of document types.", "/menu/document-types", null, true));
    links.add(createLink("Markets in Hdoc", "/menu/markets-in-hdoc", null, true));
    links.add(
        createLink("HDoc - Market Document Setting", "/menu/market-document-setting", null, true));
    links.add(createLink("Describation", null, "#description", true));

    return links;
  }

  private UserGuideLink createLink(String label, String path, String externalUrl, boolean enabled) {
    UserGuideLink link = new UserGuideLink();
    link.setLabel(label);
    link.setPath(path);
    link.setExternalUrl(externalUrl);
    link.setEnabled(enabled);
    return link;
  }

}
