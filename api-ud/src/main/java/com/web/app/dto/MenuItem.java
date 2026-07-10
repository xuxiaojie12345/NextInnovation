package com.web.app.dto;

import lombok.Data;

@Data
public class MenuItem {
  private String id;
  private String name;
  private String path;
  private String icon;
  private boolean hasPermission;
}
