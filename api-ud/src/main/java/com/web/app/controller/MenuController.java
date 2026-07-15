package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.MenuItem;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class MenuController extends BaseController {

  @PostMapping("/menu")
  public ResponseEntity<ApiResponse<List<MenuItem>>> getMenu(@RequestParam String userId) {
    try {
      List<MenuItem> menuItems = getMainMenuItems(userId);
      return ok(menuItems);
    } catch (Exception e) {
      return systemError();
    }
  }

  private List<MenuItem> getMainMenuItems(String userId) {
    // 这里可以根据用户权限动态返回菜单项
    // 简化实现：返回所有菜单项
    List<MenuItem> items = new ArrayList<>();

    MenuItem loginItem = new MenuItem();
    loginItem.setId("login");
    loginItem.setName("Login");
    loginItem.setPath("/login");
    loginItem.setIcon("user");
    items.add(loginItem);

    MenuItem documentTypesItem = new MenuItem();
    documentTypesItem.setId("documentTypes");
    documentTypesItem.setName("Document Types");
    documentTypesItem.setPath("/document-types");
    documentTypesItem.setIcon("file");
    items.add(documentTypesItem);

    MenuItem marketDocumentSettingsItem = new MenuItem();
    marketDocumentSettingsItem.setId("marketDocumentSettings");
    marketDocumentSettingsItem.setName("Market Document Settings");
    marketDocumentSettingsItem.setPath("/market-document-settings");
    marketDocumentSettingsItem.setIcon("setting");
    items.add(marketDocumentSettingsItem);

    MenuItem homologationVariablesItem = new MenuItem();
    homologationVariablesItem.setId("homologationVariables");
    homologationVariablesItem.setName("Homologation Variables");
    homologationVariablesItem.setPath("/homologation-variables");
    homologationVariablesItem.setIcon("variable");
    items.add(homologationVariablesItem);

    MenuItem hdocUserAdministrationItem = new MenuItem();
    hdocUserAdministrationItem.setId("hdocUserAdministration");
    hdocUserAdministrationItem.setName("HDoc User Administration");
    hdocUserAdministrationItem.setPath("/hdoc-user-admin");
    hdocUserAdministrationItem.setIcon("admin");
    items.add(hdocUserAdministrationItem);

    MenuItem hdocUserDocAdministrationItem = new MenuItem();
    hdocUserDocAdministrationItem.setId("hdocUserDocAdministration");
    hdocUserDocAdministrationItem.setName("HDoc User Doc Administration");
    hdocUserDocAdministrationItem.setPath("/hdoc-user-doc-admin");
    hdocUserDocAdministrationItem.setIcon("doc-admin");
    items.add(hdocUserDocAdministrationItem);

    MenuItem adChangeItem = new MenuItem();
    adChangeItem.setId("adChange");
    adChangeItem.setName("AD Change");
    adChangeItem.setPath("/ad-change");
    adChangeItem.setIcon("change");
    items.add(adChangeItem);

    MenuItem vehicleSpecificationItem = new MenuItem();
    vehicleSpecificationItem.setId("vehicleSpecification");
    vehicleSpecificationItem.setName("Vehicle Specification");
    vehicleSpecificationItem.setPath("/vehicle-specification");
    vehicleSpecificationItem.setIcon("car");
    items.add(vehicleSpecificationItem);

    MenuItem vinPlateItem = new MenuItem();
    vinPlateItem.setId("vinPlate");
    vinPlateItem.setName("Vin Plate");
    vinPlateItem.setPath("/vin-plate");
    vinPlateItem.setIcon("plate");
    items.add(vinPlateItem);

    MenuItem uploadDeleteTemplateItem = new MenuItem();
    uploadDeleteTemplateItem.setId("uploadDeleteTemplate");
    uploadDeleteTemplateItem.setName("Upload & Delete Template");
    uploadDeleteTemplateItem.setPath("/upload-delete-template");
    uploadDeleteTemplateItem.setIcon("upload");
    items.add(uploadDeleteTemplateItem);

    return items;
  }
}
