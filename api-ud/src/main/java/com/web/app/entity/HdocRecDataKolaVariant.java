package com.web.app.entity;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.util.Date;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class HdocRecDataKolaVariant {
    private String familyId;
    private String variantId;
    private String functionGroup;
    private String symbol;
    private String description;
    private String transTs;
    private Date registerDatetime;
    private String registerUser;
    private String registerProcess;
    private Date updateDatetime;
    private String updateUser;
    private String updateProcess;
}
