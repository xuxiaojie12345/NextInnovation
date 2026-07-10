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

  /** 获取用户权限（用于前端控制链接显示） GET /api/v1/hdoc/user/permissions */
  @GetMapping("/user/permissions")
  public ResponseEntity<ApiResponse<UserPermissions>> getUserPermissions() {
    try {
      UserPermissions permissions = new UserPermissions();
      permissions.setCanViewTemplates(true);
      permissions.setCanEditVariables(false);
      permissions.setCanViewMarkets(true);
      permissions.setCanViewDocumentSettings(true);
      return ResponseEntity.ok(ApiResponse.success(permissions));
    } catch (Exception e) {
      return ResponseEntity.status(500).body(ApiResponse.error(500, "权限服务不可用"));
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

  /** 内部类：用户权限 */
  public static class UserPermissions {
    private boolean canViewTemplates;
    private boolean canEditVariables;
    private boolean canViewMarkets;
    private boolean canViewDocumentSettings;

    public boolean isCanViewTemplates() {
      return canViewTemplates;
    }

    public void setCanViewTemplates(boolean canViewTemplates) {
      this.canViewTemplates = canViewTemplates;
    }

    public boolean isCanEditVariables() {
      return canEditVariables;
    }

    public void setCanEditVariables(boolean canEditVariables) {
      this.canEditVariables = canEditVariables;
    }

    public boolean isCanViewMarkets() {
      return canViewMarkets;
    }

    public void setCanViewMarkets(boolean canViewMarkets) {
      this.canViewMarkets = canViewMarkets;
    }

    public boolean isCanViewDocumentSettings() {
      return canViewDocumentSettings;
    }

    public void setCanViewDocumentSettings(boolean canViewDocumentSettings) {
      this.canViewDocumentSettings = canViewDocumentSettings;
    }
  }
}
