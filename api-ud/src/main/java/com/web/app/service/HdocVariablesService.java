package com.web.app.service;

import java.util.List;
import java.util.Map;

public interface HdocVariablesService {
  int addVariable(String variable, String type, String description, String currentUser);

  int updateVariable(String variable, String type, String description, String currentUser);

  int deleteVariable(String variable);

  List<Map<String, Object>> searchVariables(
      String variable,
      String variableOp,
      String type,
      String typeOp,
      String description,
      String descriptionOp,
      String registerUser,
      String registerUserOp,
      String registerDatetime,
      String registerDatetimeOp);
}
