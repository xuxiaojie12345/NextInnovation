package com.web.app.controller;

import com.web.app.dto.ApiResponse;
import com.web.app.dto.MenuItem;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/v1/hdoc")
@CrossOrigin(origins = "*")
public class MenuController {
    
    @PostMapping("/menu")
    public ResponseEntity<ApiResponse<List<MenuItem>>> getMenu(@RequestParam String userId) {
        try {
            // 根据用户ID获取菜单权限（这里简化为固定菜单）
            List<MenuItem> menuItems = getMainMenuItems(userId);
            return ResponseEntity.ok(ApiResponse.success(menuItems));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(ApiResponse.error(500, "System error. Please contact administrator."));
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
        loginItem.setHasPermission(true);
        items.add(loginItem);
        
        MenuItem documentTypesItem = new MenuItem();
        documentTypesItem.setId("documentTypes");
        documentTypesItem.setName("Document Types");
        documentTypesItem.setPath("/document-types");
        documentTypesItem.setIcon("file");
        documentTypesItem.setHasPermission(true);
        items.add(documentTypesItem);
        
        MenuItem marketDocumentSettingsItem = new MenuItem();
        marketDocumentSettingsItem.setId("marketDocumentSettings");
        marketDocumentSettingsItem.setName("Market Document Settings");
        marketDocumentSettingsItem.setPath("/market-document-settings");
        marketDocumentSettingsItem.setIcon("setting");
        marketDocumentSettingsItem.setHasPermission(true);
        items.add(marketDocumentSettingsItem);
        
        MenuItem homologationVariablesItem = new MenuItem();
        homologationVariablesItem.setId("homologationVariables");
        homologationVariablesItem.setName("Homologation Variables");
        homologationVariablesItem.setPath("/homologation-variables");
        homologationVariablesItem.setIcon("variable");
        homologationVariablesItem.setHasPermission(true);
        items.add(homologationVariablesItem);
        
        MenuItem hdocUserAdministrationItem = new MenuItem();
        hdocUserAdministrationItem.setId("hdocUserAdministration");
        hdocUserAdministrationItem.setName("HDoc User Administration");
        hdocUserAdministrationItem.setPath("/hdoc-user-admin");
        hdocUserAdministrationItem.setIcon("admin");
        hdocUserAdministrationItem.setHasPermission(true);
        items.add(hdocUserAdministrationItem);
        
        MenuItem hdocUserDocAdministrationItem = new MenuItem();
        hdocUserDocAdministrationItem.setId("hdocUserDocAdministration");
        hdocUserDocAdministrationItem.setName("HDoc User Doc Administration");
        hdocUserDocAdministrationItem.setPath("/hdoc-user-doc-admin");
        hdocUserDocAdministrationItem.setIcon("doc-admin");
        hdocUserDocAdministrationItem.setHasPermission(true);
        items.add(hdocUserDocAdministrationItem);
        
        MenuItem adChangeItem = new MenuItem();
        adChangeItem.setId("adChange");
        adChangeItem.setName("AD Change");
        adChangeItem.setPath("/ad-change");
        adChangeItem.setIcon("change");
        adChangeItem.setHasPermission(true);
        items.add(adChangeItem);
        
        MenuItem vehicleSpecificationItem = new MenuItem();
        vehicleSpecificationItem.setId("vehicleSpecification");
        vehicleSpecificationItem.setName("Vehicle Specification");
        vehicleSpecificationItem.setPath("/vehicle-specification");
        vehicleSpecificationItem.setIcon("car");
        vehicleSpecificationItem.setHasPermission(true);
        items.add(vehicleSpecificationItem);
        
        MenuItem vinPlateItem = new MenuItem();
        vinPlateItem.setId("vinPlate");
        vinPlateItem.setName("Vin Plate");
        vinPlateItem.setPath("/vin-plate");
        vinPlateItem.setIcon("plate");
        vinPlateItem.setHasPermission(true);
        items.add(vinPlateItem);
        
        MenuItem uploadDeleteTemplateItem = new MenuItem();
        uploadDeleteTemplateItem.setId("uploadDeleteTemplate");
        uploadDeleteTemplateItem.setName("Upload & Delete Template");
        uploadDeleteTemplateItem.setPath("/upload-delete-template");
        uploadDeleteTemplateItem.setIcon("upload");
        uploadDeleteTemplateItem.setHasPermission(true);
        items.add(uploadDeleteTemplateItem);
        
        return items;
    }
}